import { describe, expect, it } from "vitest";
import { setHouseholdSplitSchema } from "./household-split";

describe("setHouseholdSplitSchema", () => {
  it("accepts EVEN mode with no shares", () => {
    const result = setHouseholdSplitSchema.safeParse({ mode: "EVEN" });
    expect(result.success).toBe(true);
  });

  it("accepts INCOME mode with no shares", () => {
    const result = setHouseholdSplitSchema.safeParse({ mode: "INCOME" });
    expect(result.success).toBe(true);
  });

  it("accepts MANUAL shares that sum to exactly 100", () => {
    const result = setHouseholdSplitSchema.safeParse({
      mode: "MANUAL",
      shares: [
        { userId: "a", percent: 70 },
        { userId: "b", percent: 30 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("accepts MANUAL shares within floating-point tolerance of 100", () => {
    const result = setHouseholdSplitSchema.safeParse({
      mode: "MANUAL",
      shares: [
        { userId: "a", percent: 33.33 },
        { userId: "b", percent: 33.33 },
        { userId: "c", percent: 33.34 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects MANUAL shares that don't sum to 100", () => {
    const result = setHouseholdSplitSchema.safeParse({
      mode: "MANUAL",
      shares: [
        { userId: "a", percent: 70 },
        { userId: "b", percent: 20 },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-positive percent in MANUAL mode", () => {
    const result = setHouseholdSplitSchema.safeParse({
      mode: "MANUAL",
      shares: [
        { userId: "a", percent: 100 },
        { userId: "b", percent: 0 },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("rejects MANUAL mode with an empty shares list", () => {
    const result = setHouseholdSplitSchema.safeParse({ mode: "MANUAL", shares: [] });
    expect(result.success).toBe(false);
  });

  it("rejects MANUAL mode without a shares field", () => {
    const result = setHouseholdSplitSchema.safeParse({ mode: "MANUAL" });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown mode", () => {
    const result = setHouseholdSplitSchema.safeParse({ mode: "MAGIC" });
    expect(result.success).toBe(false);
  });
});
