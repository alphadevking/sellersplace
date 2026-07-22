import { ShieldCheck, Truck, RotateCcw } from "lucide-react";

const ITEMS = [
  { icon: ShieldCheck, label: "Secure checkout" },
  { icon: Truck, label: "Fast delivery" },
  { icon: RotateCcw, label: "Easy returns" },
];

export default function TrustBar() {
  return (
    <div
      className="grid grid-cols-3 divide-x rounded-2xl border bg-surface [&>*]:border-[var(--border)]"
      style={{ borderColor: "var(--border)" }}
    >
      {ITEMS.map(({ icon: Icon, label }) => (
        <div
          key={label}
          className="flex items-center justify-center gap-2 px-2 py-3.5 text-center"
        >
          <Icon className="h-4 w-4 shrink-0" style={{ color: "var(--brand)" }} />
          <span className="text-[11px] font-medium leading-tight text-foreground/80 sm:text-xs">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
