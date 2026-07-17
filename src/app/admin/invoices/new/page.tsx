import InvoiceForm from "@/components/admin/InvoiceForm";

export const metadata = { title: "New invoice" };

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ inquiryId?: string; email?: string; name?: string; note?: string }>;
}) {
  const { inquiryId, email, name, note } = await searchParams;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold">New invoice</h1>
        <p className="text-sm text-muted">
          For quoted or bespoke work — the customer gets a private pay link, no account
          needed.
        </p>
      </div>
      <InvoiceForm
        inquiryId={inquiryId}
        defaultEmail={email}
        defaultName={name}
        defaultNote={note}
      />
    </div>
  );
}
