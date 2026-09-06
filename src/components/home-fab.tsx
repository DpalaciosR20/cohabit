"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Fab } from "@/components/ui/fab";
import { AddExpenseSheet } from "@/components/add-expense-sheet";

// Acceso rápido a "agregar gasto" desde Inicio, sin tener que entrar al tab
// Finanzas primero — la acción más frecuente de la app a un tap de distancia.
export function HomeFab() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Fab onClick={() => setIsOpen(true)} label="Agregar gasto" />
      {isOpen && (
        <AddExpenseSheet
          onClose={() => setIsOpen(false)}
          onAdded={() => router.refresh()}
        />
      )}
    </>
  );
}
