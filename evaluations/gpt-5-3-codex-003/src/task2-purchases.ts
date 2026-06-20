import { isFiniteNumber, isRecord, isString } from "./guards.js";
import { err, ok, type Result } from "./result.js";

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

type ParsedJson = Result<unknown, InvalidLine>;

const toErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

const makeInvalidLine = (line: string, message: string): InvalidLine => ({
  type: "invalid-line",
  line,
  message,
});

const parseJsonLine = (line: string): ParsedJson => {
  try {
    return ok(JSON.parse(line) as unknown);
  } catch (error) {
    return err(makeInvalidLine(line, `Invalid JSON: ${toErrorMessage(error)}`));
  }
};

const validatePurchaseEvent = (line: string, input: unknown): Result<PurchaseEvent | undefined, InvalidLine> => {
  if (!isRecord(input)) {
    return err(makeInvalidLine(line, "event must be an object"));
  }

  if (!isString(input.userId) || input.userId.trim().length === 0) {
    return err(makeInvalidLine(line, "userId must be a non-empty string"));
  }

  if (input.type === "view" || input.type === "click") {
    return ok(undefined);
  }

  if (input.type !== "purchase") {
    return err(makeInvalidLine(line, "event type must be view, click, or purchase"));
  }

  return isFiniteNumber(input.amount)
    ? ok({ userId: input.userId, type: "purchase", amount: input.amount })
    : err(makeInvalidLine(line, "purchase amount must be a finite number"));
};

const enqueueParsedLine = (
  line: string,
  controller: TransformStreamDefaultController<Result<PurchaseEvent, InvalidLine>>,
): void => {
  const parsed = parseJsonLine(line).flatMap((value) => validatePurchaseEvent(line, value));

  if (parsed.ok) {
    if (parsed.value !== undefined) {
      controller.enqueue(ok(parsed.value));
    }
    return;
  }

  controller.enqueue(err(parsed.error));
};

const enqueueCompleteLines = (
  text: string,
  controller: TransformStreamDefaultController<Result<PurchaseEvent, InvalidLine>>,
): string => {
  const parts = text.split("\n");
  const buffered = parts.at(-1) ?? "";

  parts
    .slice(0, -1)
    .filter((line) => line.length > 0)
    .forEach((line) => {
      enqueueParsedLine(line, controller);
    });

  return buffered;
};

export const createPurchaseAmountPipeline = (): TransformStream<
  Uint8Array,
  Result<PurchaseEvent, InvalidLine>
> => {
  const decoder = new TextDecoder();
  let buffered = "";
  let writableController: WritableStreamDefaultController | undefined;

  const parser = new TransformStream<Uint8Array, Result<PurchaseEvent, InvalidLine>>({
    transform(chunk, controller): void {
      buffered = enqueueCompleteLines(`${buffered}${decoder.decode(chunk, { stream: true })}`, controller);
    },
    flush(controller): void {
      const finalText = `${buffered}${decoder.decode()}`;

      if (finalText.length > 0) {
        enqueueCompleteLines(`${finalText}\n`, controller);
      }
    },
  });
  const reader = parser.readable.getReader();
  const writer = parser.writable.getWriter();
  const readable = new ReadableStream<Result<PurchaseEvent, InvalidLine>>({
    async pull(controller): Promise<void> {
      const result = await reader.read();

      if (result.done) {
        controller.close();
        return;
      }

      controller.enqueue(result.value);
    },
    async cancel(reason): Promise<void> {
      writableController?.error(reason);
      await Promise.allSettled([reader.cancel(reason), writer.abort(reason)]);
    },
  });
  const writable = new WritableStream<Uint8Array>({
    start(controller): void {
      writableController = controller;
    },
    write(chunk): Promise<void> {
      return writer.write(chunk);
    },
    close(): Promise<void> {
      return writer.close();
    },
    abort(reason): Promise<void> {
      return writer.abort(reason);
    },
  });

  return { readable, writable };
};

export const summarizePurchases = async (
  input: ReadableStream<Uint8Array>,
): Promise<Result<PurchaseSummary, StreamError>> => {
  const purchases: PurchaseEvent[] = [];
  const invalidLines: InvalidLine[] = [];

  try {
    await input.pipeThrough(createPurchaseAmountPipeline()).pipeTo(
      new WritableStream<Result<PurchaseEvent, InvalidLine>>({
        write(result): void {
          if (result.ok) {
            purchases.push(result.value);
            return;
          }

          invalidLines.push(result.error);
        },
      }),
    );
  } catch (error) {
    return err({ type: "stream-error", message: toErrorMessage(error) });
  }

  return ok({
    totalAmount: purchases.reduce((total, purchase) => total + purchase.amount, 0),
    purchases,
    invalidLines,
  });
};
