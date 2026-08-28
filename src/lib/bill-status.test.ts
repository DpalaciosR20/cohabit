import { describe, expect, it } from "vitest";
import { computeBillStatus } from "./bill-status";

describe("computeBillStatus", () => {
  it("marks it upcoming when far from the due day and never paid", () => {
    const today = new Date(2026, 2, 1); // 1 de marzo
    const result = computeBillStatus(20, null, today); // vence el 20
    expect(result.status).toBe("upcoming");
    expect(result.dueDate).toEqual(new Date(2026, 2, 20));
  });

  it("marks it due-soon within the 7-day window", () => {
    const today = new Date(2026, 2, 15);
    const result = computeBillStatus(20, null, today);
    expect(result.status).toBe("due-soon");
  });

  it("marks it overdue once the due day has passed without payment", () => {
    const today = new Date(2026, 2, 25);
    const result = computeBillStatus(20, null, today);
    expect(result.status).toBe("overdue");
    expect(result.dueDate).toEqual(new Date(2026, 2, 20));
  });

  it("marks it paid when the last payment was this same month, and points to next month", () => {
    const today = new Date(2026, 2, 21);
    const lastPayment = new Date(2026, 2, 18);
    const result = computeBillStatus(20, lastPayment, today);
    expect(result.status).toBe("paid");
    expect(result.dueDate).toEqual(new Date(2026, 3, 20));
  });

  it("does not consider a payment from a previous month as already paid", () => {
    const today = new Date(2026, 3, 5);
    const lastPayment = new Date(2026, 2, 18);
    const result = computeBillStatus(20, lastPayment, today);
    expect(result.status).toBe("upcoming");
    expect(result.dueDate).toEqual(new Date(2026, 3, 20));
  });

  it("clamps dueDay=31 to the last real day of a shorter month (February)", () => {
    const today = new Date(2026, 1, 1); // 1 de febrero, 2026 no es bisiesto
    const result = computeBillStatus(31, null, today);
    expect(result.dueDate).toEqual(new Date(2026, 1, 28));
  });

  it("rolls over correctly from December to January", () => {
    const today = new Date(2026, 11, 10);
    const lastPayment = new Date(2026, 11, 5);
    const result = computeBillStatus(5, lastPayment, today);
    expect(result.status).toBe("paid");
    expect(result.dueDate).toEqual(new Date(2027, 0, 5));
  });

  it("never shows overdue before startsAt's month, even if dueDay already passed this month", () => {
    // Compraste hoy (25 de agosto), dueDay=5 ya pasó este mes, pero el primer
    // cobro real es hasta septiembre — no debe verse como vencido en agosto.
    const today = new Date(2026, 7, 25);
    const startsAt = new Date(2026, 8, 1);
    const result = computeBillStatus(5, null, today, startsAt);
    expect(result.status).toBe("upcoming");
    expect(result.dueDate).toEqual(new Date(2026, 8, 5));
  });

  it("behaves normally once today reaches startsAt's month", () => {
    const today = new Date(2026, 8, 10);
    const startsAt = new Date(2026, 8, 1);
    const result = computeBillStatus(5, null, today, startsAt);
    expect(result.status).toBe("overdue");
    expect(result.dueDate).toEqual(new Date(2026, 8, 5));
  });

  it("defaults startsAt to today when not provided (backwards compatible)", () => {
    const today = new Date(2026, 2, 25);
    const result = computeBillStatus(20, null, today);
    expect(result.status).toBe("overdue");
  });
});
