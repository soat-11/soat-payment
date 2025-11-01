import {
  AbstractMapper,
  MapperException,
} from '@core/domain/mapper/abstract.mapper';

import { Result } from '@core/domain/result';
import { UniqueEntityID } from '@core/domain/value-objects/unique-entity-id.vo';
import { AbstractLoggerService } from '@core/infra/logger/abstract-logger';
import { FindOptionsWhere, Repository } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity.js';

type DefaultObject = object & {
  id: UniqueEntityID;
};

export class RepositoryException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RepositoryException';
  }
}

export abstract class DefaultTypeormRepository<
  T extends DefaultObject,
  TORM extends DefaultObject,
> {
  constructor(
    private readonly repository: Repository<TORM>,
    private readonly mapper: AbstractMapper<TORM, T>,
    private readonly logger: AbstractLoggerService,
  ) {}

  async create(entity: T): Promise<Result<T>> {
    try {
      this.logger.log(`Creating ${this.constructor.name} item`);
      const resultMapper = this.mapper.toORM(entity);

      if (resultMapper.isFailure) {
        this.logger.error(
          `Error mapping ${this.constructor.name}: ${resultMapper.error}`,
        );
        return Result.fail(resultMapper.error);
      }

      const data = resultMapper.value;

      if (!data) {
        this.logger.error(
          `Error mapping ${this.constructor.name}: data is null`,
        );
        return Result.fail(
          new MapperException(`Error mapping ${this.constructor.name}`),
        );
      }

      this.logger.log(`Created ${this.constructor.name} item`, {
        id: data,
      });

      await this.repository.save(data);

      return Result.ok(entity);
    } catch (e) {
      this.logger.error(`Error creating ${this.constructor.name}`, {
        error: this.logger.unwrapError(e),
      });

      return Result.fail(new RepositoryException('Error creating item'));
    }
  }

  async findById(input: UniqueEntityID): Promise<Result<T>> {
    try {
      const response = await this.repository.findOneBy({
        id: input,
      } as FindOptionsWhere<TORM>);

      if (!response) {
        this.logger.warn(
          `${this.constructor.name} not found with id: ${input.value}`,
        );
        return Result.fail(
          new RepositoryException(`${this.constructor.name} not found`),
        );
      }

      const mappedResponse = this.mapper.toDomain(response);

      if (mappedResponse.isFailure) {
        return Result.fail(mappedResponse.error);
      }

      const item = mappedResponse.value;

      if (!item) {
        return Result.fail(
          new MapperException('Error mapping item to domain entity'),
        );
      }

      return Result.ok(item);
    } catch (error) {
      this.logger.error(`Error finding ${this.constructor.name} by id`, {
        error: this.logger.unwrapError(error),
      });
      return Result.fail(new RepositoryException('Error finding item by id'));
    }
  }

  private mapperListToDomainList(response: TORM[]): Result<T[]> {
    const mappedResponse = response.map((item) => this.mapper.toDomain(item));

    const errors = mappedResponse.filter((item) => item.isFailure);

    if (errors.length > 0) {
      this.logger.error(
        `Error mapping ${this.constructor.name} list to domain entities`,
        {
          error: this.logger.unwrapError(errors[0].error),
        },
      );
      return Result.fail(errors[0].error);
    }

    const items = mappedResponse.map((item) => item.value);

    if (items.some((item) => !item)) {
      this.logger.error(
        `Error mapping ${this.constructor.name} list to domain entities: some items are null`,
      );
      return Result.fail(
        new MapperException('Error mapping items to domain entities'),
      );
    }

    return Result.ok(items);
  }

  async findAll(): Promise<Result<T[]>> {
    try {
      const response = await this.repository.find();

      const mapperResponse = this.mapperListToDomainList(response);

      if (mapperResponse.isFailure) {
        this.logger.error(
          `Error mapping ${this.constructor.name} list to domain entities`,
          {
            error: this.logger.unwrapError(mapperResponse.error),
          },
        );
        return Result.fail(mapperResponse.error);
      }

      return mapperResponse;
    } catch (error) {
      this.logger.error(`Error finding ${this.constructor.name} items`, {
        error: this.logger.unwrapError(error),
      });
      return Result.fail(new RepositoryException('Error finding items'));
    }
  }

  async findBy(params: Partial<T>): Promise<Result<T[]>> {
    try {
      const response = await this.repository.findBy({
        id: params.id,
      } as FindOptionsWhere<TORM>);

      const mapperResponse = this.mapperListToDomainList(response);

      if (mapperResponse.isFailure) {
        this.logger.error(
          `Error mapping ${this.constructor.name} list to domain entities`,
          {
            error: this.logger.unwrapError(mapperResponse.error),
          },
        );
        return Result.fail(mapperResponse.error);
      }

      return mapperResponse;
    } catch (error) {
      this.logger.error(`Error finding ${this.constructor.name} items`, {
        error: this.logger.unwrapError(error),
      });
      return Result.fail(new RepositoryException('Error finding items'));
    }
  }

  async update(input: UniqueEntityID, item: Partial<T>): Promise<Result<T>> {
    try {
      this.logger.log(
        `Updating ${this.constructor.name} item with id: ${input.value}`,
      );
      const response = await this.repository.update(
        {
          id: input,
        } as FindOptionsWhere<TORM>,
        item as QueryDeepPartialEntity<TORM>,
      );

      if (!response.affected || response.affected === 0) {
        this.logger.warn(
          `${this.constructor.name} not updated with id: ${input.value}`,
        );
        return Result.ok(response.raw);
      }

      this.logger.log(`Updated ${this.constructor.name} item`, {
        id: input,
        changes: item,
      });

      return Result.ok(response.raw as T);
    } catch (error) {
      this.logger.error(`Error updating ${this.constructor.name} item`, {
        error: this.logger.unwrapError(error),
      });
      return Result.fail(new RepositoryException('Error updating item'));
    }
  }

  async delete(input: UniqueEntityID): Promise<Result<T>> {
    try {
      this.logger.log(
        `Deleting ${this.constructor.name} item with id: ${input.value}`,
      );
      const response = await this.repository.delete({
        id: input,
      } as FindOptionsWhere<TORM>);
      if (!response.affected || response.affected === 0) {
        this.logger.warn(
          `${this.constructor.name} not deleted with id: ${input.value}`,
        );
        return Result.fail(
          new RepositoryException(
            `${this.constructor.name} not found for deletion`,
          ),
        );
      }

      this.logger.log(`Deleted ${this.constructor.name} item`, {
        id: input,
      });
      return Result.ok(response.raw as T);
    } catch (error) {
      this.logger.error(`Error deleting ${this.constructor.name} item`, {
        error: this.logger.unwrapError(error),
      });
      return Result.fail(new RepositoryException('Error deleting item'));
    }
  }
}
