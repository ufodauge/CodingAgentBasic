import type { Result } from "./result.js";
import { err, ok } from "./result.js";
import { isFiniteNumber, isRecord, isString } from "./guards.js";

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

const validateTextField = (
  field: ValidationError["field"],
  raw: unknown,
): Result<string, ValidationError> => {
  if (!isString(raw)) {
    return err({ field, message: `${field} must be a string` });
  }

  const normalized = raw.trim();

  if (normalized === "") {
    return err({ field, message: `${field} must not be empty` });
  }

  return ok(normalized);
};

const validateEmail = (raw: unknown): Result<string, ValidationError> => {
  if (!isString(raw)) {
    return err({ field: "email", message: "email must be a string" });
  }

  const normalized = raw.trim();

  if (normalized === "") {
    return err({ field: "email", message: "email must not be empty" });
  }

  if (!normalized.includes("@")) {
    return err({ field: "email", message: "email must contain @" });
  }

  return ok(normalized);
};

const validateAge = (raw: unknown): Result<number, ValidationError> => {
  if (!isFiniteNumber(raw)) {
    return err({ field: "age", message: "age must be a finite number" });
  }

  return ok(raw);
};

export const parseUser = (input: unknown): Result<User, readonly ValidationError[]> => {
  const record = isRecord(input) ? input : {};

  const idResult = validateTextField("id", record.id);
  const nameResult = validateTextField("name", record.name);
  const emailResult = validateEmail(record.email);
  const ageResult = validateAge(record.age);

  const errors = [idResult, nameResult, emailResult, ageResult].flatMap((result) =>
    result.ok ? [] : [result.error],
  );

  if (!idResult.ok || !nameResult.ok || !emailResult.ok || !ageResult.ok) {
    return err(errors);
  }

  return ok({
    id: idResult.value,
    name: nameResult.value,
    email: emailResult.value,
    age: ageResult.value,
  });
};
