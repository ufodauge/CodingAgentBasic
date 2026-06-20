import { describe, expect, it } from "vitest";
import { getPostalCode } from "../src/task7-postal-code.js";

describe("getPostalCode", () => {
  it("returns Some with a trimmed postal code", () => {
    expect(getPostalCode({ user: { profile: { address: { postalCode: " 100-0001 " } } } })).toEqual(
      "100-0001",
    );
  });

  it("returns None when the value is missing or blank", () => {
    expect(getPostalCode({})).toEqual(undefined);
    expect(getPostalCode({ user: {} })).toEqual(undefined);
    expect(getPostalCode({ user: { profile: {} } })).toEqual(undefined);
    expect(getPostalCode({ user: { profile: { address: { postalCode: "" } } } })).toEqual(
      undefined,
    );
  });

  it("does not throw for nullish nested values from external JSON", () => {
    expect(() => getPostalCode({ user: { profile: { address: null } } })).not.toThrow();
    expect(getPostalCode({ user: { profile: { address: null } } })).toEqual(undefined);
  });
});
