import type { Result } from "./result.js";
import { isFiniteNumber, isRecord, isString } from "./guards.js";
import { err, ok } from "./result.js";

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

type UserField = ValidationError["field"];

const requiredTrimmedString = (
  field: Extract<UserField, "id" | "name">,
  value: unknown,
): Result<string, ValidationError> => {
  if (!isString(value)) {
    return err({ field, message: `${field} must be a string` });
  }

  const trimmed = value.trim();
  return trimmed.length > 0
    ? ok(trimmed)
    : err({ field, message: `${field} must not be blank` });
};

const emailField = (value: unknown): Result<string, ValidationError> => {
  if (!isString(value)) {
    return err({ field: "email", message: "email must be a string" });
  }

  const trimmed = value.trim();
  return trimmed.includes("@")
    ? ok(trimmed)
    : err({ field: "email", message: "email must include @" });
};

const ageField = (value: unknown): Result<number, ValidationError> =>
  isFiniteNumber(value)
    ? ok(value)
    : err({ field: "age", message: "age must be a finite number" });

export const parseUser = (input: unknown): Result<User, readonly ValidationError[]> => {
  const source: Readonly<Record<string, unknown>> = isRecord(input) ? input : {};

  const idResult = requiredTrimmedString("id", source.id);
  const nameResult = requiredTrimmedString("name", source.name);
  const emailResult = emailField(source.email);
  const ageResult = ageField(source.age);

  if (!idResult.ok || !nameResult.ok || !emailResult.ok || !ageResult.ok) {
    const errors = [idResult, nameResult, emailResult, ageResult].flatMap((result) =>
      result.ok ? [] : [result.error],
    );
    return err(errors);
  }

  return ok({
    id: idResult.value,
    name: nameResult.value,
    email: emailResult.value,
    age: ageResult.value,
  });
};
