export type CartItem = unknown;

export type Customer = unknown;

export type Coupon = unknown;

export type Cart = unknown;

export type PriceEffect = unknown;

export type PricedCart = unknown;

export type PricingRule = unknown;

export const pricingRules: readonly PricingRule[] = [];

export const priceCart = (_cart: Cart): PricedCart => {
  throw new Error("Not Implemented");
};
