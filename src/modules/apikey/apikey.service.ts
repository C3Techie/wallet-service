import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { ApiKeyModelAction } from './model-actions';
import {
  CreateApiKeyDto,
  RolloverApiKeyDto,
  ApiKeyResponseDto,
  ApiKeyExpiry,
} from './dtos';
import { User } from '../auth/entities/user.entity';
import { ApiKey } from './entities/api-key.entity';
import * as sysMsg from '../../constants/system.messages';
import { ApiResponse } from '../../common/interfaces';
import { MoreThan } from 'typeorm';

@Injectable()
export class ApikeyService {
  constructor(private api_key_model_action: ApiKeyModelAction) {}

  private generate_api_key(): string {
    return `sk_${randomBytes(32).toString('hex')}`;
  }

  private async hash_api_key(api_key: string): Promise<string> {
    return bcrypt.hash(api_key, 10);
  }

  private async compare_api_key(
    api_key: string,
    hash: string,
  ): Promise<boolean> {
    return bcrypt.compare(api_key, hash);
  }

  private calculate_expiry_date(expiry: ApiKeyExpiry): Date {
    const now = new Date();
    switch (expiry) {
      case ApiKeyExpiry.ONE_HOUR:
        return new Date(now.getTime() + 60 * 60 * 1000);
      case ApiKeyExpiry.ONE_DAY:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case ApiKeyExpiry.ONE_MONTH:
        return new Date(now.setMonth(now.getMonth() + 1));
      case ApiKeyExpiry.ONE_YEAR:
        return new Date(now.setFullYear(now.getFullYear() + 1));
      default:
        throw new BadRequestException(sysMsg.INVALID_EXPIRY_FORMAT);
    }
  }

  async create_api_key(
    user: User,
    create_api_key_dto: CreateApiKeyDto,
  ): Promise<ApiResponse<ApiKeyResponseDto>> {
    // Check active API key count (not expired and not revoked)
    const active_count = await this.api_key_model_action.count({
      user: { id: user.id },
      revoked: false,
      expires_at: MoreThan(new Date()),
    } as never);

    if (active_count >= 5) {
      throw new BadRequestException(sysMsg.API_KEY_LIMIT_REACHED);
    }

    const api_key = this.generate_api_key();
    const api_key_hash = await this.hash_api_key(api_key);
    const expires_at = this.calculate_expiry_date(create_api_key_dto.expiry);

    const created = await this.api_key_model_action.create({
      create_payload: {
        name: create_api_key_dto.name,
        api_key_hash,
        permissions: create_api_key_dto.permissions,
        expires_at,
        user: { id: user.id } as User,
      },
    });

    return {
      message: sysMsg.API_KEY_CREATED,
      data: {
        id: created.id,
        api_key,
        expires_at,
      },
    };
  }

  async rollover_api_key(
    user: User,
    rollover_dto: RolloverApiKeyDto,
  ): Promise<ApiResponse<ApiKeyResponseDto>> {
    // Find the expired key
    const old_key = await this.api_key_model_action.get({
      identifier_options: {
        id: rollover_dto.expired_key_id,
        user: { id: user.id },
      } as never,
      relations: ['user'],
    });

    if (!old_key) {
      throw new NotFoundException(sysMsg.API_KEY_NOT_FOUND);
    }

    // Check if key is actually expired
    if (old_key.expires_at > new Date()) {
      throw new BadRequestException(sysMsg.API_KEY_NOT_EXPIRED);
    }

    // Check active API key count
    const active_count = await this.api_key_model_action.count({
      user: { id: user.id },
      revoked: false,
      expires_at: MoreThan(new Date()),
    } as never);

    if (active_count >= 5) {
      throw new BadRequestException(sysMsg.API_KEY_LIMIT_REACHED);
    }

    // Create new key with same permissions
    const new_api_key = this.generate_api_key();
    const new_api_key_hash = await this.hash_api_key(new_api_key);
    const new_expires_at = this.calculate_expiry_date(rollover_dto.expiry);

    const created = await this.api_key_model_action.create({
      create_payload: {
        name: old_key.name,
        api_key_hash: new_api_key_hash,
        permissions: old_key.permissions,
        expires_at: new_expires_at,
        user: { id: user.id } as User,
      },
    });

    return {
      message: sysMsg.API_KEY_ROLLED_OVER,
      data: {
        id: created.id,
        api_key: new_api_key,
        expires_at: new_expires_at,
      },
    };
  }

  async list_api_keys(
    user: User,
    page?: number,
    limit?: number,
    revoked?: boolean,
    is_active?: boolean,
  ): Promise<
    import('../../common/interfaces').PaginatedResponse<
      import('./dtos').ApiKeyListItemDto
    >
  > {
    const currentPage = page || 1;
    const currentLimit = limit || 20;

    // Build filter options
    const filter_options: { user: { id: string }; revoked?: boolean } = {
      user: { id: user.id },
    };
    if (revoked !== undefined) {
      filter_options.revoked = revoked;
    }

    const { payload, pagination_meta } = await this.api_key_model_action.list({
      filter_record_options: filter_options as never,
      order: { created_at: 'DESC' },
      pagination_payload: { page: currentPage, limit: currentLimit },
    });

    const now = new Date();
    let keys_list = payload.map((key) => {
      const is_expired = key.expires_at < now;
      const is_key_active = !key.revoked && !is_expired;

      return {
        id: key.id,
        name: key.name,
        api_key_preview: `sk_••••••••${key.id.slice(-4)}`,
        permissions: key.permissions,
        expires_at: key.expires_at,
        revoked: key.revoked,
        is_expired,
        is_active: is_key_active,
        created_at: key.created_at,
      };
    });

    // Apply is_active filter if provided
    if (is_active !== undefined) {
      keys_list = keys_list.filter((key) => key.is_active === is_active);
    }

    // Recalculate pagination if is_active filter was applied
    const filtered_total =
      is_active !== undefined ? keys_list.length : pagination_meta.total;
    const filtered_total_pages = Math.ceil(filtered_total / currentLimit);

    return {
      message: sysMsg.API_KEYS_RETRIEVED,
      data: keys_list,
      pagination: {
        total: filtered_total,
        page: pagination_meta.page,
        limit: pagination_meta.limit,
        total_pages: filtered_total_pages,
        has_next: currentPage < filtered_total_pages,
        has_previous: pagination_meta.has_previous,
      },
    };
  }

  async validate_api_key(
    api_key: string,
    required_permission?: string,
  ): Promise<{ is_valid: boolean; user_id?: string; permissions?: string[] }> {
    // Get all active (non-revoked, non-expired) keys
    const { payload: all_keys } = await this.api_key_model_action.find({
      find_options: {
        revoked: false,
        expires_at: MoreThan(new Date()),
      } as never,
      relations: ['user'],
    });

    // Find matching key by comparing hashes
    let key_record: ApiKey | null = null;
    for (const key of all_keys) {
      const is_match = await this.compare_api_key(api_key, key.api_key_hash);
      if (is_match) {
        key_record = key;
        break;
      }
    }

    if (!key_record) {
      return { is_valid: false };
    }

    if (
      required_permission &&
      !key_record.permissions.includes(required_permission)
    ) {
      return { is_valid: false };
    }

    return {
      is_valid: true,
      user_id: key_record.user.id,
      permissions: key_record.permissions,
    };
  }
}
