import { EXPENSE_CATEGORIES } from "@/lib/expense-categories";

export function CategorySelect({
  value,
  onChange,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`rounded-control border border-rule bg-surface px-3 py-2.5 text-sm text-ink transition-[border-color,box-shadow] duration-150 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft ${className}`}
    >
      <option value="">Sin categoría</option>
      {EXPENSE_CATEGORIES.map((category) => (
        <option key={category} value={category}>
          {category}
        </option>
      ))}
    </select>
  );
}
