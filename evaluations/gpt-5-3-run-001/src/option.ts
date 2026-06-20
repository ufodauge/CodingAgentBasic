export type Option<T> = { readonly type: "some"; readonly value: T } | { readonly type: "none" };

export const some = <T>(value: T): Option<T> => ({ type: "some", value });

export const none = <T = never>(): Option<T> => ({ type: "none" });

export const fromNullable = <T>(value: T | null | undefined): Option<T> =>
  value === null || value === undefined ? none<T>() : some(value);

export const optionMap = <T, U>(option: Option<T>, transform: (value: T) => U): Option<U> =>
  option.type === "some" ? some(transform(option.value)) : none<U>();

export const optionFlatMap = <T, U>(
  option: Option<T>,
  transform: (value: T) => Option<U>,
): Option<U> => (option.type === "some" ? transform(option.value) : none<U>());
