export type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });

export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

export const map = <T, E, U>(result: Result<T, E>, transform: (value: T) => U): Result<U, E> =>
  result.ok ? ok(transform(result.value)) : result;

export const flatMap = <T, E, U, F>(
  result: Result<T, E>,
  transform: (value: T) => Result<U, F>,
): Result<U, E | F> => (result.ok ? transform(result.value) : result);

export const mapError = <T, E, F>(result: Result<T, E>, transform: (error: E) => F): Result<T, F> =>
  result.ok ? result : err(transform(result.error));

export const sequence = <T, E>(
  results: readonly Result<T, E>[],
): Result<readonly T[], readonly E[]> => {
  const values = results.flatMap((result) => (result.ok ? [result.value] : []));
  const errors = results.flatMap((result) => (result.ok ? [] : [result.error]));

  return errors.length > 0 ? err(errors) : ok(values);
};
