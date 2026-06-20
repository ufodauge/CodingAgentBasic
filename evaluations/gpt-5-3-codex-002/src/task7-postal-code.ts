import type { Option } from "./option.js";
import { fromNullable, none, optionFlatMap, optionMap, some } from "./option.js";

export type ApiResponse = {
  readonly user?: {
    readonly profile?: {
      readonly address?: {
        readonly postalCode?: string;
      } | null;
    };
  };
};

export const getPostalCode = (response: ApiResponse): Option<string> =>
  optionFlatMap(fromNullable(response.user), (user) =>
    optionFlatMap(fromNullable(user.profile), (profile) =>
      optionFlatMap(fromNullable(profile.address), (address) =>
        optionFlatMap(optionMap(fromNullable(address.postalCode), (postalCode) => postalCode.trim()),
          (postalCode) => (postalCode.length === 0 ? none<string>() : some(postalCode)),
        ),
      ),
    ),
  );
