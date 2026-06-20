import { describe, expect, it } from "vitest";
import { createSession } from "../src/task9-create-session.js";

describe("createSession", () => {
  it("uses injected time and id dependencies instead of ambient effects", () => {
    expect(
      createSession("u-1", {
        now: () => new Date("2026-01-01T00:00:00.000Z"),
        randomId: () => "session-1",
      }),
    ).toEqual({
      id: "session-1",
      userId: "u-1",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });
  });

  it("is deterministic for the same injected dependencies", () => {
    const deps = {
      now: () => new Date("2026-01-01T00:00:00.000Z"),
      randomId: () => "session-1",
    };

    expect(createSession("u-1", deps)).toEqual(createSession("u-1", deps));
  });

  it("does not read ambient clock or random sources", () => {
    const originalRandom = Math.random;
    const originalDateNow = Date.now;

    Math.random = () => {
      throw new Error("Math.random must not be called");
    };
    Date.now = () => {
      throw new Error("Date.now must not be called");
    };

    try {
      expect(
        createSession("u-1", {
          now: () => new Date("2026-01-01T00:00:00.000Z"),
          randomId: () => "session-1",
        }),
      ).toEqual({
        id: "session-1",
        userId: "u-1",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      });
    } finally {
      Math.random = originalRandom;
      Date.now = originalDateNow;
    }
  });
});
