import { err, ok, type Result } from "./result.js";

export type RegisterInput = {
  readonly email: string;
  readonly name: string;
  readonly plan: "free" | "pro";
};

export type NewUser = {
  readonly email: string;
  readonly name: string;
  readonly plan: RegisterInput["plan"];
};

export type Command =
  | { readonly type: "createUser"; readonly user: NewUser }
  | { readonly type: "sendWelcomeEmail"; readonly email: string }
  | { readonly type: "createBillingCustomer"; readonly email: string }
  | { readonly type: "writeAuditLog"; readonly message: string };

export type RegistrationValidationError =
  | { readonly field: "email"; readonly message: string }
  | { readonly field: "name"; readonly message: string };

const validateEmail = (email: string): Result<string, RegistrationValidationError> => {
  const normalized = email.trim().toLowerCase();
  return normalized.includes("@")
    ? ok(normalized)
    : err({ field: "email", message: "email must contain @" });
};

const validateName = (name: string): Result<string, RegistrationValidationError> => {
  const normalized = name.trim();
  return normalized.length > 0
    ? ok(normalized)
    : err({ field: "name", message: "name must not be blank" });
};

const buildCommands = (user: NewUser): readonly Command[] => [
  { type: "createUser", user },
  ...(user.plan === "pro" ? [{ type: "createBillingCustomer", email: user.email } as const] : []),
  { type: "sendWelcomeEmail", email: user.email },
  { type: "writeAuditLog", message: `Registered ${user.plan} user ${user.email}` },
];

export const planRegistration = (
  input: RegisterInput,
): Result<readonly Command[], readonly RegistrationValidationError[]> => {
  const email = validateEmail(input.email);
  const name = validateName(input.name);
  const errors: readonly RegistrationValidationError[] = [
    ...(email.ok ? [] : [email.error]),
    ...(name.ok ? [] : [name.error]),
  ];

  return email.ok && name.ok
    ? ok(buildCommands({ email: email.value, name: name.value, plan: input.plan }))
    : err(errors);
};
