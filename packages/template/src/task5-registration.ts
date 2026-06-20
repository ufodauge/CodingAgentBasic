import type { Result } from "./result.js";

export type RegisterInput = unknown;

export type NewUser = unknown;

export type Command = unknown;

export type RegistrationValidationError = unknown;

export const planRegistration = (
  _input: RegisterInput,
): Result<readonly Command[], readonly RegistrationValidationError[]> => {
  throw new Error("Not Implemented");
};
