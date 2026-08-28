import { describe, expect, it } from "vitest";
import { createBillSchema, payBillSchema } from "./bill";

describe("createBillSchema", () => {
  it("accepts a recurring bill with no installments", () => {
    const result = createBillSchema.safeParse({ name: "Internet", amount: 600, dueDay: 5 });
    expect(result.success).toBe(true);
  });

  it("accepts an installment purchase", () => {
    const result = createBillSchema.safeParse({
      name: "Laptop",
      amount: 800,
      dueDay: 10,
      installmentsRemaining: 8,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a dueDay outside 1-31", () => {
    expect(
      createBillSchema.safeParse({ name: "Renta", amount: 100, dueDay: 32 }).success
    ).toBe(false);
    expect(
      createBillSchema.safeParse({ name: "Renta", amount: 100, dueDay: 0 }).success
    ).toBe(false);
  });

  it("rejects a non-positive amount", () => {
    const result = createBillSchema.safeParse({ name: "Renta", amount: 0, dueDay: 1 });
    expect(result.success).toBe(false);
  });

  it("rejects a non-positive installment count", () => {
    const result = createBillSchema.safeParse({
      name: "Laptop",
      amount: 100,
      dueDay: 1,
      installmentsRemaining: 0,
    });
    expect(result.success).toBe(false);
  });

  it("accepts a startsAt in YYYY-MM format", () => {
    const result = createBillSchema.safeParse({
      name: "Internet",
      amount: 600,
      dueDay: 5,
      startsAt: "2026-09",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a malformed startsAt", () => {
    const result = createBillSchema.safeParse({
      name: "Internet",
      amount: 600,
      dueDay: 5,
      startsAt: "September 2026",
    });
    expect(result.success).toBe(false);
  });
});

describe("payBillSchema", () => {
  it("accepts a positive amount", () => {
    expect(payBillSchema.safeParse({ amount: 450 }).success).toBe(true);
  });

  it("rejects a zero amount", () => {
    expect(payBillSchema.safeParse({ amount: 0 }).success).toBe(false);
  });
});
