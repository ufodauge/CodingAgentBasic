import type { Result } from "./result.js";
import { err, ok } from "./result.js";

export type TreeNode = {
  readonly id: string;
  readonly name: string;
  readonly children: readonly TreeNode[];
};

export type RenameError = {
  readonly type: "not-found";
  readonly id: string;
};

type RenameVisit = {
  readonly found: boolean;
  readonly node: TreeNode;
};

const visitRename = (node: TreeNode, id: string, name: string): RenameVisit => {
  if (node.id === id) {
    return {
      found: true,
      node: node.name === name ? node : { ...node, name },
    };
  }

  const childResults = node.children.map((child) => visitRename(child, id, name));
  const found = childResults.some((result) => result.found);
  if (!found) {
    return { found: false, node };
  }

  const nextChildren = childResults.map((result) => result.node);
  const hasChanged = nextChildren.some((child, index) => child !== node.children[index]);

  return {
    found: true,
    node: hasChanged ? { ...node, children: nextChildren } : node,
  };
};

export const renameNode = (
  root: TreeNode,
  id: string,
  name: string,
): Result<TreeNode, RenameError> => {
  const result = visitRename(root, id, name);
  return result.found ? ok(result.node) : err({ type: "not-found", id });
};
