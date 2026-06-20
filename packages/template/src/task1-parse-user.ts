import type { Result } from "./result.js";

export type User = unknown;

export type ValidationError = unknown;

export const parseUser = (_input: unknown): Result<User, readonly ValidationError[]> => {
  throw new Error("Not Implemented");
};
