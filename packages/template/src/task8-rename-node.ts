import type { Result } from "./result.js";

export type TreeNode = unknown;

export type RenameError = unknown;

export const renameNode = (
  _root: TreeNode,
  _id: string,
  _name: string,
): Result<TreeNode, RenameError> => {
  throw new Error("Not Implemented");
};
