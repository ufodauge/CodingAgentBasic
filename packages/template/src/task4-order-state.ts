import type { Result } from "./result.js";

export type OrderState = unknown;

export type OrderEvent = unknown;

export type InvalidTransition = unknown;

export const transition = (
  _state: OrderState,
  _event: OrderEvent,
): Result<OrderState, InvalidTransition> => {
  throw new Error("Not Implemented");
};
