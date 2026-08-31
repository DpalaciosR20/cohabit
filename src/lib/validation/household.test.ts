import { describe, expect, it } from "vitest";
import { createHouseholdSchema, joinHouseholdSchema, renameHouseholdSchema } from "./household";

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

  it("accepts an optional targetMemberCount", () => {
    const result = createHouseholdSchema.safeParse({ name: "Nuestro depa", targetMemberCount: 3 });
    expect(result.success).toBe(true);
  });

  it("works without a targetMemberCount", () => {
    const result = createHouseholdSchema.safeParse({ name: "Nuestro depa" });
    expect(result.success).toBe(true);
  });

  it("rejects a non-positive targetMemberCount", () => {
    const result = createHouseholdSchema.safeParse({ name: "Nuestro depa", targetMemberCount: 0 });
    expect(result.success).toBe(false);
  });
});

describe("renameHouseholdSchema", () => {
  it("accepts a valid name", () => {
    expect(renameHouseholdSchema.safeParse({ name: "Depa nuevo" }).success).toBe(true);
  });

  it("rejects an empty name", () => {
    expect(renameHouseholdSchema.safeParse({ name: "   " }).success).toBe(false);
  });

  it("rejects a name over 100 characters", () => {
    expect(renameHouseholdSchema.safeParse({ name: "a".repeat(101) }).success).toBe(false);
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
