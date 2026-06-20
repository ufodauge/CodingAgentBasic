import { describe, expect, it } from "vitest";
import { createPurchaseAmountPipeline, summarizePurchases } from "../src/task2-purchases.js";

const streamFromChunks = (chunks: readonly string[]): ReadableStream<Uint8Array> => {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(controller): void {
      chunks
        .map((chunk) => encoder.encode(chunk))
        .forEach((chunk) => {
          controller.enqueue(chunk);
        });
      controller.close();
    },
  });
};

describe("summarizePurchases", () => {
  it("handles split chunks, invalid lines, and final line without newline", async () => {
    await expect(
      summarizePurchases(
        streamFromChunks([
          '{"userId":"u1","type":"pur',
          'chase","amount":1200}\n{"userId":"u1","type":"view"}\n',
          'not-json\n{"userId":"u2","type":"purchase"}',
        ]),
      ),
    ).resolves.toEqual({
      ok: true,
      value: {
        totalAmount: 1200,
        purchases: [{ userId: "u1", type: "purchase", amount: 1200 }],
        invalidLines: expect.arrayContaining([
          expect.objectContaining({ line: "not-json" }),
          expect.objectContaining({ line: '{"userId":"u2","type":"purchase"}' }),
        ]),
      },
    });
  });

  it("reports invalid event types and non-finite purchase amounts", async () => {
    await expect(
      summarizePurchases(
        streamFromChunks([
          '{"userId":"u1","type":"signup"}\n',
          '{"userId":"u2","type":"purchase","amount":"1200"}\n',
          '{"userId":"u3","type":"purchase","amount":null}\n',
        ]),
      ),
    ).resolves.toEqual({
      ok: true,
      value: {
        totalAmount: 0,
        purchases: [],
        invalidLines: expect.arrayContaining([
          expect.objectContaining({ line: '{"userId":"u1","type":"signup"}' }),
          expect.objectContaining({ line: '{"userId":"u2","type":"purchase","amount":"1200"}' }),
          expect.objectContaining({ line: '{"userId":"u3","type":"purchase","amount":null}' }),
        ]),
      },
    });
  });

  it("treats an upstream stream failure as StreamError", async () => {
    const failing = new ReadableStream<Uint8Array>({
      start(controller): void {
        controller.error(new Error("upstream failed"));
      },
    });

    await expect(summarizePurchases(failing)).resolves.toEqual({
      ok: false,
      error: expect.objectContaining({
        type: "stream-error",
        message: expect.stringContaining("upstream failed"),
      }),
    });
  });

  it("exposes a TransformStream pipeline that emits Result values", async () => {
    const results: unknown[] = [];
    await streamFromChunks(['{"userId":"u1","type":"purchase","amount":300}\nnot-json\n'])
      .pipeThrough(createPurchaseAmountPipeline())
      .pipeTo(
        new WritableStream({
          write(result): void {
            results.push(result);
          },
        }),
      );

    expect(results).toEqual([
      { ok: true, value: { userId: "u1", type: "purchase", amount: 300 } },
      { ok: false, error: expect.objectContaining({ line: "not-json" }) },
    ]);
  });

  it("propagates cancellation through the pipeline", async () => {
    let cancelled = false;
    const input = new ReadableStream<Uint8Array>({
      pull(controller): void {
        controller.enqueue(
          new TextEncoder().encode('{"userId":"u1","type":"purchase","amount":300}\n'),
        );
      },
      cancel(): void {
        cancelled = true;
      },
    });

    const reader = input.pipeThrough(createPurchaseAmountPipeline()).getReader();
    await expect(reader.read()).resolves.toEqual({
      done: false,
      value: { ok: true, value: { userId: "u1", type: "purchase", amount: 300 } },
    });
    await reader.cancel("done");

    expect(cancelled).toBe(true);
  });
});
