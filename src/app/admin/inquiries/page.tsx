import Link from "next/link";
import { InquiryStatus, Prisma } from "@prisma/client";
import { MessageCircle, Phone, Mail } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { setInquiryStatus } from "@/app/actions/admin";

export const metadata = { title: "Inquiries" };

const FILTERS = ["ALL", ...Object.values(InquiryStatus)] as const;

const CHANNEL_META = {
  WHATSAPP: { label: "WhatsApp", icon: MessageCircle },
  PHONE: { label: "Call", icon: Phone },
  FORM: { label: "Form", icon: Mail },
} as const;

const STATUS_STYLE: Record<InquiryStatus, { bg: string; fg: string }> = {
  NEW: { bg: "#fef3c7", fg: "#92400e" },
  RESPONDED: { bg: "#dbeafe", fg: "#1e40af" },
  CLOSED: { bg: "#f3f4f6", fg: "#4b5563" },
};

export default async function AdminInquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const activeFilter =
    status && Object.values(InquiryStatus).includes(status as InquiryStatus)
      ? (status as InquiryStatus)
      : "ALL";

  const where: Prisma.InquiryWhereInput =
    activeFilter === "ALL" ? {} : { status: activeFilter };

  const inquiries = await prisma.inquiry.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { product: true, user: true },
    take: 100,
  });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold">Inquiries</h1>
        <p className="text-sm text-muted">
          Chat clicks and inquiry-form leads from contact-mode offerings.
        </p>
      </div>

      <div className="scrollbar-none -mx-4 flex gap-1.5 overflow-x-auto px-4">
        {FILTERS.map((filter) => {
          const active = filter === activeFilter;
          return (
            <Link
              key={filter}
              href={filter === "ALL" ? "/admin/inquiries" : `/admin/inquiries?status=${filter}`}
              className="shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition-colors"
              style={
                active
                  ? {
                      background: "var(--brand)",
                      borderColor: "var(--brand)",
                      color: "var(--brand-foreground)",
                    }
                  : { borderColor: "var(--border)", color: "var(--muted)" }
              }
            >
              {filter === "ALL" ? "All" : filter.toLowerCase()}
            </Link>
          );
        })}
      </div>

      {inquiries.length === 0 ? (
        <p className="card-surface p-4 text-sm text-muted">
          No {activeFilter !== "ALL" ? `${activeFilter.toLowerCase()} ` : ""}inquiries yet.
          They appear when customers tap “Chat with seller” or send an inquiry form.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {inquiries.map((inquiry) => {
            const channel = CHANNEL_META[inquiry.channel];
            const ChannelIcon = channel.icon;
            const style = STATUS_STYLE[inquiry.status];
            return (
              <div key={inquiry.id} className="card flex flex-col gap-3 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm">
                    <ChannelIcon className="h-4 w-4" style={{ color: "var(--brand)" }} />
                    <span className="font-medium">
                      {inquiry.product ? (
                        <Link
                          href={`/products/${inquiry.product.slug}`}
                          className="hover:underline"
                        >
                          {inquiry.product.name}
                        </Link>
                      ) : (
                        "General"
                      )}
                      {inquiry.variantName && (
                        <span className="font-normal text-muted"> · {inquiry.variantName}</span>
                      )}
                    </span>
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase"
                      style={{ background: style.bg, color: style.fg }}
                    >
                      {inquiry.status.toLowerCase()}
                    </span>
                  </div>
                  <span className="text-xs text-muted">
                    {inquiry.createdAt.toLocaleString("en-NG", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}{" "}
                    · via {channel.label}
                  </span>
                </div>

                {(inquiry.name || inquiry.contact || inquiry.user) && (
                  <div className="flex flex-col gap-0.5 text-sm">
                    <span>
                      {inquiry.name || inquiry.user?.name || "—"}
                      {inquiry.user && (
                        <span className="text-muted"> ({inquiry.user.email})</span>
                      )}
                    </span>
                    {inquiry.contact && <span className="text-muted">{inquiry.contact}</span>}
                  </div>
                )}

                {inquiry.message && (
                  <p className="card-surface p-3 text-sm text-foreground/80">
                    {inquiry.message}
                  </p>
                )}

                <form action={setInquiryStatus} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={inquiry.id} />
                  <select
                    name="status"
                    defaultValue={inquiry.status}
                    className="input-field w-auto py-1.5 text-xs"
                  >
                    {Object.values(InquiryStatus).map((s) => (
                      <option key={s} value={s}>
                        {s.charAt(0) + s.slice(1).toLowerCase()}
                      </option>
                    ))}
                  </select>
                  <button type="submit" className="btn-ghost px-3 py-1.5 text-xs">
                    Update
                  </button>
                </form>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
