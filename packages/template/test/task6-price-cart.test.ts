import { describe, expect, it } from "vitest";
import { priceCart } from "../src/task6-price-cart.js";

describe("priceCart", () => {
  it("applies independent pricing rules without mutating the cart", () => {
    const cart = {
      items: [{ id: "i-1", price: 10_000, quantity: 1, onSale: true }],
      customer: { firstPurchase: true, vip: true },
      coupon: { amountOff: 500 },
    };

    expect(priceCart(cart)).toEqual({
      subtotal: 10_000,
      discountTotal: 3_500,
      shipping: 0,
      total: 6_500,
      pointMultiplier: 2,
      effects: expect.arrayContaining([
        { type: "discount", code: "sale-items", amount: 2_000 },
        { type: "discount", code: "first-purchase", amount: 1_000 },
        { type: "discount", code: "coupon", amount: 500 },
        { type: "shipping", code: "free-shipping", amount: 0 },
        { type: "points", code: "vip-points", multiplier: 2 },
      ]),
    });
    expect(cart.items[0]?.price).toBe(10_000);
  });

  it("caps discounts at subtotal before adding shipping", () => {
    expect(
      priceCart({
        items: [{ id: "i-1", price: 100, quantity: 1, onSale: false }],
        customer: { firstPurchase: false, vip: false },
        coupon: { amountOff: 10_000 },
      }),
    ).toEqual(expect.objectContaining({ discountTotal: 100, shipping: 800, total: 800 }));
  });

  it("keeps shipping cost when subtotal is below the free-shipping threshold", () => {
    expect(
      priceCart({
        items: [{ id: "i-1", price: 9_999, quantity: 1, onSale: false }],
        customer: { firstPurchase: false, vip: false },
      }),
    ).toEqual(expect.objectContaining({ subtotal: 9_999, shipping: 800, total: 10_799 }));
  });

  it("returns a stable effect order for explainable price breakdowns", () => {
    const result = priceCart({
      items: [{ id: "i-1", price: 10_000, quantity: 1, onSale: true }],
      customer: { firstPurchase: true, vip: true },
      coupon: { amountOff: 500 },
    });

    expect(result).toEqual(
      expect.objectContaining({
        effects: [
          { type: "discount", code: "sale-items", amount: 2_000 },
          { type: "discount", code: "first-purchase", amount: 1_000 },
          { type: "discount", code: "coupon", amount: 500 },
          { type: "shipping", code: "free-shipping", amount: 0 },
          { type: "points", code: "vip-points", multiplier: 2 },
        ],
      }),
    );
  });

  it("rounds fractional yen discounts to whole yen", () => {
    expect(
      priceCart({
        items: [{ id: "i-1", price: 333, quantity: 1, onSale: true }],
        customer: { firstPurchase: false, vip: false },
      }),
    ).toEqual(expect.objectContaining({ subtotal: 333, discountTotal: 67, total: 1_066 }));
  });
});
