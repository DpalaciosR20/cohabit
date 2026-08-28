"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { formatCurrency } from "@/lib/format-currency";

// Cubre holgadamente el máximo de $1,000,000 que validan los schemas de
// gasto/bill/settlement (9 dígitos = $1,000,000.00 en centavos).
const MAX_DIGITS = 9;

function digitsFromValue(value: string): string {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount) || amount <= 0) return "";
  return Math.round(amount * 100).toString();
}

function amountFromDigits(digits: string): number {
  return digits === "" ? 0 : Number(digits) / 100;
}

/**
 * Input de monto estilo cajero/POS: el usuario solo teclea dígitos, que se
 * van agregando de derecha a izquierda (los centavos primero) — sin punto
 * decimal manual. El signo $ y la separación por comas se aplican solo. El
 * valor expuesto vía onChange es siempre un string decimal ("1989.09"),
 * listo para Number(value) igual que un input numérico tradicional.
 *
 * El texto mostrado ("$0.01") no tiene relación 1:1 con los dígitos que el
 * usuario ha tecleado — siempre incluye ceros de relleno (el "0" de los
 * pesos, el primer "0" de los centavos). Diffear el número de dígitos del
 * texto formateado contra `digits.length` (como hacía una versión anterior)
 * compara cosas que no corresponden y pierde/duplica dígitos. En vez de eso,
 * leemos directamente del InputEvent nativo qué se insertó o borró
 * (`inputType`/`data`), que el navegador ya nos da sin ambigüedad.
 *
 * Además del useState que impulsa el render, se guarda un ref espejo: React
 * puede agrupar varios onChange del mismo tick (ej. al escribir rápido), y
 * si el segundo evento partiera del `digits` capturado en el closure del
 * render anterior — antes de que el primer setState se reflejara — perdería
 * un dígito. El ref nunca se lee durante el render, solo `digits` (el
 * estado).
 */
export function MoneyInput({
  value,
  onChange,
  className = "",
  id,
  name,
  autoFocus,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  id?: string;
  name?: string;
  autoFocus?: boolean;
}) {
  const [digits, setDigits] = useState(() => digitsFromValue(value));
  const digitsRef = useRef(digits);

  useEffect(() => {
    // Si el valor externo cambia por algo que no fue esta misma edición (ej.
    // el formulario se limpia tras guardar, o se precarga para editar), nos
    // sincronizamos — pero sin pisar lo que el usuario está tecleando ahora.
    const currentAmount = amountFromDigits(digitsRef.current);
    const externalAmount = Number(value || 0);
    if (currentAmount.toFixed(2) !== externalAmount.toFixed(2)) {
      const next = digitsFromValue(value);
      digitsRef.current = next;
      setDigits(next);
    }
  }, [value]);

  function commit(nextDigits: string) {
    const trimmed = nextDigits.slice(-MAX_DIGITS);
    digitsRef.current = trimmed;
    setDigits(trimmed);
    onChange(amountFromDigits(trimmed).toFixed(2));
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const native = e.nativeEvent as InputEvent;
    const inputType = native.inputType ?? "";
    const current = digitsRef.current;

    if (inputType.startsWith("delete")) {
      commit(current.slice(0, -1));
      return;
    }

    const inserted = (native.data ?? "").replace(/\D/g, "");
    if (inserted) {
      commit(current + inserted);
    }
  }

  return (
    <input
      id={id}
      name={name}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      value={formatCurrency(amountFromDigits(digits))}
      onChange={handleChange}
      autoFocus={autoFocus}
      className={`rounded-xl border border-rule bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-ink-soft focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft ${className}`}
    />
  );
}
