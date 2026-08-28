import { describe, expect, it } from "vitest";
import { updateProfileSchema } from "./profile";

describe("updateProfileSchema", () => {
  it("accepts a color-only update", () => {
    expect(updateProfileSchema.safeParse({ color: "TEAL" }).success).toBe(true);
  });

  it("rejects an unknown color", () => {
    expect(updateProfileSchema.safeParse({ color: "MAGENTA" }).success).toBe(false);
  });

  it("accepts a monthlyIncome-only update", () => {
    expect(updateProfileSchema.safeParse({ monthlyIncome: 15000 }).success).toBe(true);
  });

  it("accepts clearing monthlyIncome with null", () => {
    expect(updateProfileSchema.safeParse({ monthlyIncome: null }).success).toBe(true);
  });

  it("rejects a non-positive monthlyIncome", () => {
    expect(updateProfileSchema.safeParse({ monthlyIncome: 0 }).success).toBe(false);
  });

  it("accepts an empty update", () => {
    expect(updateProfileSchema.safeParse({}).success).toBe(true);
  });
});
