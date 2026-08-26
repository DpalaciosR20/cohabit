import { describe, expect, it } from "vitest";
import { createShoppingItemSchema, updateShoppingItemSchema } from "./shopping-item";

describe("createShoppingItemSchema", () => {
  it("accepts a valid item and defaults quantity to 1", () => {
    const result = createShoppingItemSchema.safeParse({ name: "Leche" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.quantity).toBe(1);
    }
  });

  it("accepts an explicit quantity", () => {
    const result = createShoppingItemSchema.safeParse({ name: "Huevos", quantity: 12 });
    expect(result.success).toBe(true);
  });

  it("rejects an empty name", () => {
    const result = createShoppingItemSchema.safeParse({ name: "  " });
    expect(result.success).toBe(false);
  });

  it("rejects a quantity below 1", () => {
    const result = createShoppingItemSchema.safeParse({ name: "Leche", quantity: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects a non-integer quantity", () => {
    const result = createShoppingItemSchema.safeParse({ name: "Leche", quantity: 1.5 });
    expect(result.success).toBe(false);
  });
});

describe("updateShoppingItemSchema", () => {
  it("accepts a boolean isPurchased", () => {
    const result = updateShoppingItemSchema.safeParse({ isPurchased: true });
    expect(result.success).toBe(true);
  });

  it("accepts editing the name and quantity", () => {
    const result = updateShoppingItemSchema.safeParse({ name: "Leche deslactosada", quantity: 2 });
    expect(result.success).toBe(true);
  });

  it("rejects an empty object (nothing to update)", () => {
    const result = updateShoppingItemSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects an empty name on edit", () => {
    const result = updateShoppingItemSchema.safeParse({ name: "  " });
    expect(result.success).toBe(false);
  });

  it("rejects a quantity below 1 on edit", () => {
    const result = updateShoppingItemSchema.safeParse({ quantity: 0 });
    expect(result.success).toBe(false);
  });
});
