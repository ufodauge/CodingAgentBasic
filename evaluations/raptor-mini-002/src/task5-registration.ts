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

export type RegistrationValidationError =
  | { readonly field: "email"; readonly message: string }
  | { readonly field: "name"; readonly message: string };

const normalizeEmail = (email: string): string => email.trim().toLowerCase();
const normalizeName = (name: string): string => name.trim();

export const planRegistration = (
  input: RegisterInput,
): Result<readonly Command[], readonly RegistrationValidationError[]> => {
  const email = normalizeEmail(input.email);
  const name = normalizeName(input.name);

  const errors: RegistrationValidationError[] = [];

  if (email === "" || !email.includes("@")) {
    errors.push({ field: "email", message: "email must be a valid address" });
  }

  if (name === "") {
    errors.push({ field: "name", message: "name must not be empty" });
  }

  if (errors.length > 0) {
    return err(errors);
  }

  const user: NewUser = { email, name, plan: input.plan };
  const commands: Command[] = [{ type: "createUser", user }];

  if (input.plan === "pro") {
    commands.push({ type: "createBillingCustomer", email });
  }

  commands.push(
    { type: "sendWelcomeEmail", email },
    { type: "writeAuditLog", message: `Created account for ${name} <${email}>` },
  );

  return ok(commands);
};
