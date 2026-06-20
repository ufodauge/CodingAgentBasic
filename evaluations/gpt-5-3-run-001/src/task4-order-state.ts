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
  readonly type: "invalid-transition";
  readonly currentState: OrderState["type"];
  readonly event: OrderEvent["type"];
  readonly message: string;
};

const invalidTransition = (state: OrderState, event: OrderEvent): Result<never, InvalidTransition> =>
  err({
    type: "invalid-transition",
    currentState: state.type,
    event: event.type,
    message: `cannot ${event.type} from ${state.type}`,
  });

const assertNever = (_value: never): never => {
  throw new Error("Unexpected state");
};

export const transition = (
  state: OrderState,
  event: OrderEvent,
): Result<OrderState, InvalidTransition> => {
  switch (state.type) {
    case "draft":
      switch (event.type) {
        case "submit":
          return ok({ type: "submitted", submittedAt: event.at });
        case "cancel":
          return ok({ type: "cancelled", reason: event.reason });
        case "pay":
        case "ship":
          return invalidTransition(state, event);
        default:
          return assertNever(event);
      }
    case "submitted":
      switch (event.type) {
        case "pay":
          return ok({ type: "paid", paidAt: event.at });
        case "cancel":
          return ok({ type: "cancelled", reason: event.reason });
        case "submit":
        case "ship":
          return invalidTransition(state, event);
        default:
          return assertNever(event);
      }
    case "paid":
      switch (event.type) {
        case "ship":
          return ok({ type: "shipped", shippedAt: event.at, trackingNumber: event.trackingNumber });
        case "cancel":
          return ok({ type: "cancelled", reason: event.reason });
        case "submit":
        case "pay":
          return invalidTransition(state, event);
        default:
          return assertNever(event);
      }
    case "shipped":
    case "cancelled":
      return invalidTransition(state, event);
    default:
      return assertNever(state);
  }
};
