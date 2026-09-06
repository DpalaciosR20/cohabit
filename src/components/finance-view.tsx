"use client";

import { useState } from "react";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { ExpensesView } from "@/components/expenses-view";
import { BalanceView } from "@/components/balance-view";
import { BillsView } from "@/components/bills-view";
import { PersonalExpensesView } from "@/components/personal-expenses-view";
import { PersonalBillsView } from "@/components/personal-bills-view";

type Context = "hogar" | "personal";
type Tab = "gastos" | "pagos" | "balance";

export function FinanceView({
  householdName,
  householdId,
  currentUserId,
  monthlyIncome,
}: {
  householdName: string;
  householdId: string;
  currentUserId: string;
  monthlyIncome: number | null;
}) {
  const [context, setContext] = useState<Context>("hogar");
  const [tab, setTab] = useState<Tab>("gastos");

  function handleContextChange(next: Context) {
    setContext(next);
    // "Balance" solo existe en el contexto Hogar (compara a los miembros del
    // hogar entre sí) — no hay un equivalente con sentido en Personal.
    if (next === "personal" && tab === "balance") {
      setTab("gastos");
    }
  }

  const tabOptions =
    context === "hogar"
      ? [
          { value: "gastos" as const, label: "Gastos" },
          { value: "pagos" as const, label: "Pagos" },
          { value: "balance" as const, label: "Balance" },
        ]
      : [
          { value: "gastos" as const, label: "Gastos" },
          { value: "pagos" as const, label: "Pagos" },
        ];

  return (
    <>
      <div className="mx-auto flex max-w-md flex-col gap-3 px-5 pt-5">
        <SegmentedControl
          options={[
            { value: "hogar" as const, label: "Hogar" },
            { value: "personal" as const, label: "Personal" },
          ]}
          value={context}
          onChange={handleContextChange}
        />
        <SegmentedControl options={tabOptions} value={tab} onChange={setTab} />
      </div>

      {context === "hogar" && tab === "gastos" && (
        <ExpensesView householdName={householdName} householdId={householdId} />
      )}
      {context === "hogar" && tab === "pagos" && (
        <BillsView householdName={householdName} householdId={householdId} />
      )}
      {context === "hogar" && tab === "balance" && (
        <BalanceView
          householdName={householdName}
          householdId={householdId}
          currentUserId={currentUserId}
        />
      )}
      {context === "personal" && tab === "gastos" && (
        <PersonalExpensesView monthlyIncome={monthlyIncome} />
      )}
      {context === "personal" && tab === "pagos" && <PersonalBillsView />}
    </>
  );
}
