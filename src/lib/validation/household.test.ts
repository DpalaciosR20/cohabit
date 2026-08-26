import { describe, expect, it } from "vitest";
import { createHouseholdSchema, joinHouseholdSchema } from "./household";

describe("createHouseholdSchema", () => {
  it("accepts a valid name", () => {
    const result = createHouseholdSchema.safeParse({ name: "Nuestro depa" });
    expect(result.success).toBe(true);
  });

  it("rejects an empty name", () => {
    const result = createHouseholdSchema.safeParse({ name: "   " });
    expect(result.success).toBe(false);
  });

  it("rejects a name over 100 characters", () => {
    const result = createHouseholdSchema.safeParse({ name: "a".repeat(101) });
    expect(result.success).toBe(false);
  });
});

describe("joinHouseholdSchema", () => {
  it("accepts a non-empty invite code", () => {
    const result = joinHouseholdSchema.safeParse({ inviteCode: "abc123" });
    expect(result.success).toBe(true);
  });

  it("rejects an empty invite code", () => {
    const result = joinHouseholdSchema.safeParse({ inviteCode: "  " });
    expect(result.success).toBe(false);
  });
});
