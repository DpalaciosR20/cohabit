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
 * Además del useState que impulsa el render, se guarda un ref espejo con el
 * mismo valor: React puede agrupar varios onChange del mismo tick (ej. al
 * escribir rápido), y si el segundo evento calculara el diff contra el
 * `digits` capturado en el closure del render anterior — antes de que el
 * primer setState se refleje — perdería un dígito. Leer/escribir el ref
 * dentro del handler evita esa condición de carrera; el ref nunca se lee
 * durante el render, solo `digits` (el estado).
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
    digitsRef.current = nextDigits;
    setDigits(nextDigits);
    onChange(amountFromDigits(nextDigits).toFixed(2));
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const current = digitsRef.current;
    const rawDigits = e.target.value.replace(/\D/g, "");
    if (rawDigits.length <= current.length) {
      // El usuario borró algo (un dígito o un símbolo formateado) — como el
      // valor mostrado se deriva por completo de `digits`, "borrar" siempre
      // significa quitar el último dígito, sin importar qué carácter visual
      // haya intentado borrar.
      commit(current.slice(0, -1));
    } else {
      const added = rawDigits.slice(current.length);
      commit((current + added).slice(-MAX_DIGITS));
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
