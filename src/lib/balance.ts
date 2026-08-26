type Member = { userId: string; name: string };
type ExpenseRow = { paidById: string; amount: number };
type SplitRow = { userId: string; shareAmount: number };

export type MemberBalance = {
  userId: string;
  name: string;
  /** positivo = le deben; negativo = debe */
  balance: number;
};

/**
 * Calcula el balance de cada miembro a partir de los gastos reales — nunca se
 * guarda un balance en la base de datos, siempre se deriva de Expense/ExpenseSplit,
 * para que sea imposible que quede desincronizado de la realidad.
 */
export function computeBalances(
  members: Member[],
  expenses: ExpenseRow[],
  splits: SplitRow[]
): MemberBalance[] {
  const totals = new Map(members.map((m) => [m.userId, 0]));

  for (const expense of expenses) {
    totals.set(expense.paidById, (totals.get(expense.paidById) ?? 0) + expense.amount);
  }
  for (const split of splits) {
    totals.set(split.userId, (totals.get(split.userId) ?? 0) - split.shareAmount);
  }

  return members.map((m) => ({
    userId: m.userId,
    name: m.name,
    balance: Math.round((totals.get(m.userId) ?? 0) * 100) / 100,
  }));
}
