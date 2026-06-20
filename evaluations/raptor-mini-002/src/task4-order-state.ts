import type { Result } from "./result.js";
import { err, ok } from "./result.js";

export type OrderState =
  | { readonly type: "draft" }
  | { readonly type: "submitted"; readonly submittedAt: Date }
  | { readonly type: "paid"; readonly paidAt: Date }
  | {
      readonly type: "shipped";
      readonly shippedAt: Date;
      readonly trackingNumber: string;
    }
  | { readonly type: "cancelled"; readonly reason: string };

export type OrderEvent =
  | { readonly type: "submit"; readonly at: Date }
  | { readonly type: "pay"; readonly at: Date }
  | { readonly type: "ship"; readonly at: Date; readonly trackingNumber: string }
  | { readonly type: "cancel"; readonly reason: string };

export type InvalidTransition = {
  readonly currentState: OrderState["type"];
  readonly event: OrderEvent["type"];
  readonly message: string;
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
          return err({
            currentState: "draft",
            event: event.type,
            message: "draft can only be submitted or cancelled",
          });
      }
    }

    case "submitted": {
      switch (event.type) {
        case "pay":
          return ok({ type: "paid", paidAt: event.at });
        case "cancel":
          return ok({ type: "cancelled", reason: event.reason });
        default:
          return err({
            currentState: "submitted",
            event: event.type,
            message: "submitted can only be paid or cancelled",
          });
      }
    }

    case "paid": {
      switch (event.type) {
        case "ship":
          return ok({
            type: "shipped",
            shippedAt: event.at,
            trackingNumber: event.trackingNumber,
          });
        case "cancel":
          return ok({ type: "cancelled", reason: event.reason });
        default:
          return err({
            currentState: "paid",
            event: event.type,
            message: "paid can only be shipped or cancelled",
          });
      }
    }

    case "shipped":
      return err({
        currentState: "shipped",
        event: event.type,
        message: "shipped orders cannot transition further",
      });

    case "cancelled":
      return err({
        currentState: "cancelled",
        event: event.type,
        message: "cancelled orders cannot transition further",
      });

    default: {
      const exhaustive: never = state;
      throw new Error(`Unhandled state: ${String(exhaustive)}`);
    }
  }
};
