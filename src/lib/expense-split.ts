/**
 * Reparte un monto en partes iguales entre los miembros de un hogar, en centavos
 * enteros para evitar errores de redondeo de punto flotante. Si el monto no se
 * divide exacto, el residuo (1 centavo a la vez) se asigna primero a quien pagó.
 */
export function splitEvenly(
  amount: number,
  memberIds: string[],
  payerId: string
): { userId: string; shareAmount: number }[] {
  if (memberIds.length === 0) {
    throw new Error("No hay miembros entre quienes repartir el gasto");
  }

  const totalCents = Math.round(amount * 100);
  const n = memberIds.length;
  const baseCents = Math.floor(totalCents / n);
  let remainder = totalCents - baseCents * n;

  const ordered = [payerId, ...memberIds.filter((id) => id !== payerId)];

  return ordered.map((userId) => {
    const extraCent = remainder > 0 ? 1 : 0;
    if (remainder > 0) remainder -= 1;
    return { userId, shareAmount: (baseCents + extraCent) / 100 };
  });
}

export type MemberShare = { userId: string; percent: number };

/**
 * Reparte un monto según porcentajes configurados por miembro (ej. 70/30),
 * en vez de partes iguales. Usa el método de "mayor residuo": cada quien se
 * lleva el entero de centavos que le toca por su %, y los centavos sobrantes
 * (por redondeo) se asignan uno a uno a quienes tienen el mayor residuo
 * fraccionario — así la suma siempre cuadra exacto con el monto original,
 * sin importar qué tan "feos" sean los porcentajes. En empate de residuo,
 * el centavo extra va primero a quien pagó (mismo criterio que splitEvenly).
 */
export function splitByShares(
  amount: number,
  shares: MemberShare[],
  payerId: string
): { userId: string; shareAmount: number }[] {
  if (shares.length === 0) {
    throw new Error("No hay miembros entre quienes repartir el gasto");
  }

  const totalCents = Math.round(amount * 100);

  const entries = shares.map((s) => {
    const exactCents = (totalCents * s.percent) / 100;
    const cents = Math.floor(exactCents);
    return { userId: s.userId, cents, remainder: exactCents - cents };
  });

  const assignedCents = entries.reduce((sum, e) => sum + e.cents, 0);
  let centsLeftToDistribute = totalCents - assignedCents;

  const byRemainderDesc = [...entries].sort((a, b) => {
    if (b.remainder !== a.remainder) return b.remainder - a.remainder;
    if (a.userId === payerId) return -1;
    if (b.userId === payerId) return 1;
    return 0;
  });

  const centsByUserId = new Map(entries.map((e) => [e.userId, e.cents]));
  for (const entry of byRemainderDesc) {
    if (centsLeftToDistribute <= 0) break;
    centsByUserId.set(entry.userId, (centsByUserId.get(entry.userId) ?? 0) + 1);
    centsLeftToDistribute -= 1;
  }

  return shares.map((s) => ({
    userId: s.userId,
    shareAmount: (centsByUserId.get(s.userId) ?? 0) / 100,
  }));
}
