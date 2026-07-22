/**
 * Small numbered badge for the header counters (Favorite / Cart). Brand-filled
 * with the count; renders nothing at zero (the standard e-commerce pattern —
 * the badge only appears when there's something to count).
 */
export default function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span
      className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[11px] font-semibold leading-none tabular-nums"
      style={{ background: "var(--brand)", color: "var(--brand-foreground)" }}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
