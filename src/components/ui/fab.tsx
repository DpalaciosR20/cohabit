export function Fab({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="fixed z-40 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-ink shadow-[0_1px_2px_rgba(20,23,28,0.06),0_12px_24px_-10px_rgba(61,79,224,0.6)] transition-transform duration-150 ease-spring active:scale-[0.94]"
      style={{
        right: "20px",
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 78px)",
      }}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14M5 12h14" />
      </svg>
    </button>
  );
}
