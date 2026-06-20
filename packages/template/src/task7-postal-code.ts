import type { Option } from "./option.js";

export type ApiResponse = unknown;

export const getPostalCode = (_response: ApiResponse): Option<string> => {
  throw new Error("Not Implemented");
};
