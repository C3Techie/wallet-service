import { applyDecorators } from '@nestjs/common';
import { ApiQuery, ApiResponse } from '@nestjs/swagger';
import { HttpStatus } from '@nestjs/common';
import { ApiKeyListItemDto } from '../dtos';

export function ApiKeyListDocs() {
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
      name: 'revoked',
      required: false,
      type: Boolean,
      description: 'Filter by revoked status',
      example: false,
    }),
    ApiQuery({
      name: 'is_active',
      required: false,
      type: Boolean,
      description: 'Filter by active status (not expired and not revoked)',
      example: true,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'API keys retrieved successfully',
      type: [ApiKeyListItemDto],
    }),
  );
}
