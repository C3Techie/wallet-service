import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { createHmac } from 'crypto';
import * as sysMsg from '../../constants/system.messages';

export interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface PaystackWebhookEvent {
  event: string;
  data: {
    reference: string;
    status: string;
    amount: number;
    customer: {
      email: string;
    };
  };
}

@Injectable()
export class PaystackService {
  private readonly logger = new Logger(PaystackService.name);
  private readonly paystack_secret_key: string;
  private readonly paystack_base_url = 'https://api.paystack.co';

  constructor(private config_service: ConfigService) {
    this.paystack_secret_key =
      this.config_service.get<string>('PAYSTACK_SECRET_KEY') || '';
  }

  async initialize_transaction(
    email: string,
    amount: number,
    reference: string,
  ): Promise<PaystackInitializeResponse> {
    try {
      const response = await axios.post<PaystackInitializeResponse>(
        `${this.paystack_base_url}/transaction/initialize`,
        {
          email,
          amount,
          reference,
        },
        {
          headers: {
            Authorization: `Bearer ${this.paystack_secret_key}`,
            'Content-Type': 'application/json',
          },
        },
      );

      this.logger.log(`Paystack transaction initialized: ${reference}`);
      return response.data;
    } catch (error) {
      this.logger.error(
        `${sysMsg.PAYSTACK_INIT_FAILED}: ${(error as Error).message}`,
      );
      throw new InternalServerErrorException(sysMsg.PAYSTACK_INIT_FAILED);
    }
  }

  verify_webhook_signature(payload: string, signature: string): boolean {
    const hash = createHmac('sha512', this.paystack_secret_key)
      .update(payload)
      .digest('hex');
    return hash === signature;
  }

  async verify_transaction(reference: string): Promise<{
    status: boolean;
    data: {
      status: string;
      amount: number;
      reference: string;
    };
  }> {
    try {
      const response = await axios.get(
        `${this.paystack_base_url}/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${this.paystack_secret_key}`,
          },
        },
      );

      return response.data as {
        status: boolean;
        data: { status: string; amount: number; reference: string };
      };
    } catch (error) {
      this.logger.error(
        `${sysMsg.PAYSTACK_VERIFICATION_FAILED}: ${(error as Error).message}`,
      );
      throw new InternalServerErrorException(
        sysMsg.PAYSTACK_VERIFICATION_FAILED,
      );
    }
  }
}
