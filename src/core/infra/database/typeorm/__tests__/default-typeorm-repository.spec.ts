import { AbstractMapper } from '@core/domain/mapper/abstract.mapper';
import { UniqueEntityID } from '@core/domain/value-objects/unique-entity-id.vo';
import { Column, DataSource, Entity, PrimaryColumn } from 'typeorm';
import {
  DefaultTypeormRepository,
  RepositoryException,
  RepositoryNotFoundException,
} from '../default-typeorm.repository';
import { PinoLoggerService } from '@core/infra/logger/pino-logger';

import { Result } from '@core/domain/result';

@Entity()
class TestORM {
  @PrimaryColumn('varchar', {
    transformer: {
      from: (value: string): UniqueEntityID => UniqueEntityID.create(value),
      to: (value: UniqueEntityID) => value.value,
    },
  })
  id: UniqueEntityID;

  @Column('varchar', { nullable: false })
  name: string | null;
}

class TestEntity {
  constructor(
    public id: UniqueEntityID,
    public name: string | null,
  ) {}
}

class TestMapper extends AbstractMapper<TestEntity, TestORM> {
  toORM(domain: TestORM): Result<TestEntity> {
    const orm = new TestORM();
    orm.id = UniqueEntityID.create(domain.id.value);
    orm.name = domain.name;

    return Result.ok(orm);
  }
  toDomain(orm: TestORM): Result<TestEntity> {
    if (!orm.id || !orm.name) {
      return Result.fail(
        new RepositoryException('Invalid data for TestEntity'),
      );
    }

    return Result.ok(
      new TestEntity(UniqueEntityID.create(orm.id.value), orm.name),
    );
  }
}

class TestRepositoryImpl extends DefaultTypeormRepository<
  TestEntity,
  TestORM
> {}

describe('TypeORMRepository', () => {
  let datasource: DataSource;
  let repo: TestRepositoryImpl;

  beforeEach(async () => {
    datasource = new DataSource({
      type: 'sqlite',
      database: ':memory:',
      synchronize: true,
      entities: [TestORM],
    });

    await datasource.initialize();
    await datasource.getRepository(TestORM).clear();
    const mapper = new TestMapper();
    const dataSource = datasource.getRepository(TestORM);

    repo = new TestRepositoryImpl(
      dataSource,
      mapper,
      new PinoLoggerService({
        suppressConsole: false,
      }),
    );
  });

  afterAll(async () => {
    await datasource.destroy();
  });

  it('Should create an item', async () => {
    const response = await repo.create({
      id: UniqueEntityID.create(),
      name: 'Test Item',
    });

    expect(response.value).toMatchObject({ name: 'Test Item' });
  });

  it('Should returns an error when creating an item fails', async () => {
    const item = { id: UniqueEntityID.create(), name: null }; // Invalid item

    const response = await repo.create(item);
    expect(response.error).toBeInstanceOf(RepositoryException);
  });

  it('Should find an item by ID', async () => {
    const id = UniqueEntityID.create();
    const item = { id, name: 'Test Item' };
    await repo.create(item);

    const result = await repo.findById(id);
    expect(result.value).toMatchObject({ name: item.name });
  });

  it('Should return an error when finding an item by ID that does not exist', async () => {
    const result = await repo.findById(UniqueEntityID.create());
    expect(result.error).toBeInstanceOf(RepositoryException);
  });

  it('Should update an item', async () => {
    const id = UniqueEntityID.create();
    const item = { id, name: 'Test Item' };
    await repo.create(item);

    const updatedItem = { name: 'Updated Item' };

    await repo.update(id, updatedItem);
    const result = await repo.findById(id);
    expect(result.value).toMatchObject({ name: updatedItem.name });
  });

  it('Should return an error when updating an item with invalid data', async () => {
    const id = UniqueEntityID.create();
    const item = { id, name: 'Test Item' };
    await repo.create(item);

    const error = await repo.update(id, { name: null });

    expect(error.error).toBeInstanceOf(RepositoryException);
  });

  it('Should delete an item', async () => {
    const id = UniqueEntityID.create();
    const item = { id, name: 'Test Item' };
    await repo.create(item);

    await repo.delete(id);

    const result = await repo.findById(id);
    expect(result.error).toBeInstanceOf(RepositoryNotFoundException);
  });

  it('Should return an error when deleting an item that does not exist', async () => {
    const response = await repo.delete(UniqueEntityID.create());
    expect(response.error).toBeInstanceOf(RepositoryException);
  });
});
