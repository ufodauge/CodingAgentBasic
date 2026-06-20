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

export const renameNode = (
  root: TreeNode,
  id: string,
  name: string,
): Result<TreeNode, RenameError> => {
  const renameRecursively = (node: TreeNode): [TreeNode, boolean] => {
    if (node.id === id) {
      return [{ ...node, name }, true];
    }

    const childResults = node.children.map((child) => renameRecursively(child));
    const updatedChildren = childResults.map(([updated]) => updated);
    const found = childResults.some(([, childFound]) => childFound);

    return found ? [{ ...node, children: updatedChildren }, true] : [node, false];
  };

  const [updated, found] = renameRecursively(root);
  return found ? ok(updated) : err({ type: "not-found", id });
};
