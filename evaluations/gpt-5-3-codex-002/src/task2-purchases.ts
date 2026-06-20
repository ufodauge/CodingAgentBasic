import type { Result } from "./result.js";
import { isFiniteNumber, isRecord, isString } from "./guards.js";
import { err, ok } from "./result.js";

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
  readonly type: "invalid-line";
  readonly line: string;
  readonly message: string;
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

const invalidLine = (line: string, message: string): InvalidLine => ({
  type: "invalid-line",
  line,
  message,
});

const validateRawEvent = (input: unknown): Result<RawEvent, InvalidLine> => {
  if (!isRecord(input) || !isString(input.userId) || !isString(input.type)) {
    return err(invalidLine(JSON.stringify(input), "event must include string userId and type"));
  }

  if (input.type !== "view" && input.type !== "click" && input.type !== "purchase") {
    return err(invalidLine(JSON.stringify(input), "type must be view, click, or purchase"));
  }

  if (input.type === "purchase" && input.amount !== undefined && !isFiniteNumber(input.amount)) {
    return err(invalidLine(JSON.stringify(input), "purchase amount must be finite when provided"));
  }

  const base: RawEvent = {
    userId: input.userId,
    type: input.type,
  };

  return isFiniteNumber(input.amount) ? ok({ ...base, amount: input.amount }) : ok(base);
};

const toPurchase = (event: RawEvent, line: string): Result<PurchaseEvent, InvalidLine | null> => {
  if (event.type !== "purchase") {
    return err(null);
  }

  if (!isFiniteNumber(event.amount)) {
    return err(invalidLine(line, "purchase event requires a finite amount"));
  }

  return ok({ ...event, type: "purchase", amount: event.amount });
};

const processLine = (
  line: string,
  controller: TransformStreamDefaultController<Result<PurchaseEvent, InvalidLine>>,
): void => {
  if (line.length === 0) {
    return;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(line);
  } catch {
    controller.enqueue(err(invalidLine(line, "invalid json")));
    return;
  }

  const eventResult = validateRawEvent(parsed);
  if (!eventResult.ok) {
    controller.enqueue(err(invalidLine(line, eventResult.error.message)));
    return;
  }

  const purchaseResult = toPurchase(eventResult.value, line);
  if (purchaseResult.ok) {
    controller.enqueue(ok(purchaseResult.value));
    return;
  }

  if (purchaseResult.error !== null) {
    controller.enqueue(err(purchaseResult.error));
  }
};

export const createPurchaseAmountPipeline = (): TransformStream<
  Uint8Array,
  Result<PurchaseEvent, InvalidLine>
> => {
  const decoder = new TextDecoder();
  let remainder = "";

  const inner = new TransformStream<Uint8Array, Result<PurchaseEvent, InvalidLine>>({
    transform(chunk, controller): void {
      const text = remainder + decoder.decode(chunk, { stream: true });
      const lines = text.split("\n");
      const nextRemainder = lines.pop();

      lines.forEach((line) => {
        const normalized = line.endsWith("\r") ? line.slice(0, -1) : line;
        processLine(normalized, controller);
      });

      remainder = nextRemainder ?? "";
    },
    flush(controller): void {
      const finalText = remainder + decoder.decode();
      const normalized = finalText.endsWith("\r") ? finalText.slice(0, -1) : finalText;
      processLine(normalized, controller);
    },
  });

  const innerReader = inner.readable.getReader();
  const readable = new ReadableStream<Result<PurchaseEvent, InvalidLine>>({
    async pull(controller): Promise<void> {
      const next = await innerReader.read();
      if (next.done) {
        controller.close();
        return;
      }

      controller.enqueue(next.value);
    },
    cancel(reason): Promise<void> {
      return Promise.allSettled([innerReader.cancel(reason), inner.writable.abort(reason)]).then(
        () => undefined,
      );
    },
  });

  return {
    readable,
    writable: inner.writable,
  };
};

export const summarizePurchases = (
  input: ReadableStream<Uint8Array>,
): Promise<Result<PurchaseSummary, StreamError>> => {
  const purchases: PurchaseEvent[] = [];
  const invalidLines: InvalidLine[] = [];

  return input
    .pipeThrough(createPurchaseAmountPipeline())
    .pipeTo(
      new WritableStream<Result<PurchaseEvent, InvalidLine>>({
        write(result): void {
          if (result.ok) {
            purchases.push(result.value);
            return;
          }

          invalidLines.push(result.error);
        },
      }),
    )
    .then(() => {
      const totalAmount = purchases.reduce((sum, purchase) => sum + purchase.amount, 0);
      return ok({
        totalAmount,
        purchases,
        invalidLines,
      });
    })
    .catch((caught: unknown) => {
      const message = caught instanceof Error ? caught.message : String(caught);
      return err({ type: "stream-error", message });
    });
};
