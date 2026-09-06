"use client";

import { useRef, useState, type PointerEvent, type ReactNode } from "react";

const ACTION_WIDTH = 84;

/**
 * Reemplaza el patrón `confirm()` nativo del navegador: desliza la fila hacia
 * la izquierda para revelar un botón "Eliminar" (rojo) detrás, en vez de un
 * diálogo del sistema. El gesto de deslizar de forma intencional ya es
 * suficiente fricción — no hace falta una segunda confirmación.
 */
export function SwipeableRow({
  children,
  onDelete,
  deleteLabel = "Eliminar",
  className = "",
  contentClassName = "px-4 py-3.5",
}: {
  children: ReactNode;
  onDelete: () => void;
  deleteLabel?: string;
  className?: string;
  contentClassName?: string;
}) {
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const startOffset = useRef(0);

  function handlePointerDown(e: PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    startX.current = e.clientX;
    startOffset.current = offset;
    setIsDragging(true);
  }

  function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!isDragging) return;
    const delta = startX.current - e.clientX;
    const next = Math.min(Math.max(startOffset.current + delta, 0), ACTION_WIDTH);
    setOffset(next);
  }

  function endDrag() {
    setIsDragging(false);
    setOffset((current) => (current > ACTION_WIDTH / 2 ? ACTION_WIDTH : 0));
  }

  return (
    <li className={`relative overflow-hidden ${className}`}>
      <button
        type="button"
        onClick={() => {
          onDelete();
          setOffset(0);
        }}
        style={{ width: ACTION_WIDTH }}
        className="absolute inset-y-0 right-0 flex items-center justify-center bg-negative text-xs font-bold text-white"
      >
        {deleteLabel}
      </button>
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        style={{
          transform: `translateX(-${offset}px)`,
          transition: isDragging ? "none" : "transform 200ms ease-out",
          touchAction: "pan-y",
        }}
        className={`relative bg-surface ${contentClassName}`}
      >
        {children}
      </div>
    </li>
  );
}
