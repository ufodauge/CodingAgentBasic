import { describe, expect, it } from "vitest";
import { transition } from "../src/task4-order-state.js";

describe("transition", () => {
  it("moves through draft -> submitted -> paid -> shipped immutably", () => {
    const submittedAt = new Date("2026-01-01T00:00:00.000Z");
    const paidAt = new Date("2026-01-02T00:00:00.000Z");
    const shippedAt = new Date("2026-01-03T00:00:00.000Z");

    expect(transition({ type: "draft" }, { type: "submit", at: submittedAt })).toEqual({
      ok: true,
      value: { type: "submitted", submittedAt },
    });
    expect(transition({ type: "submitted", submittedAt }, { type: "pay", at: paidAt })).toEqual({
      ok: true,
      value: { type: "paid", paidAt },
    });
    expect(
      transition(
        { type: "paid", paidAt },
        { type: "ship", at: shippedAt, trackingNumber: "trk-1" },
      ),
    ).toEqual({
      ok: true,
      value: { type: "shipped", shippedAt, trackingNumber: "trk-1" },
    });
  });

  it("returns InvalidTransition for cancelled and shipped terminal states", () => {
    expect(
      transition({ type: "cancelled", reason: "changed mind" }, { type: "pay", at: new Date() }),
    ).toEqual({
      ok: false,
      error: expect.objectContaining({ currentState: "cancelled", event: "pay" }),
    });
    expect(
      transition(
        { type: "shipped", shippedAt: new Date(), trackingNumber: "trk-1" },
        { type: "cancel", reason: "late" },
      ),
    ).toEqual({
      ok: false,
      error: expect.objectContaining({ currentState: "shipped", event: "cancel" }),
    });
  });

  it("allows cancellation from draft, submitted, and paid states only", () => {
    expect(transition({ type: "draft" }, { type: "cancel", reason: "changed mind" })).toEqual({
      ok: true,
      value: { type: "cancelled", reason: "changed mind" },
    });
    expect(
      transition(
        { type: "submitted", submittedAt: new Date() },
        { type: "cancel", reason: "changed mind" },
      ),
    ).toEqual({
      ok: true,
      value: { type: "cancelled", reason: "changed mind" },
    });
    expect(
      transition({ type: "paid", paidAt: new Date() }, { type: "cancel", reason: "changed mind" }),
    ).toEqual({
      ok: true,
      value: { type: "cancelled", reason: "changed mind" },
    });
  });

  it("rejects out-of-order transitions with state and event details", () => {
    expect(transition({ type: "draft" }, { type: "pay", at: new Date() })).toEqual({
      ok: false,
      error: expect.objectContaining({ currentState: "draft", event: "pay" }),
    });
    expect(
      transition(
        { type: "submitted", submittedAt: new Date() },
        { type: "ship", at: new Date(), trackingNumber: "trk-1" },
      ),
    ).toEqual({
      ok: false,
      error: expect.objectContaining({ currentState: "submitted", event: "ship" }),
    });
  });
});
