import { applyDecorators } from '@nestjs/common';
import { ApiQuery, ApiResponse } from '@nestjs/swagger';
import { HttpStatus } from '@nestjs/common';
import { TransactionHistoryDto } from '../dtos';

export function WalletTransactionHistoryDocs() {
  return applyDecorators(
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      description: 'Page number',
      example: 1,
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      description: 'Items per page',
      example: 20,
    }),
    ApiQuery({
      name: 'type',
      required: false,
      type: String,
      description: 'Filter by transaction type (deposit, transfer)',
      example: 'deposit',
    }),
    ApiQuery({
      name: 'status',
      required: false,
      type: String,
      description: 'Filter by status (success, failed, pending)',
      example: 'success',
    }),
    ApiQuery({
      name: 'direction',
      required: false,
      type: String,
      description: 'Filter by direction (sent, received, deposit)',
      example: 'received',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Transaction history retrieved successfully',
      type: [TransactionHistoryDto],
    })
  );
}
