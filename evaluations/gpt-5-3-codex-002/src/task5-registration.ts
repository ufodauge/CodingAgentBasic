import type { Result } from "./result.js";
import { err, ok } from "./result.js";

export type RegisterInput = {
  readonly email: string;
  readonly name: string;
  readonly plan: "free" | "pro";
};

export type NewUser = {
  readonly email: string;
  readonly name: string;
  readonly plan: "free" | "pro";
};

export type Command =
  | { readonly type: "createUser"; readonly user: NewUser }
  | { readonly type: "sendWelcomeEmail"; readonly email: string }
  | { readonly type: "createBillingCustomer"; readonly email: string }
  | { readonly type: "writeAuditLog"; readonly message: string };

export type RegistrationValidationError = {
  readonly field: "email" | "name" | "plan";
  readonly message: string;
};

const validateEmail = (email: string): Result<string, RegistrationValidationError> => {
  const normalized = email.trim().toLowerCase();
  return normalized.includes("@")
    ? ok(normalized)
    : err({ field: "email", message: "email must include @" });
};

const validateName = (name: string): Result<string, RegistrationValidationError> => {
  const normalized = name.trim();
  return normalized.length > 0
    ? ok(normalized)
    : err({ field: "name", message: "name must not be blank" });
};

export const planRegistration = (
  input: RegisterInput,
): Result<readonly Command[], readonly RegistrationValidationError[]> => {
  const emailResult = validateEmail(input.email);
  const nameResult = validateName(input.name);

  if (!emailResult.ok || !nameResult.ok) {
    const errors = [emailResult, nameResult].flatMap((result) =>
      result.ok ? [] : [result.error],
    );
    return err(errors);
  }

  const newUser: NewUser = {
    email: emailResult.value,
    name: nameResult.value,
    plan: input.plan,
  };

  const commands: readonly Command[] =
    newUser.plan === "pro"
      ? [
          { type: "createUser", user: newUser },
          { type: "createBillingCustomer", email: newUser.email },
          { type: "sendWelcomeEmail", email: newUser.email },
          { type: "writeAuditLog", message: `registered ${newUser.email} on ${newUser.plan}` },
        ]
      : [
          { type: "createUser", user: newUser },
          { type: "sendWelcomeEmail", email: newUser.email },
          { type: "writeAuditLog", message: `registered ${newUser.email} on ${newUser.plan}` },
        ];

  return ok(commands);
};
