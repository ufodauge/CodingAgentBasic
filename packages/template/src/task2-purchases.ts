import type { Result } from "./result.js";

export type RawEvent = unknown;

export type PurchaseEvent = unknown;

export type InvalidLine = unknown;

export type PurchaseSummary = unknown;

export type StreamError = unknown;

export const createPurchaseAmountPipeline = (): TransformStream<
  Uint8Array,
  Result<PurchaseEvent, InvalidLine>
> => {
  throw new Error("Not Implemented");
};

export const summarizePurchases = (
  _input: ReadableStream<Uint8Array>,
): Promise<Result<PurchaseSummary, StreamError>> => {
  throw new Error("Not Implemented");
};
