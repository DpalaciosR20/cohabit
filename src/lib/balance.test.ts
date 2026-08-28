import { describe, expect, it } from "vitest";
import { computeBalances } from "./balance";

const members = [
  { userId: "a", name: "Diego" },
  { userId: "b", name: "Novia" },
];

describe("computeBalances", () => {
  it("is all zero when nothing has been spent", () => {
    const result = computeBalances(members, [], []);
    expect(result).toEqual([
      { userId: "a", name: "Diego", balance: 0 },
      { userId: "b", name: "Novia", balance: 0 },
    ]);
  });

  it("credits the payer and debits the person who owes their share", () => {
    const expenses = [{ paidById: "a", amount: 100 }];
    const splits = [
      { userId: "a", shareAmount: 50 },
      { userId: "b", shareAmount: 50 },
    ];

    const result = computeBalances(members, expenses, splits);
    expect(result).toEqual([
      { userId: "a", name: "Diego", balance: 50 },
      { userId: "b", name: "Novia", balance: -50 },
    ]);
  });

  it("nets out across multiple expenses paid by different people", () => {
    // Diego pagó $100 (se divide 50/50); Novia pagó $40 (se divide 20/20)
    // Neto: Diego puso $50 de más, Novia puso $50 de menos → balance final iguala a 0 + ese neto
    const expenses = [
      { paidById: "a", amount: 100 },
      { paidById: "b", amount: 40 },
    ];
    const splits = [
      { userId: "a", shareAmount: 50 },
      { userId: "b", shareAmount: 50 },
      { userId: "a", shareAmount: 20 },
      { userId: "b", shareAmount: 20 },
    ];

    const result = computeBalances(members, expenses, splits);
    const diego = result.find((r) => r.userId === "a")!;
    const novia = result.find((r) => r.userId === "b")!;

    expect(diego.balance).toBe(30);
    expect(novia.balance).toBe(-30);
  });

  it("always sums to zero across all members", () => {
    const expenses = [{ paidById: "a", amount: 33.33 }];
    const splits = [
      { userId: "a", shareAmount: 16.67 },
      { userId: "b", shareAmount: 16.66 },
    ];

    const result = computeBalances(members, expenses, splits);
    const total = result.reduce((sum, r) => sum + r.balance, 0);
    expect(Math.round(total * 100) / 100).toBe(0);
  });

  it("a settlement reduces what the payer owes and what the receiver is owed", () => {
    const expenses = [{ paidById: "a", amount: 100 }];
    const splits = [
      { userId: "a", shareAmount: 50 },
      { userId: "b", shareAmount: 50 },
    ];
    // Novia (b) le debía $50 a Diego (a); registra que ya le pagó esos $50.
    const settlements = [{ fromUserId: "b", toUserId: "a", amount: 50 }];

    const result = computeBalances(members, expenses, splits, settlements);
    expect(result).toEqual([
      { userId: "a", name: "Diego", balance: 0 },
      { userId: "b", name: "Novia", balance: 0 },
    ]);
  });

  it("a partial settlement only closes part of the debt", () => {
    const expenses = [{ paidById: "a", amount: 100 }];
    const splits = [
      { userId: "a", shareAmount: 50 },
      { userId: "b", shareAmount: 50 },
    ];
    const settlements = [{ fromUserId: "b", toUserId: "a", amount: 20 }];

    const result = computeBalances(members, expenses, splits, settlements);
    const novia = result.find((r) => r.userId === "b")!;
    expect(novia.balance).toBe(-30);
  });

  it("settlements alone still sum to zero", () => {
    const settlements = [{ fromUserId: "a", toUserId: "b", amount: 25 }];
    const result = computeBalances(members, [], [], settlements);
    const total = result.reduce((sum, r) => sum + r.balance, 0);
    expect(total).toBe(0);
  });
});
