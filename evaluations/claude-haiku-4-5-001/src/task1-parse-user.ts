import type { Result } from "./result.js";
import { err, ok } from "./result.js";
import { isRecord, isString, isFiniteNumber } from "./guards.js";

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

export const parseUser = (input: unknown): Result<User, readonly ValidationError[]> => {
  const errors: ValidationError[] = [];

  if (!isRecord(input)) {
    return err([
      { field: "id", message: "id is required" },
      { field: "name", message: "name is required" },
      { field: "email", message: "email is required" },
      { field: "age", message: "age is required" },
    ]);
  }

  // Validate id
  const idValue = input.id;
  let id: string | undefined;
  if (!isString(idValue)) {
    errors.push({ field: "id", message: "id must be a string" });
  } else {
    id = idValue.trim();
    if (id === "") {
      errors.push({ field: "id", message: "id must not be empty after trimming" });
    }
  }

  // Validate name
  const nameValue = input.name;
  let name: string | undefined;
  if (!isString(nameValue)) {
    errors.push({ field: "name", message: "name must be a string" });
  } else {
    name = nameValue.trim();
    if (name === "") {
      errors.push({ field: "name", message: "name must not be empty after trimming" });
    }
  }

  // Validate email
  const emailValue = input.email;
  let email: string | undefined;
  if (!isString(emailValue)) {
    errors.push({ field: "email", message: "email must be a string" });
  } else {
    email = emailValue.trim();
    if (!email.includes("@")) {
      errors.push({ field: "email", message: "email must contain @" });
    }
  }

  // Validate age
  const ageValue = input.age;
  let age: number | undefined;
  if (!isFiniteNumber(ageValue)) {
    errors.push({ field: "age", message: "age must be a finite number" });
  } else {
    age = ageValue;
  }

  if (errors.length > 0) {
    return err(errors);
  }

  return ok({
    id: id ?? "",
    name: name ?? "",
    email: email ?? "",
    age: age ?? 0,
  });
};
