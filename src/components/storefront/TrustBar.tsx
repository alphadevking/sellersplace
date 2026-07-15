import { ShieldCheck, Truck, RotateCcw } from "lucide-react";

const ITEMS = [
  { icon: ShieldCheck, label: "Secure checkout" },
  { icon: Truck, label: "Fast delivery" },
  { icon: RotateCcw, label: "Easy returns" },
];

export default function TrustBar() {
  return (
    <div className="grid grid-cols-3 gap-2">
      {ITEMS.map(({ icon: Icon, label }) => (
        <div
          key={label}
          className="flex flex-col items-center gap-1.5 rounded-xl py-3 text-center"
          style={{ background: "var(--brand-soft)" }}
        >
          <Icon className="h-4 w-4" style={{ color: "var(--brand)" }} />
          <span className="text-[11px] leading-tight text-foreground/80">{label}</span>
        </div>
      ))}
    </div>
  );
}
