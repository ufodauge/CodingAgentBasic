import { isFiniteNumber, isRecord, isString } from "./guards.js";
import { err, ok, type Result } from "./result.js";

export type User = {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly age: number;
};

export type ValidationError =
  | { readonly field: "id"; readonly message: string }
  | { readonly field: "name"; readonly message: string }
  | { readonly field: "email"; readonly message: string }
  | { readonly field: "age"; readonly message: string };

const validateRequiredText = (
  field: "id" | "name",
  value: unknown,
): Result<string, ValidationError> => {
  if (!isString(value)) {
    return err({ field, message: `${field} must be a string` });
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? ok(trimmed) : err({ field, message: `${field} must not be blank` });
};

const validateEmail = (value: unknown): Result<string, ValidationError> => {
  if (!isString(value)) {
    return err({ field: "email", message: "email must be a string" });
  }

  const trimmed = value.trim();
  return trimmed.includes("@")
    ? ok(trimmed)
    : err({ field: "email", message: "email must contain @" });
};

const validateAge = (value: unknown): Result<number, ValidationError> =>
  isFiniteNumber(value) ? ok(value) : err({ field: "age", message: "age must be a finite number" });

export const parseUser = (input: unknown): Result<User, readonly ValidationError[]> => {
  const record = isRecord(input) ? input : {};
  const id = validateRequiredText("id", record.id);
  const name = validateRequiredText("name", record.name);
  const email = validateEmail(record.email);
  const age = validateAge(record.age);
  const errors: readonly ValidationError[] = [
    ...(id.ok ? [] : [id.error]),
    ...(name.ok ? [] : [name.error]),
    ...(email.ok ? [] : [email.error]),
    ...(age.ok ? [] : [age.error]),
  ];

  return id.ok && name.ok && email.ok && age.ok
    ? ok({ id: id.value, name: name.value, email: email.value, age: age.value })
    : err(errors);
};
