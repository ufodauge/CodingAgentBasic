import { err, ok, type Result } from "./result.js";

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
};

const invalidTransition = (state: OrderState, event: OrderEvent): Result<OrderState, InvalidTransition> =>
  err({ type: "invalid-transition", currentState: state.type, event: event.type });

const assertNever = (value: never): never => value;

export const transition = (
  state: OrderState,
  event: OrderEvent,
): Result<OrderState, InvalidTransition> => {
  switch (state.type) {
    case "draft":
      return event.type === "submit"
        ? ok({ type: "submitted", submittedAt: event.at })
        : event.type === "cancel"
          ? ok({ type: "cancelled", reason: event.reason })
          : invalidTransition(state, event);
    case "submitted":
      return event.type === "pay"
        ? ok({ type: "paid", paidAt: event.at })
        : event.type === "cancel"
          ? ok({ type: "cancelled", reason: event.reason })
          : invalidTransition(state, event);
    case "paid":
      return event.type === "ship"
        ? ok({ type: "shipped", shippedAt: event.at, trackingNumber: event.trackingNumber })
        : event.type === "cancel"
          ? ok({ type: "cancelled", reason: event.reason })
          : invalidTransition(state, event);
    case "shipped":
    case "cancelled":
      return invalidTransition(state, event);
    default:
      return assertNever(state);
  }
};
