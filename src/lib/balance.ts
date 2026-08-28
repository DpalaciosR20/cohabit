type Member = { userId: string; name: string };
type ExpenseRow = { paidById: string; amount: number };
type SplitRow = { userId: string; shareAmount: number };
type SettlementRow = { fromUserId: string; toUserId: string; amount: number };

export type MemberBalance = {
  userId: string;
  name: string;
  /** positivo = le deben; negativo = debe */
  balance: number;
};

/**
 * Calcula el balance de cada miembro a partir de los gastos reales y los pagos
 * que saldan deuda — nunca se guarda un balance en la base de datos, siempre
 * se deriva de Expense/ExpenseSplit/Settlement, para que sea imposible que
 * quede desincronizado de la realidad.
 */
export function computeBalances(
  members: Member[],
  expenses: ExpenseRow[],
  splits: SplitRow[],
  settlements: SettlementRow[] = []
): MemberBalance[] {
  const totals = new Map(members.map((m) => [m.userId, 0]));

  for (const expense of expenses) {
    totals.set(expense.paidById, (totals.get(expense.paidById) ?? 0) + expense.amount);
  }
  for (const split of splits) {
    totals.set(split.userId, (totals.get(split.userId) ?? 0) - split.shareAmount);
  }
  // Un settlement es "fromUser le pagó a toUser fuera de la app": reduce lo
  // que fromUser debe (o aumenta lo que le deben) y reduce lo que le deben a
  // toUser (o aumenta lo que debe), en la misma dirección que saldar deuda real.
  for (const settlement of settlements) {
    totals.set(
      settlement.fromUserId,
      (totals.get(settlement.fromUserId) ?? 0) + settlement.amount
    );
    totals.set(settlement.toUserId, (totals.get(settlement.toUserId) ?? 0) - settlement.amount);
  }

  return members.map((m) => ({
    userId: m.userId,
    name: m.name,
    balance: Math.round((totals.get(m.userId) ?? 0) * 100) / 100,
  }));
}
