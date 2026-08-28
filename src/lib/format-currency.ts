const formatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

/** "$1,989.09" — separador de miles y dos decimales, consistente en toda la app. */
export function formatCurrency(amount: number | string): string {
  return formatter.format(Number(amount) || 0);
}
