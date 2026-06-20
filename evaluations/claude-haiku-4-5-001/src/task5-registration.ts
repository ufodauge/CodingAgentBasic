import type { Result } from "./result.js";
import { err, ok } from "./result.js";
import { isString } from "./guards.js";

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

export const planRegistration = (
  input: RegisterInput,
): Result<readonly Command[], readonly RegistrationValidationError[]> => {
  const errors: RegistrationValidationError[] = [];

  let email = input.email;
  if (!isString(email)) {
    errors.push({ field: "email", message: "email must be a string" });
  } else {
    email = email.trim().toLowerCase();
    if (!email.includes("@")) {
      errors.push({ field: "email", message: "email must contain @" });
    }
  }

  let name = input.name;
  if (!isString(name)) {
    errors.push({ field: "name", message: "name must be a string" });
  } else {
    name = name.trim();
    if (name === "") {
      errors.push({ field: "name", message: "name must not be empty after trimming" });
    }
  }

  if (errors.length > 0) {
    return err(errors);
  }

  const commands: Command[] = [
    {
      type: "createUser",
      user: {
        email: email,
        name: name,
        plan: input.plan,
      },
    },
  ];

  if (input.plan === "pro") {
    commands.push({
      type: "createBillingCustomer",
      email,
    });
  }

  commands.push({
    type: "sendWelcomeEmail",
    email,
  });

  commands.push({
    type: "writeAuditLog",
    message: `User registered: ${name} (${email}) with plan: ${input.plan}`,
  });

  return ok(commands);
};
