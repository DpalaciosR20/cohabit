import { describe, expect, it } from "vitest";
import { setHouseholdSplitSchema } from "./household-split";

describe("setHouseholdSplitSchema", () => {
  it("accepts shares that sum to exactly 100", () => {
    const result = setHouseholdSplitSchema.safeParse({
      shares: [
        { userId: "a", percent: 70 },
        { userId: "b", percent: 30 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("accepts shares within floating-point tolerance of 100", () => {
    const result = setHouseholdSplitSchema.safeParse({
      shares: [
        { userId: "a", percent: 33.33 },
        { userId: "b", percent: 33.33 },
        { userId: "c", percent: 33.34 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects shares that don't sum to 100", () => {
    const result = setHouseholdSplitSchema.safeParse({
      shares: [
        { userId: "a", percent: 70 },
        { userId: "b", percent: 20 },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-positive percent", () => {
    const result = setHouseholdSplitSchema.safeParse({
      shares: [
        { userId: "a", percent: 100 },
        { userId: "b", percent: 0 },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty shares list", () => {
    const result = setHouseholdSplitSchema.safeParse({ shares: [] });
    expect(result.success).toBe(false);
  });
});
