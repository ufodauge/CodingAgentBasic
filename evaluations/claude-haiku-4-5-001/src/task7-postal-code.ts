import { isString } from "./guards.js";

export type ApiResponse = {
  readonly user?: {
    readonly profile?: {
      readonly address?: {
        readonly postalCode?: string;
      } | null;
    };
  };
};

export const getPostalCode = (response: ApiResponse): string | undefined => {
  const postalCode = response.user?.profile?.address?.postalCode;

  if (!isString(postalCode)) {
    return undefined;
  }

  const trimmed = postalCode.trim();

  return trimmed === "" ? undefined : trimmed;
};
