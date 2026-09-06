import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-accent text-accent-ink shadow-[0_1px_2px_rgba(20,23,28,0.06),0_10px_20px_-10px_rgba(61,79,224,0.55)] hover:opacity-90",
  secondary:
    "border border-rule bg-surface/80 text-ink backdrop-blur-sm hover:bg-accent-soft",
  ghost: "text-ink-soft hover:text-ink",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      className={`rounded-control px-4 py-2.5 text-sm font-bold transition-[opacity,transform] duration-150 ease-spring active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100 ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  );
}
