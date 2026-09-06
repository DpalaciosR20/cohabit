export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className = "",
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div className={`flex gap-1 rounded-control bg-rule/60 p-1 ${className}`}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`flex-1 rounded-[calc(var(--radius-control)-4px)] px-3 py-1.5 text-sm font-bold transition-[background-color,box-shadow] duration-200 ease-spring ${
            value === option.value
              ? "bg-surface text-ink shadow-card"
              : "text-ink-soft hover:text-ink"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
