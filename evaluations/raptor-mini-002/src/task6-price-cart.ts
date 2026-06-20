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
  | { readonly type: "shipping"; readonly code: "free-shipping" | "standard-shipping"; readonly amount: number }
  | { readonly type: "points"; readonly code: "vip-points"; readonly multiplier: number };

export type PricedCart = {
  readonly subtotal: number;
  readonly discountTotal: number;
  readonly shipping: number;
  readonly total: number;
  readonly pointMultiplier: number;
  readonly effects: readonly PriceEffect[];
};

export type PricingRule = (cart: Cart, subtotal: number) => PriceEffect | null;

export const pricingRules: readonly PricingRule[] = [];

const roundYen = (value: number): number => Math.round(value);

const calculateSubtotal = (cart: Cart): number =>
  cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

const calculateSaleDiscount = (cart: Cart): number =>
  roundYen(
    cart.items.reduce(
      (sum, item) => sum + (item.onSale ? item.price * item.quantity * 0.2 : 0),
      0,
    ),
  );

const calculateFirstPurchaseDiscount = (cart: Cart, subtotal: number): number =>
  cart.customer.firstPurchase ? roundYen(subtotal * 0.1) : 0;

const calculateCouponDiscount = (cart: Cart): number =>
  cart.coupon?.amountOff != null ? Math.max(0, cart.coupon.amountOff) : 0;

export const priceCart = (cart: Cart): PricedCart => {
  const subtotal = calculateSubtotal(cart);
  const saleDiscount = calculateSaleDiscount(cart);
  const firstPurchaseDiscount = calculateFirstPurchaseDiscount(cart, subtotal);
  const couponDiscount = calculateCouponDiscount(cart);

  let remaining = subtotal;
  const appliedSale = Math.min(saleDiscount, remaining);
  remaining -= appliedSale;

  const appliedFirstPurchase = Math.min(firstPurchaseDiscount, remaining);
  remaining -= appliedFirstPurchase;

  const appliedCoupon = Math.min(couponDiscount, remaining);

  const discountTotal = appliedSale + appliedFirstPurchase + appliedCoupon;
  const shipping = subtotal >= 10_000 ? 0 : 800;
  const pointMultiplier = cart.customer.vip ? 2 : 1;

  const effects: PriceEffect[] = [];

  if (appliedSale > 0) {
    effects.push({ type: "discount", code: "sale-items", amount: appliedSale });
  }
  if (appliedFirstPurchase > 0) {
    effects.push({ type: "discount", code: "first-purchase", amount: appliedFirstPurchase });
  }
  if (appliedCoupon > 0) {
    effects.push({ type: "discount", code: "coupon", amount: appliedCoupon });
  }

  effects.push({
    type: "shipping",
    code: subtotal >= 10_000 ? "free-shipping" : "standard-shipping",
    amount: shipping,
  });
  effects.push({ type: "points", code: "vip-points", multiplier: pointMultiplier });

  return {
    subtotal,
    discountTotal,
    shipping,
    total: subtotal - discountTotal + shipping,
    pointMultiplier,
    effects,
  };
};
