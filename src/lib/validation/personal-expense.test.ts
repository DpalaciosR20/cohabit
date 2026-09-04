import { describe, expect, it } from "vitest";
import { createPersonalExpenseSchema } from "./personal-expense";

describe("createPersonalExpenseSchema", () => {
  it("accepts a valid personal expense", () => {
    const result = createPersonalExpenseSchema.safeParse({
      description: "Gimnasio",
      amount: 450,
    });
    expect(result.success).toBe(true);
  });

  it("accepts an optional category", () => {
    const result = createPersonalExpenseSchema.safeParse({
      description: "Gimnasio",
      amount: 450,
      category: "Salud",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a category outside the curated set", () => {
    const result = createPersonalExpenseSchema.safeParse({
      description: "Gimnasio",
      amount: 450,
      category: "Vacaciones",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-positive amount", () => {
    expect(
      createPersonalExpenseSchema.safeParse({ description: "Gimnasio", amount: 0 }).success
    ).toBe(false);
  });

  it("rejects an empty description", () => {
    expect(
      createPersonalExpenseSchema.safeParse({ description: "  ", amount: 10 }).success
    ).toBe(false);
  });

  it("rejects an unreasonably large amount", () => {
    expect(
      createPersonalExpenseSchema.safeParse({ description: "Gimnasio", amount: 10_000_000 })
        .success
    ).toBe(false);
  });
});
