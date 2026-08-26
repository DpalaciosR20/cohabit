import { describe, expect, it } from "vitest";
import { signInSchema, signUpSchema } from "./auth";

describe("signUpSchema", () => {
  it("accepts valid input", () => {
    const result = signUpSchema.safeParse({
      name: "Diego",
      email: "Diego@Example.com",
      password: "supersecret",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("diego@example.com");
    }
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = signUpSchema.safeParse({
      name: "Diego",
      email: "diego@example.com",
      password: "short",
    });

    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = signUpSchema.safeParse({
      name: "Diego",
      email: "not-an-email",
      password: "supersecret",
    });

    expect(result.success).toBe(false);
  });

  it("rejects an empty name", () => {
    const result = signUpSchema.safeParse({
      name: "  ",
      email: "diego@example.com",
      password: "supersecret",
    });

    expect(result.success).toBe(false);
  });
});

describe("signInSchema", () => {
  it("accepts valid credentials shape", () => {
    const result = signInSchema.safeParse({
      email: "diego@example.com",
      password: "anything",
    });

    expect(result.success).toBe(true);
  });

  it("rejects a missing password", () => {
    const result = signInSchema.safeParse({
      email: "diego@example.com",
      password: "",
    });

    expect(result.success).toBe(false);
  });
});
