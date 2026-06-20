import { describe, expect, it, vi } from "vitest";
import { loadDashboards } from "../src/task3-dashboards.js";

describe("loadDashboards", () => {
  it("starts requests for multiple users without waiting for earlier users to finish", () => {
    const fetchMock = vi.fn((url: string | URL | Request) => {
      const path = url instanceof Request ? url.url : String(url);
      const resourceUserId = path.split("/").at(-2) ?? "unknown";
      const userId = path.split("/").at(-1) ?? "unknown";
      const body = path.endsWith("/orders")
        ? [{ id: `${resourceUserId}-order`, total: 1200 }]
        : path.endsWith("/recommendations")
          ? [{ id: `${resourceUserId}-rec`, title: "Starter" }]
          : { id: userId, name: "Ada" };

      return Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));
    });
    vi.stubGlobal("fetch", fetchMock);

    const loading = loadDashboards(["u-1", "u-2"], new AbortController().signal);

    expect(fetchMock).toHaveBeenCalledTimes(6);
    return expect(loading).resolves.toEqual(expect.objectContaining({ ok: true }));
  });

  it("loads each user dashboard with per-user requests in parallel", async () => {
    const fetchMock = vi.fn((url: string | URL | Request) => {
      const path = url instanceof Request ? url.url : String(url);
      const body = path.endsWith("/orders")
        ? [{ id: "o-1", total: 1200 }]
        : path.endsWith("/recommendations")
          ? [{ id: "r-1", title: "Starter" }]
          : { id: "u-1", name: "Ada" };

      return Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(loadDashboards(["u-1"], new AbortController().signal)).resolves.toEqual({
      ok: true,
      value: [
        {
          user: { id: "u-1", name: "Ada" },
          orders: [{ id: "o-1", total: 1200 }],
          recommendations: [{ id: "r-1", title: "Starter" }],
        },
      ],
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("aggregates failures as LoadError values", async () => {
    vi.stubGlobal("fetch", () => Promise.resolve(new Response("not-json", { status: 200 })));

    await expect(loadDashboards(["u-1"], new AbortController().signal)).resolves.toEqual({
      ok: false,
      error: expect.arrayContaining([expect.objectContaining({ userId: "u-1" })]),
    });
  });

  it("distinguishes HTTP errors and response validation errors", async () => {
    vi.stubGlobal("fetch", (url: string | URL | Request) => {
      const path = url instanceof Request ? url.url : String(url);

      if (path.endsWith("/orders")) {
        return Promise.resolve(new Response(JSON.stringify({ invalid: true }), { status: 200 }));
      }

      if (path.endsWith("/recommendations")) {
        return Promise.resolve(new Response(JSON.stringify([]), { status: 503 }));
      }

      return Promise.resolve(
        new Response(JSON.stringify({ id: "u-1", name: "Ada" }), { status: 200 }),
      );
    });

    await expect(loadDashboards(["u-1"], new AbortController().signal)).resolves.toEqual({
      ok: false,
      error: expect.arrayContaining([
        expect.objectContaining({ userId: "u-1", resource: "orders", type: "validation" }),
        expect.objectContaining({ userId: "u-1", resource: "recommendations", type: "http" }),
      ]),
    });
  });

  it("propagates AbortSignal and returns an abort-shaped LoadError value", async () => {
    const controller = new AbortController();
    const fetchMock = vi.fn((_url: string | URL | Request, init?: RequestInit) => {
      expect(init?.signal).toBe(controller.signal);
      return Promise.reject(new DOMException("aborted", "AbortError"));
    });
    vi.stubGlobal("fetch", fetchMock);
    controller.abort();

    await expect(loadDashboards(["u-1"], controller.signal)).resolves.toEqual({
      ok: false,
      error: expect.arrayContaining([
        expect.objectContaining({ userId: "u-1", type: expect.stringMatching(/abort|network/) }),
      ]),
    });
    expect(fetchMock).toHaveBeenCalled();
  });
});
