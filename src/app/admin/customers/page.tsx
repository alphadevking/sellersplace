import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/currency";

export const metadata = { title: "Customers" };

export default async function AdminCustomersPage() {
  const customers = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      _count: { select: { orders: true } },
      orders: { where: { paymentStatus: "PAID" }, select: { total: true } },
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold">Customers</h1>

      {customers.length === 0 ? (
        <p className="card-surface p-4 text-sm text-muted">No customers yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {customers.map((customer) => {
            const spent = customer.orders.reduce(
              (sum, order) => sum + Number(order.total),
              0
            );
            return (
              <div
                key={customer.id}
                className="card flex items-center justify-between gap-3 p-4"
              >
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <span className="truncate">{customer.name || customer.email}</span>
                    {customer.isGuest && (
                      <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-normal text-gray-600">
                        Guest
                      </span>
                    )}
                  </span>
                  <span className="truncate text-xs text-muted">
                    {customer.email}
                    {customer.phone ? ` · ${customer.phone}` : ""}
                  </span>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-0.5">
                  <span className="text-sm font-semibold">{formatCurrency(spent)}</span>
                  <span className="text-xs text-muted">
                    {customer._count.orders} order{customer._count.orders !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
