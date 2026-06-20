// No imports needed for this file

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

export type DiscountEffect = {
  readonly type: "discount";
  readonly code: string;
  readonly amount: number;
};

export type ShippingEffect = {
  readonly type: "shipping";
  readonly code: string;
  readonly amount: number;
};

export type PointsEffect = {
  readonly type: "points";
  readonly code: string;
  readonly multiplier: number;
};

export type PriceEffect = DiscountEffect | ShippingEffect | PointsEffect;

export type PricedCart = {
  readonly subtotal: number;
  readonly discountTotal: number;
  readonly shipping: number;
  readonly total: number;
  readonly pointMultiplier: number;
  readonly effects: readonly PriceEffect[];
};

export type PricingRule = {
  readonly name: string;
  readonly apply: (cart: Cart, subtotal: number, appliedDiscounts: number) => PriceEffect | null;
};

const SHIPPING_COST = 800;
const FREE_SHIPPING_THRESHOLD = 10_000;

export const pricingRules: readonly PricingRule[] = [
  {
    name: "sale-items",
    apply: (cart) => {
      const discount = Math.round(
        cart.items.reduce((sum, item) => {
          if (item.onSale) {
            return sum + item.price * item.quantity * 0.2;
          }
          return sum;
        }, 0),
      );

      return discount > 0
        ? { type: "discount", code: "sale-items", amount: discount }
        : null;
    },
  },
  {
    name: "first-purchase",
    apply: (cart, subtotal) => {
      if (!cart.customer.firstPurchase) {
        return null;
      }

      const discount = Math.round(subtotal * 0.1);
      return { type: "discount", code: "first-purchase", amount: discount };
    },
  },
  {
    name: "coupon",
    apply: (cart) => {
      if (!cart.coupon || cart.coupon.amountOff === 0) {
        return null;
      }

      return { type: "discount", code: "coupon", amount: cart.coupon.amountOff };
    },
  },
  {
    name: "free-shipping",
    apply: (cart, subtotal) => {
      const amount = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
      return { type: "shipping", code: "free-shipping", amount };
    },
  },
  {
    name: "vip-points",
    apply: (cart) => {
      return cart.customer.vip ? { type: "points", code: "vip-points", multiplier: 2 } : null;
    },
  },
];

export const priceCart = (cart: Cart): PricedCart => {
  const subtotal = cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const effects: PriceEffect[] = [];
  let appliedDiscounts = 0;

  pricingRules.forEach((rule) => {
    const effect = rule.apply(cart, subtotal, appliedDiscounts);

    if (effect) {
      effects.push(effect);

      if (effect.type === "discount") {
        appliedDiscounts += effect.amount;
      }
    }
  });

  // Cap discounts at subtotal
  const cappedDiscounts = Math.min(appliedDiscounts, subtotal);

  // Find shipping effect
  const shippingEffect = effects.find((e): e is ShippingEffect => e.type === "shipping");
  const shipping = shippingEffect?.amount ?? 0;

  // Find points effect
  const pointsEffect = effects.find((e): e is PointsEffect => e.type === "points");
  const pointMultiplier = pointsEffect?.multiplier ?? 1;

  const total = subtotal - cappedDiscounts + shipping;

  return {
    subtotal,
    discountTotal: cappedDiscounts,
    shipping,
    total,
    pointMultiplier,
    effects,
  };
};
