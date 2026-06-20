export type ApiResponse = {
  readonly user?: {
    readonly profile?: {
      readonly address?: { readonly postalCode?: string } | null;
    } | null;
  } | null;
};

export const getPostalCode = (response: ApiResponse): string | undefined => {
  const postalCode = response.user?.profile?.address?.postalCode?.trim();

  return postalCode === undefined || postalCode.length === 0 ? undefined : postalCode;
};
