import { describe, expect, it } from "vitest";
import { upsertPersonalBudgetSchema } from "./personal-budget";

describe("upsertPersonalBudgetSchema", () => {
  it("accepts a positive monthlyLimit", () => {
    expect(upsertPersonalBudgetSchema.safeParse({ monthlyLimit: 1000 }).success).toBe(true);
  });

  it("rejects a zero monthlyLimit", () => {
    expect(upsertPersonalBudgetSchema.safeParse({ monthlyLimit: 0 }).success).toBe(false);
  });

  it("rejects a negative monthlyLimit", () => {
    expect(upsertPersonalBudgetSchema.safeParse({ monthlyLimit: -10 }).success).toBe(false);
  });

  it("rejects an unreasonably large monthlyLimit", () => {
    expect(upsertPersonalBudgetSchema.safeParse({ monthlyLimit: 10_000_000 }).success).toBe(false);
  });
});
