import type { Result } from "./result.js";
import { err, ok } from "./result.js";
import { isFiniteNumber, isRecord, isString } from "./guards.js";

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
  readonly reason: string;
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

const invalidLine = (line: string, reason: string): InvalidLine => ({ line, reason });

const validateRawEvent = (input: unknown, line: string): Result<RawEvent, InvalidLine> => {
  if (!isRecord(input) || !isString(input.userId) || !isString(input.type)) {
    return err(invalidLine(line, "event must include string userId and type"));
  }

  if (input.type !== "view" && input.type !== "click" && input.type !== "purchase") {
    return err(invalidLine(line, "type must be view, click, or purchase"));
  }

  if (input.type === "purchase" && input.amount !== undefined && !isFiniteNumber(input.amount)) {
    return err(invalidLine(line, "purchase amount must be finite when provided"));
  }

  const base: RawEvent = { userId: input.userId, type: input.type };

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
    controller.enqueue(err(invalidLine(line, "invalid JSON")));
    return;
  }

  const eventResult = validateRawEvent(parsed, line);
  if (!eventResult.ok) {
    controller.enqueue(err(eventResult.error));
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
    transform(chunk, controller) {
      const text = remainder + decoder.decode(chunk, { stream: true });
      const lines = text.split("\n");
      const nextRemainder = lines.pop();

      lines.forEach((line) => {
        const normalized = line.endsWith("\r") ? line.slice(0, -1) : line;
        processLine(normalized, controller);
      });

      remainder = nextRemainder ?? "";
    },
    flush(controller) {
      const finalText = remainder + decoder.decode();
      const normalized = finalText.endsWith("\r") ? finalText.slice(0, -1) : finalText;
      processLine(normalized, controller);
    },
  });

  const innerReader = inner.readable.getReader();
  const readable = new ReadableStream<Result<PurchaseEvent, InvalidLine>>({
    async pull(controller) {
      const next = await innerReader.read();
      if (next.done) {
        controller.close();
        return;
      }
      controller.enqueue(next.value);
    },
    cancel(reason) {
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
        write(result) {
          if (result.ok) {
            purchases.push(result.value);
            return;
          }
          invalidLines.push(result.error);
        },
      }),
    )
    .then(() =>
      ok({
        totalAmount: purchases.reduce((sum, purchase) => sum + purchase.amount, 0),
        purchases,
        invalidLines,
      }),
    )
    .catch((error: unknown) =>
      err({ type: "stream-error", message: error instanceof Error ? error.message : String(error) }),
    );
};
