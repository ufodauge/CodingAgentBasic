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
  let found = false;

  const helper = (node: TreeNode): TreeNode => {
    // If this is the target node, return it with the new name
    if (node.id === id) {
      found = true;
      return { ...node, name };
    }

    // Recursively search children
    const newChildren: TreeNode[] = [];
    let hasChanges = false;

    node.children.forEach((child) => {
      const updated = helper(child);

      // If the child was updated (it's a different reference), use the new one
      if (updated !== child) {
        hasChanges = true;
        newChildren.push(updated);
      } else {
        // If the child wasn't updated, use the original reference
        newChildren.push(child);
      }
    });

    // If we made changes to children, return a new node with updated children
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (hasChanges) {
      return { ...node, children: newChildren };
    }

    // No changes in this subtree
    return node;
  };

  const result = helper(root);

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (found) {
    return ok(result);
  }

  return err({ type: "not-found", id });
};
