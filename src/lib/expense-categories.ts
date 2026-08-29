// Set curado de categorías, igual que los colores de perfil (issue #44) —
// no un selector libre, para que la categorización se mantenga consistente
// y comparable entre hogares en vez de que cada quien invente sus propios
// nombres. Se puede ampliar a categorías personalizadas por hogar más
// adelante si hace falta.
export const EXPENSE_CATEGORIES = [
  "Comida",
  "Servicios",
  "Transporte",
  "Entretenimiento",
  "Salud",
  "Hogar",
  "Mascotas",
  "Otros",
] as const;

export type ExpenseCategoryName = (typeof EXPENSE_CATEGORIES)[number];

export function isExpenseCategoryName(value: string): value is ExpenseCategoryName {
  return (EXPENSE_CATEGORIES as readonly string[]).includes(value);
}
