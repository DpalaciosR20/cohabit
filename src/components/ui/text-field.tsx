import type { InputHTMLAttributes } from "react";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export function TextField({ label, className = "", id, ...props }: TextFieldProps) {
  const input = (
    <input
      id={id}
      className={`rounded-xl border border-rule bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-ink-soft focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft ${className}`}
      {...props}
    />
  );

  if (!label) return input;

  return (
    <label htmlFor={id} className="flex flex-col gap-1.5 text-sm font-semibold text-ink-soft">
      {label}
      {input}
    </label>
  );
}
