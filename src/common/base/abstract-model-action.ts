import {
  Repository,
  FindOptionsWhere,
  FindManyOptions,
  DeepPartial,
  FindOneOptions,
  ObjectLiteral,
  QueryDeepPartialEntity,
} from 'typeorm';
import {
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import * as sysMsg from '../../constants/system.messages';

/**
 * Pagination options for list operations
 */
export interface IPaginationPayload {
  page?: number;
  limit?: number;
}

/**
 * Pagination metadata returned from list operations
 */
export interface IPaginationMeta {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

/**
 * Response structure for list operations
 */
export interface IListResponse<T> {
  payload: T[];
  pagination_meta: IPaginationMeta;
}

/**
 * Options for create operations
 */
export interface ICreateOptions<T> {
  create_payload: DeepPartial<T>;
}

/**
 * Options for update operations
 */
export interface IUpdateOptions<T> {
  identifier_options: FindOptionsWhere<T>;
  update_payload: DeepPartial<T>;
}

/**
 * Options for get/find operations
 */
export interface IGetOptions<T> {
  identifier_options: FindOptionsWhere<T>;
  select?: (keyof T)[];
  relations?: string[];
}

/**
 * Options for list operations
 */
export interface IListOptions<T> {
  filter_record_options?: FindOptionsWhere<T>;
  select?: (keyof T)[];
  relations?: string[];
  order?: { [P in keyof T]?: 'ASC' | 'DESC' };
  pagination_payload?: IPaginationPayload;
}

/**
 * Options for find operations (returns array without pagination)
 */
export interface IFindOptions<T> {
  find_options: FindOptionsWhere<T>;
  select?: (keyof T)[];
  relations?: string[];
  order?: { [P in keyof T]?: 'ASC' | 'DESC' };
}

/**
 * Response structure for find operations
 */
export interface IFindResponse<T> {
  payload: T[];
}

/**
 * Abstract base class for TypeORM repository actions
 * Provides standardized CRUD operations following HNG SDK pattern
 */
export abstract class AbstractModelAction<T extends ObjectLiteral> {
  constructor(protected readonly repository: Repository<T>) {}

  /**
   * Creates a new record in the database
   */
  async create(options: ICreateOptions<T>): Promise<T> {
    const { create_payload } = options;

    try {
      const entity = this.repository.create(create_payload);
      return await this.repository.save(entity);
    } catch (error: unknown) {
      const error_message =
        error instanceof Error ? error.message : 'Unknown error';
      throw new InternalServerErrorException(
        `${sysMsg.DB_CREATE_FAILED}: ${error_message}`,
      );
    }
  }

  /**
   * Updates a record in the database
   */
  async update(options: IUpdateOptions<T>): Promise<T> {
    const { identifier_options, update_payload } = options;

    try {
      await this.repository.update(
        identifier_options,
        update_payload as QueryDeepPartialEntity<T>,
      );

      const updated = await this.repository.findOne({
        where: identifier_options,
      } as FindOneOptions<T>);

      if (!updated) {
        throw new NotFoundException(sysMsg.RESOURCE_NOT_FOUND);
      }

      return updated;
    } catch (error: unknown) {
      if (error instanceof NotFoundException) throw error;
      const error_message =
        error instanceof Error ? error.message : 'Unknown error';
      throw new InternalServerErrorException(
        `${sysMsg.DB_UPDATE_FAILED}: ${error_message}`,
      );
    }
  }

  /**
   * Gets a single record by identifier
   */
  async get(options: IGetOptions<T>): Promise<T | null> {
    const { identifier_options, select, relations } = options;

    try {
      const find_options: FindOneOptions<T> = {
        where: identifier_options,
      };

      if (select && select.length > 0) {
        find_options.select = select as FindOneOptions<T>['select'];
      }

      if (relations && relations.length > 0) {
        find_options.relations = relations;
      }

      return await this.repository.findOne(find_options);
    } catch (error: unknown) {
      const error_message =
        error instanceof Error ? error.message : 'Unknown error';
      throw new InternalServerErrorException(
        `${sysMsg.DB_GET_FAILED}: ${error_message}`,
      );
    }
  }

  /**
   * Simple find one helper method (alias for get with cleaner syntax)
   */
  async find_one(options: {
    where: FindOptionsWhere<T>;
    relations?: string[];
  }): Promise<T | null> {
    return this.repository.findOne({
      where: options.where,
      relations: options.relations,
    } as FindOneOptions<T>);
  }

  /**
   * Lists records with pagination
   */
  async list(options: IListOptions<T> = {}): Promise<IListResponse<T>> {
    const {
      filter_record_options = {},
      select,
      relations,
      order,
      pagination_payload = { page: 1, limit: 20 },
    } = options;

    const { page = 1, limit = 20 } = pagination_payload;
    const skip = (page - 1) * limit;

    try {
      const find_options: FindManyOptions<T> = {
        where: filter_record_options,
        skip,
        take: limit,
      };

      if (select && select.length > 0) {
        find_options.select = select as FindManyOptions<T>['select'];
      }

      if (relations && relations.length > 0) {
        find_options.relations = relations;
      }

      if (order) {
        find_options.order = order as FindManyOptions<T>['order'];
      }

      const [payload, total] = await this.repository.findAndCount(find_options);

      const total_pages = Math.ceil(total / limit);

      return {
        payload,
        pagination_meta: {
          total,
          page,
          limit,
          total_pages,
          has_next: page < total_pages,
          has_previous: page > 1,
        },
      };
    } catch (error: unknown) {
      const error_message =
        error instanceof Error ? error.message : 'Unknown error';
      throw new InternalServerErrorException(
        `${sysMsg.DB_LIST_FAILED}: ${error_message}`,
      );
    }
  }

  /**
   * Finds records without pagination
   */
  async find(options: IFindOptions<T>): Promise<IFindResponse<T>> {
    const { find_options, select, relations, order } = options;

    try {
      const find_many_options: FindManyOptions<T> = {
        where: find_options,
      };

      if (select && select.length > 0) {
        find_many_options.select = select as FindManyOptions<T>['select'];
      }

      if (relations && relations.length > 0) {
        find_many_options.relations = relations;
      }

      if (order) {
        find_many_options.order = order as FindManyOptions<T>['order'];
      }

      const payload = await this.repository.find(find_many_options);

      return { payload };
    } catch (error: unknown) {
      const error_message =
        error instanceof Error ? error.message : 'Unknown error';
      throw new InternalServerErrorException(
        `${sysMsg.DB_FIND_FAILED}: ${error_message}`,
      );
    }
  }

  /**
   * Deletes a record (hard delete)
   */
  async delete(options: IGetOptions<T>): Promise<boolean> {
    const { identifier_options } = options;

    try {
      const result = await this.repository.delete(identifier_options);
      return (result.affected ?? 0) > 0;
    } catch (error: unknown) {
      const error_message =
        error instanceof Error ? error.message : 'Unknown error';
      throw new InternalServerErrorException(
        `${sysMsg.DB_DELETE_FAILED}: ${error_message}`,
      );
    }
  }

  /**
   * Counts records matching the filter
   */
  async count(
    filter_options: FindOptionsWhere<T> = {} as FindOptionsWhere<T>,
  ): Promise<number> {
    try {
      return await this.repository.count({ where: filter_options });
    } catch (error: unknown) {
      const error_message =
        error instanceof Error ? error.message : 'Unknown error';
      throw new InternalServerErrorException(
        `${sysMsg.DB_COUNT_FAILED}: ${error_message}`,
      );
    }
  }
}
