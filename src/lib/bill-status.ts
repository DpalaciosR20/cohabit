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

/** Compara meses calendario, sin importar el día — para saber si `a` es anterior a `b`. */
function isBeforeMonth(a: Date, b: Date): boolean {
  const aKey = a.getFullYear() * 12 + a.getMonth();
  const bKey = b.getFullYear() * 12 + b.getMonth();
  return aKey < bKey;
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
 *
 * `startsAt` es el primer mes en que el Bill genera vencimientos — antes de
 * ese mes, nunca se marca "vencido" ni "vence pronto", sin importar qué tan
 * cerca esté el dueDay (ej. compraste algo hoy pero tu primer pago es hasta
 * el próximo mes).
 */
export function computeBillStatus(
  dueDay: number,
  lastPaymentDate: Date | null,
  today: Date,
  startsAt: Date = today
): BillStatusResult {
  if (isBeforeMonth(today, startsAt)) {
    return {
      dueDate: clampToMonth(startsAt.getFullYear(), startsAt.getMonth(), dueDay),
      status: "upcoming",
    };
  }

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
