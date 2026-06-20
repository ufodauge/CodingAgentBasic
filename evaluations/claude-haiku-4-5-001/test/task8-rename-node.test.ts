import { describe, expect, it } from "vitest";
import { renameNode } from "../src/task8-rename-node.js";

type NodeFixture = {
  readonly id: string;
  readonly name: string;
  readonly children: readonly NodeFixture[];
};

const isNodeFixture = (input: unknown): input is NodeFixture =>
  typeof input === "object" &&
  input !== null &&
  "children" in input &&
  Array.isArray(input.children);

describe("renameNode", () => {
  it("renames the target node without mutating unrelated branches", () => {
    const unchanged = { id: "b", name: "B", children: [] };
    const root = {
      id: "root",
      name: "Root",
      children: [{ id: "a", name: "A", children: [] }, unchanged],
    };

    expect(renameNode(root, "a", "Renamed")).toEqual({
      ok: true,
      value: {
        id: "root",
        name: "Root",
        children: [{ id: "a", name: "Renamed", children: [] }, unchanged],
      },
    });
    expect(root.children[0]?.name).toBe("A");
  });

  it("returns an error when the node is not found", () => {
    expect(renameNode({ id: "root", name: "Root", children: [] }, "missing", "Name")).toEqual({
      ok: false,
      error: expect.objectContaining({ type: "not-found", id: "missing" }),
    });
  });

  it("renames the root node while preserving the children reference", () => {
    const children = [{ id: "a", name: "A", children: [] }];
    const result = renameNode({ id: "root", name: "Root", children }, "root", "Renamed Root");

    expect(result).toEqual({
      ok: true,
      value: { id: "root", name: "Renamed Root", children },
    });
  });

  it("preserves references for branches that do not contain the renamed node", () => {
    const unchanged = { id: "b", name: "B", children: [{ id: "b-1", name: "B1", children: [] }] };
    const root = {
      id: "root",
      name: "Root",
      children: [
        { id: "a", name: "A", children: [{ id: "a-1", name: "A1", children: [] }] },
        unchanged,
      ],
    };
    const result = renameNode(root, "a-1", "A1 renamed");

    expect(result).toEqual(expect.objectContaining({ ok: true }));
    if (result.ok && isNodeFixture(result.value)) {
      expect(result.value.children[1]).toBe(unchanged);
      expect(result.value.children[0]).not.toBe(root.children[0]);
    }
  });
});
