import type { OrderStatus, PaymentStatus } from "@prisma/client";

const ORDER_STYLES: Record<OrderStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  CONFIRMED: "bg-blue-50 text-blue-700",
  PROCESSING: "bg-violet-50 text-violet-700",
  SHIPPED: "bg-sky-50 text-sky-700",
  DELIVERED: "bg-green-50 text-green-700",
  CANCELLED: "bg-red-50 text-red-700",
};

const PAYMENT_STYLES: Record<PaymentStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  PAID: "bg-green-50 text-green-700",
  FAILED: "bg-red-50 text-red-700",
  REFUNDED: "bg-gray-100 text-gray-600",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${ORDER_STYLES[status]}`}>
      {status.toLowerCase()}
    </span>
  );
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${PAYMENT_STYLES[status]}`}>
      {status.toLowerCase()}
    </span>
  );
}
