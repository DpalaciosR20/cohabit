import { redirect } from "next/navigation";

// Shell temporal: el tab "Finanzas" del bottom nav ya apunta aquí, pero la
// composición real (switcher Hogar/Personal + pills Gastos/Presupuestos/
// Pagos) se construye en la siguiente PR del roadmap de rediseño de
// navegación. Mientras tanto, redirige a la vista de Gastos existente para
// que el tab nunca lleve a una página rota.
export default function FinancePage() {
  redirect("/expenses");
}
