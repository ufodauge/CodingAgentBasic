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
  | {
      readonly type: "discount";
      readonly code: "sale-items" | "first-purchase" | "coupon";
      readonly amount: number;
    }
  | {
      readonly type: "shipping";
      readonly code: "free-shipping" | "standard-shipping";
      readonly amount: number;
    }
  | {
      readonly type: "points";
      readonly code: "vip-points" | "standard-points";
      readonly multiplier: number;
    };

export type PricedCart = {
  readonly subtotal: number;
  readonly discountTotal: number;
  readonly shipping: number;
  readonly total: number;
  readonly pointMultiplier: number;
  readonly effects: readonly PriceEffect[];
};

export type PricingRule = (cart: Cart, subtotal: number) => readonly PriceEffect[];

const STANDARD_SHIPPING_YEN = 800;
const FREE_SHIPPING_THRESHOLD_YEN = 10_000;
const roundYen = (value: number): number => Math.round(value);

const saleItemsRule: PricingRule = (cart) => {
  const saleAmount = roundYen(
    cart.items
      .filter((item) => item.onSale)
      .reduce((sum, item) => sum + item.price * item.quantity * 0.2, 0),
  );

  return saleAmount > 0
    ? [{ type: "discount", code: "sale-items", amount: saleAmount }]
    : [];
};

const firstPurchaseRule: PricingRule = (cart, subtotal) =>
  cart.customer.firstPurchase
    ? [{ type: "discount", code: "first-purchase", amount: roundYen(subtotal * 0.1) }]
    : [];

const couponRule: PricingRule = (cart) =>
  cart.coupon && cart.coupon.amountOff > 0
    ? [{ type: "discount", code: "coupon", amount: roundYen(cart.coupon.amountOff) }]
    : [];

const shippingRule: PricingRule = (_cart, subtotal) =>
  subtotal >= FREE_SHIPPING_THRESHOLD_YEN
    ? [{ type: "shipping", code: "free-shipping", amount: 0 }]
    : [{ type: "shipping", code: "standard-shipping", amount: STANDARD_SHIPPING_YEN }];

const pointsRule: PricingRule = (cart) =>
  cart.customer.vip
    ? [{ type: "points", code: "vip-points", multiplier: 2 }]
    : [{ type: "points", code: "standard-points", multiplier: 1 }];

export const pricingRules: readonly PricingRule[] = [
  saleItemsRule,
  firstPurchaseRule,
  couponRule,
  shippingRule,
  pointsRule,
];

const applyDiscountCap = (
  discountEffects: readonly Extract<PriceEffect, { readonly type: "discount" }>[],
  subtotal: number,
): readonly Extract<PriceEffect, { readonly type: "discount" }>[] => {
  let remaining = subtotal;

  return discountEffects.map((effect) => {
    const applied = Math.min(effect.amount, remaining);
    remaining -= applied;
    return { ...effect, amount: applied };
  });
};

export const priceCart = (cart: Cart): PricedCart => {
  const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const effects = pricingRules.flatMap((rule) => rule(cart, subtotal));

  const cappedDiscountEffects = applyDiscountCap(
    effects.filter(
      (effect): effect is Extract<PriceEffect, { readonly type: "discount" }> =>
        effect.type === "discount",
    ),
    subtotal,
  );

  const effectByCode = new Map(
    cappedDiscountEffects.map((effect) => [effect.code, effect] as const),
  );
  const normalizedEffects = effects.map((effect) =>
    effect.type === "discount" ? effectByCode.get(effect.code) ?? effect : effect,
  );

  const discountTotal = cappedDiscountEffects.reduce((sum, effect) => sum + effect.amount, 0);

  const shipping =
    normalizedEffects.find(
      (effect): effect is Extract<PriceEffect, { readonly type: "shipping" }> =>
        effect.type === "shipping",
    )?.amount ?? STANDARD_SHIPPING_YEN;

  const pointMultiplier =
    normalizedEffects.find(
      (effect): effect is Extract<PriceEffect, { readonly type: "points" }> =>
        effect.type === "points",
    )?.multiplier ?? 1;

  const total = subtotal - discountTotal + shipping;

  return {
    subtotal,
    discountTotal,
    shipping,
    total,
    pointMultiplier,
    effects: normalizedEffects,
  };
};
