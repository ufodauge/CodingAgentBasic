interface IResult<T, E> {
  readonly ok: boolean;
  readonly value?: T;
  readonly error?: E;

  map<U>(transform: (value: T) => U): Result<U, E>;
  flatMap<U, F>(transform: (value: T) => Result<U, F>): Result<U, E | F>;
  mapError<F>(transform: (error: E) => F): Result<T, F>;
  unwrapOr(defaultValue: T): T;
  unwrapOrElse(defaultValue: () => T): T;
  inspect(inspect: (value: T | E) => void): IResult<T, E>;
}

export class Ok<T> implements IResult<T, never> {
  readonly ok = true;
  public readonly value: T;

  constructor(value: T) {
    this.value = value;
  }

  public map<U>(transform: (value: T) => U): Result<U, never> {
    return ok(transform(this.value));
  }

  public flatMap<U, F>(transform: (value: T) => Result<U, F>): Result<U, F> {
    return transform(this.value);
  }

  public mapError<F>(): Result<T, F> {
    return this;
  }

  public unwrapOr(): T {
    return this.value;
  }

  public unwrapOrElse(): T {
    return this.value;
  }

  public inspect(inspect: (value: T) => void): this {
    inspect(this.value);
    return this;
  }
}

export class Err<E> implements IResult<never, E> {
  readonly ok = false;
  public readonly error: E;

  constructor(error: E) {
    this.error = error;
  }

  public map<U>(): Result<U, E> {
    return this;
  }

  public flatMap<U, F>(): Result<U, E | F> {
    return this;
  }

  public mapError<F>(transform: (error: E) => F): Result<never, F> {
    return err(transform(this.error));
  }

  public unwrapOr(defaultValue: never): never {
    return defaultValue;
  }

  public unwrapOrElse(defaultValue: () => never): never {
    return defaultValue();
  }

  public inspect(inspect: (value: E) => void): this {
    inspect(this.error);
    return this;
  }
}

export type Result<T, E> = Ok<T> | Err<E>;

export const ok = <T>(value: T): Result<T, never> => new Ok(value);

export const err = <E>(error: E): Result<never, E> => new Err(error);

export const sequence = <T, E>(
  results: readonly Result<T, E>[],
): Result<readonly T[], readonly E[]> => {
  const values = results.flatMap((result) => (result.ok ? [result.value] : []));
  const errors = results.flatMap((result) => (result.ok ? [] : [result.error]));

  return errors.length > 0 ? err(errors) : ok(values);
};
