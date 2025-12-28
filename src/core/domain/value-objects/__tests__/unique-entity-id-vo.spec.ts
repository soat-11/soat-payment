import { faker } from '@faker-js/faker';

import { UniqueEntityID } from '@/core/domain/value-objects/unique-entity-id.vo';

describe('unique-entity-id', () => {
  it('Should compare the same value', () => {
    const uuid = faker.string.uuid();
    const id = UniqueEntityID.create(uuid);
    const expectedId = UniqueEntityID.create(uuid);

    expect(id.equals(expectedId)).toBeTruthy();
  });

  it('Should returns false when value is diff', () => {
    const uuid1 = faker.string.uuid();
    const uuid2 = faker.string.uuid();
    const id1 = UniqueEntityID.create(uuid1);
    const id2 = UniqueEntityID.create(uuid2);
    expect(id1.equals(id2)).toBeFalsy();
  });
});
