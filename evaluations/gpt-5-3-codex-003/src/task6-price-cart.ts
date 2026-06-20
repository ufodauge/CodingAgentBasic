export type CartItem = {
  readonly id: string;
  readonly price: number;
  readonly quantity: number;
  readonly onSale: boolean;
};

export type Customer = {
  readonly firstPurchase: boolean;
  readonly vip: boolean;
};

export type Coupon = {
  readonly amountOff: number;
};

export type Cart = {
  readonly items: readonly CartItem[];
  readonly customer: Customer;
  readonly coupon?: Coupon;
};

export type PriceEffect =
  | { readonly type: "discount"; readonly code: "sale-items" | "first-purchase" | "coupon"; readonly amount: number }
  | { readonly type: "shipping"; readonly code: "free-shipping"; readonly amount: 0 }
  | { readonly type: "points"; readonly code: "vip-points"; readonly multiplier: 2 };

export type PricedCart = {
  readonly subtotal: number;
  readonly discountTotal: number;
  readonly shipping: number;
  readonly total: number;
  readonly pointMultiplier: 1 | 2;
  readonly effects: readonly PriceEffect[];
};

export type PricingRule = (cart: Cart, subtotal: number) => readonly PriceEffect[];

const shippingCost = 800;
const freeShippingThreshold = 10_000;

const roundYen = (amount: number): number => Math.round(amount);

const lineTotal = (item: CartItem): number => item.price * item.quantity;

const saleItemDiscount: PricingRule = (cart) => {
  const amount = roundYen(
    cart.items.filter((item) => item.onSale).reduce((total, item) => total + lineTotal(item) * 0.2, 0),
  );

  return amount > 0 ? [{ type: "discount", code: "sale-items", amount }] : [];
};

const firstPurchaseDiscount: PricingRule = (cart, subtotal) =>
  cart.customer.firstPurchase
    ? [{ type: "discount", code: "first-purchase", amount: roundYen(subtotal * 0.1) }]
    : [];

const couponDiscount: PricingRule = (cart) =>
  cart.coupon !== undefined && cart.coupon.amountOff > 0
    ? [{ type: "discount", code: "coupon", amount: roundYen(cart.coupon.amountOff) }]
    : [];

const freeShipping: PricingRule = (_cart, subtotal) =>
  subtotal >= freeShippingThreshold ? [{ type: "shipping", code: "free-shipping", amount: 0 }] : [];

const vipPoints: PricingRule = (cart) =>
  cart.customer.vip ? [{ type: "points", code: "vip-points", multiplier: 2 }] : [];

export const pricingRules: readonly PricingRule[] = [
  saleItemDiscount,
  firstPurchaseDiscount,
  couponDiscount,
  freeShipping,
  vipPoints,
];

const isDiscount = (effect: PriceEffect): effect is Extract<PriceEffect, { readonly type: "discount" }> =>
  effect.type === "discount";

const hasFreeShipping = (effect: PriceEffect): boolean => effect.type === "shipping";

const pointMultiplier = (effects: readonly PriceEffect[]): 1 | 2 =>
  effects.some((effect) => effect.type === "points") ? 2 : 1;

export const priceCart = (cart: Cart): PricedCart => {
  const subtotal = cart.items.reduce((total, item) => total + lineTotal(item), 0);
  const effects = pricingRules.flatMap((rule) => rule(cart, subtotal));
  const requestedDiscountTotal = effects
    .filter(isDiscount)
    .reduce((total, effect) => total + effect.amount, 0);
  const discountTotal = Math.min(subtotal, requestedDiscountTotal);
  const shipping = effects.some(hasFreeShipping) ? 0 : shippingCost;

  return {
    subtotal,
    discountTotal,
    shipping,
    total: subtotal - discountTotal + shipping,
    pointMultiplier: pointMultiplier(effects),
    effects,
  };
};
