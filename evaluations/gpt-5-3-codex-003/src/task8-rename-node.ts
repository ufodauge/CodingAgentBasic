import { err, ok, type Result } from "./result.js";

export type TreeNode = {
  readonly id: string;
  readonly name: string;
  readonly children: readonly TreeNode[];
};

export type RenameError = {
  readonly type: "not-found";
  readonly id: string;
};

const renameNodeValue = (
  root: TreeNode,
  id: string,
  name: string,
): { readonly found: true; readonly node: TreeNode } | { readonly found: false } => {
  if (root.id === id) {
    return { found: true, node: { ...root, name } };
  }

  const renamedChildren = root.children.map((child) => renameNodeValue(child, id, name));
  const renamedIndex = renamedChildren.findIndex((result) => result.found);

  if (renamedIndex === -1) {
    return { found: false };
  }

  return {
    found: true,
    node: {
      ...root,
      children: root.children.map((child, index) => {
        const renamedChild = renamedChildren[index];
        return renamedChild?.found === true ? renamedChild.node : child;
      }),
    },
  };
};

export const renameNode = (
  root: TreeNode,
  id: string,
  name: string,
): Result<TreeNode, RenameError> => {
  const result = renameNodeValue(root, id, name);

  return result.found ? ok(result.node) : err({ type: "not-found", id });
};
