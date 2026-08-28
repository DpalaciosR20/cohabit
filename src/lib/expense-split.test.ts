import { describe, expect, it } from "vitest";
import { splitByShares, splitEvenly } from "./expense-split";

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

describe("splitByShares", () => {
  it("splits 70/30 exactly, giving the leftover cent to whoever's remainder is larger", () => {
    const result = splitByShares(
      100.01,
      [
        { userId: "a", percent: 70 },
        { userId: "b", percent: 30 },
      ],
      "b"
    );
    expect(result).toEqual([
      { userId: "a", shareAmount: 70.01 },
      { userId: "b", shareAmount: 30 },
    ]);
  });

  it("matches splitEvenly's tie-break (payer gets the odd cent) for a 50/50 split", () => {
    const result = splitByShares(
      10.01,
      [
        { userId: "b", percent: 50 },
        { userId: "a", percent: 50 },
      ],
      "a"
    );
    expect(result).toEqual([
      { userId: "b", shareAmount: 5 },
      { userId: "a", shareAmount: 5.01 },
    ]);
  });

  it("handles a clean 3-way uneven split with no remainder", () => {
    const result = splitByShares(
      100,
      [
        { userId: "a", percent: 33.33 },
        { userId: "b", percent: 33.33 },
        { userId: "c", percent: 33.34 },
      ],
      "a"
    );
    expect(result).toEqual([
      { userId: "a", shareAmount: 33.33 },
      { userId: "b", shareAmount: 33.33 },
      { userId: "c", shareAmount: 33.34 },
    ]);
  });

  it("distributes a leftover cent by largest fractional remainder in a 3-way split", () => {
    const result = splitByShares(
      19.99,
      [
        { userId: "a", percent: 33.33 },
        { userId: "b", percent: 33.33 },
        { userId: "c", percent: 33.34 },
      ],
      "a"
    );
    expect(result).toEqual([
      { userId: "a", shareAmount: 6.66 },
      { userId: "b", shareAmount: 6.66 },
      { userId: "c", shareAmount: 6.67 },
    ]);
  });

  it("the shares always add up to the original amount", () => {
    const result = splitByShares(
      19.99,
      [
        { userId: "a", percent: 70 },
        { userId: "b", percent: 20 },
        { userId: "c", percent: 10 },
      ],
      "b"
    );
    const total = result.reduce((sum, s) => sum + s.shareAmount, 0);
    expect(Math.round(total * 100) / 100).toBe(19.99);
  });

  it("assigns the whole amount to a single-member household", () => {
    const result = splitByShares(42, [{ userId: "a", percent: 100 }], "a");
    expect(result).toEqual([{ userId: "a", shareAmount: 42 }]);
  });

  it("throws when there are no members to split between", () => {
    expect(() => splitByShares(10, [], "a")).toThrow();
  });
});
