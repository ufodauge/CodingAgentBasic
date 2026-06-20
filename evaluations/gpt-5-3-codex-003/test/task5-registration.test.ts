import { describe, expect, it } from "vitest";
import { planRegistration } from "../src/task5-registration.js";

describe("planRegistration", () => {
  it("returns a command plan without executing side effects", () => {
    const input = { email: " ADA@EXAMPLE.TEST ", name: " Ada ", plan: "pro" as const };

    expect(planRegistration(input)).toEqual({
      ok: true,
      value: [
        { type: "createUser", user: { email: "ada@example.test", name: "Ada", plan: "pro" } },
        { type: "createBillingCustomer", email: "ada@example.test" },
        { type: "sendWelcomeEmail", email: "ada@example.test" },
        { type: "writeAuditLog", message: expect.any(String) },
      ],
    });
    expect(input).toEqual({ email: " ADA@EXAMPLE.TEST ", name: " Ada ", plan: "pro" });
  });

  it("accumulates validation errors", () => {
    expect(planRegistration({ email: "invalid", name: "", plan: "free" })).toEqual({
      ok: false,
      error: [
        { field: "email", message: expect.any(String) },
        { field: "name", message: expect.any(String) },
      ],
    });
  });

  it("does not create billing commands for free plan registrations", () => {
    expect(planRegistration({ email: "ada@example.test", name: "Ada", plan: "free" })).toEqual({
      ok: true,
      value: [
        { type: "createUser", user: { email: "ada@example.test", name: "Ada", plan: "free" } },
        { type: "sendWelcomeEmail", email: "ada@example.test" },
        { type: "writeAuditLog", message: expect.any(String) },
      ],
    });
  });

  it("does not return side-effect adapters or promises from the pure planner", () => {
    const result = planRegistration({ email: "ada@example.test", name: "Ada", plan: "pro" });

    expect(result).not.toBeInstanceOf(Promise);
    expect(result).toEqual(expect.objectContaining({ ok: true }));
  });
});
