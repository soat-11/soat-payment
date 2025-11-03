export abstract class ValueObject<T> {
  protected constructor(private readonly _value: T) {
    this.validate(this._value);
    Object.freeze(this);
  }

  protected abstract validate(input: T): void;

  get value(): T {
    return this._value;
  }

  equals(vo?: ValueObject<T>): boolean {
    if (vo === null || vo === undefined) {
      return false;
    }
    if (this === vo) {
      return true;
    }

    return this._value === vo.value;
  }
}
