"use client";

import { useEffect, useRef } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

/**
 * Se suscribe a cambios de Postgres en una tabla (filtrados, ej. "householdId=eq.X")
 * y llama a onChange cuando algo cambia — para volver a pedir los datos frescos.
 *
 * onChange se guarda en un ref en vez de ir en las dependencias del efecto: así
 * evitamos reabrir la suscripción en cada render solo porque la función se
 * volvió a crear (el filtro es lo único que realmente debe reabrir el canal).
 */
export function useRealtimeRefetch(
  table: string,
  filter: string | null,
  onChange: () => void
) {
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    if (!filter) return;

    const channel = supabaseBrowser
      .channel(`${table}:${filter}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table, filter },
        () => onChangeRef.current()
      )
      .subscribe();

    return () => {
      supabaseBrowser.removeChannel(channel);
    };
  }, [table, filter]);
}
