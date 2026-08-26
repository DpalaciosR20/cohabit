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
