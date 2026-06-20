import type { Option } from "./option.js";
import { none, some } from "./option.js";

export type ApiResponse = {
  readonly user?: {
    readonly profile?: {
      readonly address?: {
        readonly postalCode?: string;
      } | null;
    } | null;
  } | null;
};

export const getPostalCode = (response: ApiResponse): Option<string> => {
  const postalCode = response.user?.profile?.address?.postalCode;

  if (postalCode == null || typeof postalCode !== "string") {
    return none();
  }

  const normalized = postalCode.trim();
  return normalized === "" ? none() : some(normalized);
};
