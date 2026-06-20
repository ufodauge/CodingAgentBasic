import type { Result } from "./result.js";
import { err, ok } from "./result.js";

export type OrderState =
  | { readonly type: "draft" }
  | { readonly type: "submitted"; readonly submittedAt: Date }
  | { readonly type: "paid"; readonly paidAt: Date }
  | { readonly type: "shipped"; readonly shippedAt: Date; readonly trackingNumber: string }
  | { readonly type: "cancelled"; readonly reason: string };

export type OrderEvent =
  | { readonly type: "submit"; readonly at: Date }
  | { readonly type: "pay"; readonly at: Date }
  | { readonly type: "ship"; readonly at: Date; readonly trackingNumber: string }
  | { readonly type: "cancel"; readonly reason: string };

export type InvalidTransition = {
  readonly currentState: string;
  readonly event: string;
};

export const transition = (
  state: OrderState,
  event: OrderEvent,
): Result<OrderState, InvalidTransition> => {
  switch (state.type) {
    case "draft": {
      switch (event.type) {
        case "submit":
          return ok({ type: "submitted", submittedAt: event.at });
        case "cancel":
          return ok({ type: "cancelled", reason: event.reason });
        default:
          return err({ currentState: "draft", event: event.type });
      }
    }

    case "submitted": {
      switch (event.type) {
        case "pay":
          return ok({ type: "paid", paidAt: event.at });
        case "cancel":
          return ok({ type: "cancelled", reason: event.reason });
        default:
          return err({ currentState: "submitted", event: event.type });
      }
    }

    case "paid": {
      switch (event.type) {
        case "ship":
          return ok({ type: "shipped", shippedAt: event.at, trackingNumber: event.trackingNumber });
        case "cancel":
          return ok({ type: "cancelled", reason: event.reason });
        default:
          return err({ currentState: "paid", event: event.type });
      }
    }

    case "shipped": {
      return err({ currentState: "shipped", event: event.type });
    }

    case "cancelled": {
      return err({ currentState: "cancelled", event: event.type });
    }

    default: {
      const _exhaustive: never = state;
      return _exhaustive;
    }
  }
};
