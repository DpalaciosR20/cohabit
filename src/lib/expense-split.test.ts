import { describe, expect, it } from "vitest";
import { splitEvenly } from "./expense-split";

describe("splitEvenly", () => {
  it("splits an even amount exactly in half between two people", () => {
    const result = splitEvenly(100, ["a", "b"], "a");
    expect(result).toEqual([
      { userId: "a", shareAmount: 50 },
      { userId: "b", shareAmount: 50 },
    ]);
  });

  it("gives the odd cent to the payer when the amount doesn't divide evenly", () => {
    const result = splitEvenly(10.01, ["a", "b"], "a");
    expect(result).toEqual([
      { userId: "a", shareAmount: 5.01 },
      { userId: "b", shareAmount: 5 },
    ]);
  });

  it("still gives the odd cent to the payer even if they're listed second", () => {
    const result = splitEvenly(10.01, ["b", "a"], "a");
    expect(result).toEqual([
      { userId: "a", shareAmount: 5.01 },
      { userId: "b", shareAmount: 5 },
    ]);
  });

  it("the shares always add up to the original amount", () => {
    const result = splitEvenly(19.99, ["a", "b", "c"], "b");
    const total = result.reduce((sum, s) => sum + s.shareAmount, 0);
    expect(Math.round(total * 100) / 100).toBe(19.99);
  });

  it("assigns the whole amount to a single-member household", () => {
    const result = splitEvenly(42, ["a"], "a");
    expect(result).toEqual([{ userId: "a", shareAmount: 42 }]);
  });

  it("throws when there are no members to split between", () => {
    expect(() => splitEvenly(10, [], "a")).toThrow();
  });
});
