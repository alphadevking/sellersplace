import { storeConfig, whatsappLink } from "@/config/store";

const description = `The terms that govern shopping, payments, delivery, and accounts on ${storeConfig.name}.`;

export const metadata = {
  title: "Terms of Service",
  description,
  alternates: { canonical: "/terms" },
  openGraph: { title: `Terms of Service | ${storeConfig.name}`, description, url: "/terms" },
};

const UPDATED = "23 July 2026";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      <div className="flex flex-col gap-2 text-sm leading-relaxed text-foreground/80">
        {children}
      </div>
    </section>
  );
}

export default function TermsPage() {
  const contact = whatsappLink("Hi, I have a question about your terms");
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
      <div className="flex flex-col gap-1">
        <span className="eyebrow">Legal</span>
        <h1 className="section-title">Terms of Service</h1>
        <p className="text-sm text-muted">Last updated {UPDATED}</p>
      </div>

      <Section title="1. Who we are">
        <p>
          These terms govern your use of {storeConfig.name} (&ldquo;the
          store&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;), including browsing,
          creating an account, placing orders, booking services, and contacting
          support. By using the store you agree to these terms and to our
          Privacy Policy.
        </p>
      </Section>

      <Section title="2. Accounts and guest checkout">
        <p>
          You can shop as a guest or create an account. You are responsible for
          keeping your password confidential and for activity under your
          account. Guest checkouts create a limited profile from your email so
          your order can be tracked; signing up later with the same email
          attaches that history to your account.
        </p>
      </Section>

      <Section title="3. Products, services, and pricing">
        <p>
          Prices are shown in {storeConfig.currency} and may change without
          notice; the price at the time you place an order is the price you
          pay. Some items are quoted individually or arranged directly with us
          — for those, the agreed quote or invoice is the binding price.
          Product images are illustrative; minor variations can occur.
        </p>
      </Section>

      <Section title="4. Orders and payment">
        <p>
          Payments are processed by Paystack (cards, bank transfer, USSD). We
          never see or store your card details. An order is confirmed when
          payment (or an agreed deposit) is received. Where a deposit is taken,
          the balance is payable before or on delivery/completion as agreed.
          Invoices for quoted work are payable through the private link we
          share with you.
        </p>
      </Section>

      <Section title="5. Delivery">
        <p>
          Delivery fees and estimated delivery windows are shown at checkout
          and on your order page. Estimates are made in good faith but are not
          guaranteed; we will keep you updated as your order progresses. Risk
          in the goods passes to you on delivery. Please confirm receipt on
          your order page when your order arrives.
        </p>
      </Section>

      <Section title="6. Cancellations, returns, and refunds">
        <p>
          You may cancel an order from your order page any time before it is
          dispatched; payments already made are refunded. After dispatch,
          contact support — items that are faulty, damaged in transit, or not
          as described are eligible for return or replacement. Refunds are
          returned via the original payment method. Personalized or perishable
          items and completed services may not be returnable unless faulty.
        </p>
      </Section>

      <Section title="7. Service bookings">
        <p>
          Preferred dates submitted at checkout are requests; we confirm the
          final schedule with you directly. Deposits on bespoke or booked work
          may be non-refundable once work has commenced, as communicated at
          the time of booking.
        </p>
      </Section>

      <Section title="8. Acceptable use">
        <p>
          Do not misuse the store: no fraudulent orders, abusive messages to
          support, attempts to breach security, scraping, or reselling access.
          We may suspend accounts or refuse orders that violate these terms.
        </p>
      </Section>

      <Section title="9. Liability">
        <p>
          Nothing in these terms excludes liability that cannot be excluded
          under Nigerian law. Otherwise, our total liability for any claim
          arising from an order is limited to the amount you paid for that
          order. We are not liable for indirect losses, or for delays caused
          by events outside our reasonable control.
        </p>
      </Section>

      <Section title="10. Changes and governing law">
        <p>
          We may update these terms; the &ldquo;last updated&rdquo; date above
          reflects the current version, and continued use after a change means
          acceptance. These terms are governed by the laws of the Federal
          Republic of Nigeria.
        </p>
      </Section>

      <Section title="11. Contact">
        <p>
          Questions about these terms? Reach us via the in-app support chat
          {contact ? (
            <>
              {" "}
              or on{" "}
              <a
                href={contact}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline"
              >
                WhatsApp
              </a>
            </>
          ) : null}
          {storeConfig.phone ? <> or by phone at {storeConfig.phone}</> : null}.
        </p>
      </Section>
    </div>
  );
}
