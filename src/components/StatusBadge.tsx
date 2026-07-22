import type { OrderStatus, PaymentStatus } from "@prisma/client";

/**
 * Each status maps to a base hue; the pill's fill and text are derived from it
 * with color-mix against the current theme surface/foreground, so badges stay
 * legible in both light and dark mode (the old bg-*-50/text-*-700 pairs only
 * worked on a white canvas).
 */
const ORDER_HUES: Record<OrderStatus, string> = {
  PENDING: "#d97706",
  CONFIRMED: "#2563eb",
  PROCESSING: "#7c3aed",
  SHIPPED: "#0284c7",
  DELIVERED: "#16a34a",
  CANCELLED: "#dc2626",
};

const PAYMENT_HUES: Record<PaymentStatus, string> = {
  PENDING: "#d97706",
  PARTIALLY_PAID: "#0d9488",
  PAID: "#16a34a",
  FAILED: "#dc2626",
  REFUNDED: "var(--muted)",
};

function badgeStyle(hue: string): React.CSSProperties {
  return {
    background: `color-mix(in srgb, ${hue} 14%, var(--background))`,
    color: `color-mix(in srgb, ${hue} 70%, var(--foreground))`,
  };
}

function Badge({ hue, label }: { hue: string; label: string }) {
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[11px] font-medium capitalize"
      style={badgeStyle(hue)}
    >
      {label}
    </span>
  );
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge hue={ORDER_HUES[status]} label={status.toLowerCase()} />;
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <Badge hue={PAYMENT_HUES[status]} label={status.toLowerCase().replace("_", " ")} />
  );
}
