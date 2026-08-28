import { describe, expect, it } from "vitest";
import { createSettlementSchema } from "./settlement";

describe("createSettlementSchema", () => {
  it("accepts a valid settlement", () => {
    const result = createSettlementSchema.safeParse({ toUserId: "user-1", amount: 50 });
    expect(result.success).toBe(true);
  });

  it("rejects a missing toUserId", () => {
    const result = createSettlementSchema.safeParse({ toUserId: "", amount: 50 });
    expect(result.success).toBe(false);
  });

  it("rejects a non-positive amount", () => {
    const result = createSettlementSchema.safeParse({ toUserId: "user-1", amount: 0 });
    expect(result.success).toBe(false);
  });
});
