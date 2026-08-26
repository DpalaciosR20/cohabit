import { describe, expect, it } from "vitest";
import { createExpenseSchema } from "./expense";

describe("createExpenseSchema", () => {
  it("accepts a valid expense", () => {
    const result = createExpenseSchema.safeParse({
      description: "Supermercado",
      amount: 45.5,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a zero amount", () => {
    const result = createExpenseSchema.safeParse({ description: "Renta", amount: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects a negative amount", () => {
    const result = createExpenseSchema.safeParse({ description: "Renta", amount: -10 });
    expect(result.success).toBe(false);
  });

  it("rejects an empty description", () => {
    const result = createExpenseSchema.safeParse({ description: "  ", amount: 10 });
    expect(result.success).toBe(false);
  });

  it("rejects an unreasonably large amount", () => {
    const result = createExpenseSchema.safeParse({
      description: "Renta",
      amount: 10_000_000,
    });
    expect(result.success).toBe(false);
  });
});
