import { describe, expect, it } from "vitest";
import { parseUser } from "../src/task1-parse-user.js";

describe("parseUser", () => {
  it("returns a trimmed User for valid unknown input", () => {
    const input = { id: " u-1 ", name: " Ada ", email: " ada@example.test ", age: 37 };

    expect(parseUser(input)).toEqual({
      ok: true,
      value: { id: "u-1", name: "Ada", email: "ada@example.test", age: 37 },
    });
    expect(input).toEqual({ id: " u-1 ", name: " Ada ", email: " ada@example.test ", age: 37 });
  });

  it("accumulates all validation errors without throwing", () => {
    expect(() => parseUser({ id: "", name: "", email: "invalid", age: Number.NaN })).not.toThrow();
    expect(parseUser({ id: "", name: "", email: "invalid", age: Number.NaN })).toEqual({
      ok: false,
      error: [
        { field: "id", message: expect.any(String) },
        { field: "name", message: expect.any(String) },
        { field: "email", message: expect.any(String) },
        { field: "age", message: expect.any(String) },
      ],
    });
  });

  it("rejects non-object input with field-level errors instead of throwing", () => {
    expect(() => parseUser(null)).not.toThrow();
    expect(parseUser(null)).toEqual({
      ok: false,
      error: expect.arrayContaining([
        { field: "id", message: expect.any(String) },
        { field: "name", message: expect.any(String) },
        { field: "email", message: expect.any(String) },
        { field: "age", message: expect.any(String) },
      ]),
    });
  });

  it("treats Infinity and missing fields as validation errors", () => {
    expect(parseUser({ id: "u-1", name: "Ada", email: "ada@example.test", age: Infinity })).toEqual(
      {
        ok: false,
        error: [{ field: "age", message: expect.any(String) }],
      },
    );
    expect(parseUser({ id: "u-1" })).toEqual({
      ok: false,
      error: expect.arrayContaining([
        { field: "name", message: expect.any(String) },
        { field: "email", message: expect.any(String) },
        { field: "age", message: expect.any(String) },
      ]),
    });
  });
});
