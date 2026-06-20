import type { Result } from "./result.js";
import { err, ok } from "./result.js";
import { isRecord, isString, isFiniteNumber } from "./guards.js";

export type RawEvent = {
  readonly userId: string;
  readonly type: "view" | "click" | "purchase";
  readonly amount?: number;
};

export type PurchaseEvent = RawEvent & {
  readonly type: "purchase";
  readonly amount: number;
};

export type InvalidLine = {
  readonly line: string;
  readonly error: string;
};

export type PurchaseSummary = {
  readonly totalAmount: number;
  readonly purchases: readonly PurchaseEvent[];
  readonly invalidLines: readonly InvalidLine[];
};

export type StreamError = {
  readonly type: "stream-error";
  readonly message: string;
};

const validatePurchaseEvent = (
  event: unknown,
): Result<PurchaseEvent, InvalidLine | null> => {
  if (
    !isRecord(event) ||
    !isString(event.userId) ||
    !isString(event.type) ||
    event.type !== "purchase"
  ) {
    return err(null);
  }

  if (!isFiniteNumber(event.amount)) {
    return err(null);
  }

  const purchaseEvent: PurchaseEvent = {
    userId: event.userId,
    type: "purchase",
    amount: event.amount,
  };
  return ok(purchaseEvent);
};

export const createPurchaseAmountPipeline = (): TransformStream<
  Uint8Array,
  Result<PurchaseEvent, InvalidLine>
> => {
  const decoder = new TextDecoder();
  let buffer = "";

  return new TransformStream(
    {
      transform(chunk: Uint8Array, controller): void {
        buffer += decoder.decode(chunk, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        lines.forEach((line) => {
          if (line.trim() === "") {
            return;
          }

          try {
            const parsed = JSON.parse(line) as unknown;
            const validated = validatePurchaseEvent(parsed);

            if (validated.ok) {
              controller.enqueue(ok(validated.value));
            } else {
              controller.enqueue(err({ line, error: "Invalid purchase event" }));
            }
          } catch (e) {
            controller.enqueue(err({ line, error: String(e) }));
          }
        });
      },

      flush(controller): void {
        const trimmedBuffer = buffer.trim();
        if (trimmedBuffer !== "") {
          try {
            const parsed = JSON.parse(trimmedBuffer) as unknown;
            const validated = validatePurchaseEvent(parsed);

            if (validated.ok) {
              controller.enqueue(ok(validated.value));
            } else {
              controller.enqueue(err({ line: trimmedBuffer, error: "Invalid purchase event" }));
            }
          } catch (e) {
            controller.enqueue(err({ line: trimmedBuffer, error: String(e) }));
          }
        }
      },
    },
    undefined,
  );
};

export const summarizePurchases = async (
  input: ReadableStream<Uint8Array>,
): Promise<Result<PurchaseSummary, StreamError>> => {
  const purchases: PurchaseEvent[] = [];
  const invalidLines: InvalidLine[] = [];
  let totalAmount = 0;

  try {
    const reader = input.pipeThrough(createPurchaseAmountPipeline()).getReader();

    try {
      let continueReading = true;
      // eslint-disable-next-line no-restricted-syntax
      while (continueReading) {
        const { done, value } = await reader.read();

        if (done) {
          continueReading = false;
        } else {
          if (value.ok) {
            purchases.push(value.value);
            totalAmount += value.value.amount;
          } else {
            invalidLines.push(value.error);
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return ok({
      totalAmount,
      purchases,
      invalidLines,
    });
  } catch (e) {
    return err({
      type: "stream-error",
      message: String(e),
    });
  }
};
