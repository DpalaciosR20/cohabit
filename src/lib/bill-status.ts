export type BillStatus = "paid" | "overdue" | "due-soon" | "upcoming";

export type BillStatusResult = {
  dueDate: Date;
  status: BillStatus;
};

const DUE_SOON_WINDOW_DAYS = 7;

/** Último día válido de un mes (ej. dueDay=31 en febrero → 28 o 29). */
function clampToMonth(year: number, month: number, day: number): Date {
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
  return new Date(year, month, Math.min(day, lastDayOfMonth));
}

function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function daysBetween(a: Date, b: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((b.getTime() - a.getTime()) / msPerDay);
}

/**
 * Calcula la próxima fecha de vencimiento de un Bill y su estado, a partir del
 * día del mes en que vence y (si existe) la fecha del último pago registrado.
 * No se guarda una "próxima fecha" en la base de datos — siempre se deriva,
 * igual que el balance, para que nunca pueda desincronizarse.
 */
export function computeBillStatus(
  dueDay: number,
  lastPaymentDate: Date | null,
  today: Date
): BillStatusResult {
  const dueDateThisPeriod = clampToMonth(today.getFullYear(), today.getMonth(), dueDay);
  const paidThisPeriod = lastPaymentDate !== null && isSameMonth(lastPaymentDate, today);

  if (paidThisPeriod) {
    const nextMonth = today.getMonth() + 1;
    const dueDateNextPeriod = clampToMonth(
      today.getFullYear() + Math.floor(nextMonth / 12),
      nextMonth % 12,
      dueDay
    );
    return { dueDate: dueDateNextPeriod, status: "paid" };
  }

  const daysUntilDue = daysBetween(today, dueDateThisPeriod);
  if (daysUntilDue < 0) {
    return { dueDate: dueDateThisPeriod, status: "overdue" };
  }
  if (daysUntilDue <= DUE_SOON_WINDOW_DAYS) {
    return { dueDate: dueDateThisPeriod, status: "due-soon" };
  }
  return { dueDate: dueDateThisPeriod, status: "upcoming" };
}
