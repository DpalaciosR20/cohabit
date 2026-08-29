import { describe, expect, it } from "vitest";
import { createBillSchema, payBillSchema, updateBillSchema } from "./bill";

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

  it("accepts a valid category", () => {
    const result = createBillSchema.safeParse({
      name: "Internet",
      amount: 600,
      dueDay: 5,
      category: "Servicios",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a category outside the curated set", () => {
    const result = createBillSchema.safeParse({
      name: "Internet",
      amount: 600,
      dueDay: 5,
      category: "Vacaciones",
    });
    expect(result.success).toBe(false);
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

  it("accepts installmentsRemaining together with a totalInstallments", () => {
    const result = createBillSchema.safeParse({
      name: "Laptop",
      amount: 800,
      dueDay: 10,
      installmentsRemaining: 9,
      totalInstallments: 12,
    });
    expect(result.success).toBe(true);
  });

  it("rejects installmentsRemaining greater than totalInstallments", () => {
    const result = createBillSchema.safeParse({
      name: "Laptop",
      amount: 800,
      dueDay: 10,
      installmentsRemaining: 12,
      totalInstallments: 9,
    });
    expect(result.success).toBe(false);
  });
});

describe("updateBillSchema", () => {
  it("accepts a partial update", () => {
    expect(updateBillSchema.safeParse({ name: "Internet 2" }).success).toBe(true);
    expect(updateBillSchema.safeParse({ amount: 650 }).success).toBe(true);
    expect(updateBillSchema.safeParse({}).success).toBe(true);
  });

  it("rejects a non-positive amount", () => {
    expect(updateBillSchema.safeParse({ amount: 0 }).success).toBe(false);
  });

  it("rejects a dueDay outside 1-31", () => {
    expect(updateBillSchema.safeParse({ dueDay: 32 }).success).toBe(false);
  });

  it("does not accept installmentsRemaining — se deriva en el servidor", () => {
    const result = updateBillSchema.safeParse({ installmentsRemaining: 5 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty("installmentsRemaining");
    }
  });

  it("accepts a positive totalInstallments", () => {
    expect(updateBillSchema.safeParse({ totalInstallments: 12 }).success).toBe(true);
  });

  it("rejects a non-positive totalInstallments", () => {
    expect(updateBillSchema.safeParse({ totalInstallments: 0 }).success).toBe(false);
  });

  it("accepts a valid category", () => {
    expect(updateBillSchema.safeParse({ category: "Servicios" }).success).toBe(true);
  });

  it("accepts clearing the category with null", () => {
    expect(updateBillSchema.safeParse({ category: null }).success).toBe(true);
  });

  it("rejects a category outside the curated set", () => {
    expect(updateBillSchema.safeParse({ category: "Vacaciones" }).success).toBe(false);
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
