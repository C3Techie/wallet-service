import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { WalletModelAction } from './model-actions';
import { TransactionModelAction } from '../transaction/model-actions';
import { PaystackService } from '../paystack/paystack.service';
import { Wallet } from './entities/wallet.entity';
import { Transaction } from '../transaction/entities/transaction.entity';
import { User } from '../auth/entities/user.entity';
import {
  DepositDto,
  TransferDto,
  DepositResponseDto,
  BalanceResponseDto,
  TransferResponseDto,
  TransactionStatusResponseDto,
  TransactionHistoryDto,
} from './dtos';
import * as sysMsg from '../../constants/system.messages';
import { ApiResponse } from '../../common/interfaces';
import { randomBytes } from 'crypto';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(
    private wallet_model_action: WalletModelAction,
    private transaction_model_action: TransactionModelAction,
    private paystack_service: PaystackService,
    @InjectRepository(Wallet)
    private wallet_repository: Repository<Wallet>,
    @InjectRepository(Transaction)
    private transaction_repository: Repository<Transaction>,
    private data_source: DataSource,
  ) {}

  private generate_wallet_number(): string {
    return randomBytes(7).toString('hex').substring(0, 13);
  }

  private generate_transaction_reference(): string {
    return `TXN_${Date.now()}_${randomBytes(8).toString('hex')}`;
  }

  async get_or_create_wallet(user: User): Promise<Wallet> {
    let wallet = await this.wallet_model_action.get({
      identifier_options: { user: { id: user.id } } as never,
      relations: ['user'],
    });

    if (!wallet) {
      const wallet_number = this.generate_wallet_number();
      wallet = await this.wallet_model_action.create({
        create_payload: {
          wallet_number,
          balance: 0,
          user: { id: user.id } as User,
        },
      });
      this.logger.log(
        `Wallet created for user ${user.email}: ${wallet_number}`,
      );
    }

    return wallet;
  }

  async deposit(
    user: User,
    deposit_dto: DepositDto,
  ): Promise<ApiResponse<DepositResponseDto>> {
    const wallet = await this.get_or_create_wallet(user);
    const reference = this.generate_transaction_reference();

    // Amount is already in kobo from the request
    // Create pending transaction (store in kobo)
    await this.transaction_model_action.create({
      create_payload: {
        type: 'deposit',
        amount: deposit_dto.amount,
        status: 'pending',
        reference,
        wallet: { id: wallet.id } as Wallet,
      },
    });

    // Initialize Paystack transaction (send in kobo)
    const paystack_response =
      await this.paystack_service.initialize_transaction(
        user.email,
        deposit_dto.amount,
        reference,
      );

    return {
      message: sysMsg.PAYSTACK_INIT_SUCCESS,
      data: {
        reference,
        authorization_url: paystack_response.data.authorization_url,
      },
    };
  }

  async handle_webhook(
    payload: string,
    signature: string,
  ): Promise<{ status: boolean }> {
    // Verify webhook signature
    const is_valid = this.paystack_service.verify_webhook_signature(
      payload,
      signature,
    );
    if (!is_valid) {
      throw new BadRequestException(sysMsg.PAYSTACK_WEBHOOK_INVALID);
    }
    const event = JSON.parse(payload) as {
      event: string;
      data: { reference: string; status: string; amount: number };
    };

    if (event.event === 'charge.success') {
      const { reference, status, amount } = event.data;

      // Use transaction to ensure atomicity
      const query_runner = this.data_source.createQueryRunner();
      await query_runner.connect();
      await query_runner.startTransaction();

      try {
        // Find transaction
        const transaction = await query_runner.manager.findOne(Transaction, {
          where: { reference },
          relations: ['wallet'],
        });

        if (!transaction) {
          this.logger.warn(`Transaction not found: ${reference}`);
          await query_runner.commitTransaction();
          return { status: true };
        }

        // Check if already processed (idempotency)
        if (transaction.status === 'success') {
          this.logger.log(`Transaction already processed: ${reference}`);
          await query_runner.commitTransaction();
          return { status: true };
        }

        // Update transaction status
        transaction.status = status === 'success' ? 'success' : 'failed';
        await query_runner.manager.save(transaction);

        // Credit wallet if successful
        if (status === 'success') {
          const wallet = await query_runner.manager.findOne(Wallet, {
            where: { id: transaction.wallet.id },
          });

          if (!wallet) {
            throw new BadRequestException(sysMsg.WALLET_NOT_FOUND);
          }

          // Ensure balance is a number before addition
          wallet.balance = Number(wallet.balance || 0) + Number(amount);
          await query_runner.manager.save(wallet);
          this.logger.log(
            `Wallet credited: ${reference} - ${amount} kobo, new balance: ${wallet.balance}`,
          );
        }

        await query_runner.commitTransaction();
        return { status: true };
      } catch (error) {
        await query_runner.rollbackTransaction();
        this.logger.error(
          `Webhook processing failed: ${(error as Error).message}`,
        );
        throw new InternalServerErrorException('Webhook processing failed');
      } finally {
        await query_runner.release();
      }
    }

    return { status: true };
  }

  async get_balance(user: User): Promise<ApiResponse<BalanceResponseDto>> {
    const wallet = await this.get_or_create_wallet(user);

    return {
      message: sysMsg.WALLET_BALANCE_RETRIEVED,
      data: {
        balance: Number(wallet.balance),
        wallet_number: wallet.wallet_number,
      },
    };
  }

  async transfer(
    user: User,
    transfer_dto: TransferDto,
  ): Promise<ApiResponse<TransferResponseDto>> {
    // Get sender wallet
    const sender_wallet = await this.get_or_create_wallet(user);

    // Check if trying to transfer to self
    if (sender_wallet.wallet_number === transfer_dto.wallet_number) {
      throw new BadRequestException(sysMsg.CANNOT_TRANSFER_TO_SELF);
    }

    // Find recipient wallet
    const recipient_wallet = await this.wallet_model_action.get({
      identifier_options: { wallet_number: transfer_dto.wallet_number },
    });

    if (!recipient_wallet) {
      throw new NotFoundException(sysMsg.RECIPIENT_WALLET_NOT_FOUND);
    }

    // Check sufficient balance
    if (sender_wallet.balance < transfer_dto.amount) {
      throw new BadRequestException(sysMsg.INSUFFICIENT_BALANCE);
    }

    // Use transaction for atomicity
    const query_runner = this.data_source.createQueryRunner();
    await query_runner.connect();
    await query_runner.startTransaction();

    try {
      // Deduct from sender
      sender_wallet.balance =
        Number(sender_wallet.balance) - Number(transfer_dto.amount);
      await query_runner.manager.save(sender_wallet);

      // Add to recipient
      recipient_wallet.balance =
        Number(recipient_wallet.balance || 0) + Number(transfer_dto.amount);
      await query_runner.manager.save(recipient_wallet);

      // Record transaction
      const reference = this.generate_transaction_reference();
      const transaction = this.transaction_repository.create({
        type: 'transfer',
        amount: transfer_dto.amount,
        status: 'success',
        reference,
        recipient_wallet_number: transfer_dto.wallet_number,
        wallet: sender_wallet,
      });
      await query_runner.manager.save(transaction);

      await query_runner.commitTransaction();

      this.logger.log(
        `Transfer successful: ${sender_wallet.wallet_number} -> ${transfer_dto.wallet_number} - ${transfer_dto.amount}`,
      );

      return {
        message: sysMsg.TRANSFER_SUCCESSFUL,
        data: {
          status: 'success',
          message: sysMsg.TRANSFER_SUCCESSFUL,
        },
      };
    } catch (error) {
      await query_runner.rollbackTransaction();
      this.logger.error(`Transfer failed: ${(error as Error).message}`);
      throw new InternalServerErrorException(sysMsg.TRANSFER_FAILED);
    } finally {
      await query_runner.release();
    }
  }

  async get_transaction_status(
    user: User,
    reference: string,
  ): Promise<ApiResponse<TransactionStatusResponseDto>> {
    const transaction = await this.transaction_model_action.get({
      identifier_options: { reference },
      relations: ['wallet', 'wallet.user'],
    });

    if (!transaction) {
      throw new NotFoundException(sysMsg.TRANSACTION_NOT_FOUND);
    }

    // Ensure the transaction belongs to the requesting user
    if (transaction.wallet.user.id !== user.id) {
      throw new NotFoundException(sysMsg.TRANSACTION_NOT_FOUND);
    }

    return {
      message: sysMsg.TRANSACTION_STATUS_RETRIEVED,
      data: {
        reference: transaction.reference,
        status: transaction.status,
        amount: transaction.amount,
      },
    };
  }

  async get_transactions(
    user: User,
    page?: number,
    limit?: number,
    type?: string,
    status?: string,
    direction?: string,
  ): Promise<
    import('../../common/interfaces').PaginatedResponse<TransactionHistoryDto>
  > {
    const wallet = await this.get_or_create_wallet(user);

    // Use pagination with default values
    const currentPage = page || 1;
    const currentLimit = limit || 20;
    const skip = (currentPage - 1) * currentLimit;

    // Build filter conditions
    const baseConditions: any[] = [
      { wallet: { id: wallet.id } },
      { recipient_wallet_number: wallet.wallet_number },
    ];

    // Get total count for pagination with filters
    let allTransactions = await this.transaction_repository.find({
      where: baseConditions,
      relations: ['wallet'],
    });

    // Apply filters after fetching (for direction filtering)
    if (type) {
      allTransactions = allTransactions.filter((txn) => txn.type === type);
    }
    if (status) {
      allTransactions = allTransactions.filter((txn) => txn.status === status);
    }
    if (direction) {
      allTransactions = allTransactions.filter((txn) => {
        if (direction === 'deposit') {
          return txn.type === 'deposit';
        } else if (direction === 'sent') {
          return (
            txn.type === 'transfer' && txn.wallet && txn.wallet.id === wallet.id
          );
        } else if (direction === 'received') {
          return (
            txn.type === 'transfer' &&
            txn.recipient_wallet_number === wallet.wallet_number
          );
        }
        return false;
      });
    }

    const total = allTransactions.length;

    // Apply pagination and sorting
    const paginatedTransactions = allTransactions
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
      .slice(skip, skip + currentLimit);

    const transactions: TransactionHistoryDto[] = paginatedTransactions.map(
      (txn) => {
        let directionValue = '';
        if (txn.type === 'deposit') {
          directionValue = 'deposit';
        } else if (txn.type === 'transfer') {
          if (txn.wallet && txn.wallet.id === wallet.id) {
            directionValue = 'sent';
          } else if (txn.recipient_wallet_number === wallet.wallet_number) {
            directionValue = 'received';
          }
        }
        return {
          type: txn.type,
          amount: txn.amount,
          status: txn.status,
          direction: directionValue,
          reference: txn.reference,
          timestamp: txn.created_at,
        };
      },
    );

    const totalPages = Math.ceil(total / currentLimit);

    return {
      message: sysMsg.TRANSACTION_HISTORY_RETRIEVED,
      data: transactions,
      pagination: {
        total,
        page: currentPage,
        limit: currentLimit,
        total_pages: totalPages,
        has_next: currentPage < totalPages,
        has_previous: currentPage > 1,
      },
    };
  }
}
