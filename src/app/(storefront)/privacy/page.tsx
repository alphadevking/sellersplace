import { storeConfig, whatsappLink } from "@/config/store";

const description = `How ${storeConfig.name} collects, uses, and protects your personal data under the NDPR/Nigeria Data Protection Act.`;

export const metadata = {
  title: "Privacy Policy",
  description,
  alternates: { canonical: "/privacy" },
  openGraph: { title: `Privacy Policy | ${storeConfig.name}`, description, url: "/privacy" },
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

export default function PrivacyPage() {
  const contact = whatsappLink("Hi, I have a privacy/data question");
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
      <div className="flex flex-col gap-1">
        <span className="eyebrow">Legal</span>
        <h1 className="section-title">Privacy Policy</h1>
        <p className="text-sm text-muted">
          Last updated {UPDATED} · Written for the Nigeria Data Protection Act
          2023 (NDPA) and NDPR
        </p>
      </div>

      <Section title="1. Who is responsible for your data">
        <p>
          {storeConfig.name} is the data controller for personal data collected
          through this store. This policy explains what we collect, why, how
          long we keep it, and the rights you have over it.
        </p>
      </Section>

      <Section title="2. What we collect">
        <p>We collect only what running your orders requires:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Account details</strong> — name, email, phone, and a
            securely hashed password (we cannot read your password).
          </li>
          <li>
            <strong>Order information</strong> — items purchased, delivery
            address, payment status, and order history.
          </li>
          <li>
            <strong>Payment</strong> — processed entirely by Paystack; we never
            see or store your card number, only the payment reference and
            amount.
          </li>
          <li>
            <strong>Support conversations</strong> — messages you send our
            support chat, kept so we can help you across visits.
          </li>
          <li>
            <strong>Usage signals</strong> — searches on the store and wishlist
            items, used to improve what we stock and show.
          </li>
          <li>
            <strong>Notifications</strong> — if you opt in to push
            notifications, a device subscription token (no location tracking).
          </li>
        </ul>
      </Section>

      <Section title="3. Why we use it (lawful basis)">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Contract</strong> — processing orders, payments, delivery,
            and refunds.
          </li>
          <li>
            <strong>Consent</strong> — account creation, push notifications,
            and marketing (if ever introduced); you can withdraw consent at any
            time.
          </li>
          <li>
            <strong>Legitimate interest</strong> — fraud prevention, support
            quality, and improving the catalog from search trends.
          </li>
        </ul>
      </Section>

      <Section title="4. Who we share it with">
        <p>
          We do not sell your personal data. It is shared only with the
          processors needed to serve you: Paystack (payments), our hosting and
          database providers, and delivery partners (name, phone, and address
          only, to deliver your order). Each processes your data under their
          own safeguards and our instructions.
        </p>
      </Section>

      <Section title="5. How long we keep it">
        <p>
          Order and payment records are kept as long as required for
          accounting and dispute resolution. Support conversations persist so
          returning customers keep their context. You may request deletion of
          your account and associated personal data at any time (see rights
          below); records we are legally required to retain are kept only as
          long as the law requires.
        </p>
      </Section>

      <Section title="6. Your rights under the NDPA/NDPR">
        <p>You have the right to:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>access a copy of the personal data we hold about you;</li>
          <li>correct inaccurate data;</li>
          <li>request deletion of your data (&ldquo;right to be forgotten&rdquo;);</li>
          <li>object to or restrict specific processing;</li>
          <li>withdraw consent previously given;</li>
          <li>
            lodge a complaint with the Nigeria Data Protection Commission
            (NDPC).
          </li>
        </ul>
        <p>
          To exercise any of these, contact us via support chat
          {contact ? (
            <>
              {" "}
              or{" "}
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
          . We respond within the timelines the NDPA requires.
        </p>
        <p>
          Erasure is not absolute: where we have an ongoing order with you, an
          unpaid balance, or a legal or accounting obligation to keep certain
          records, deletion of the affected data may be deferred until those are
          resolved, as the NDPA permits. In those cases we delete what we can and
          remove the rest once retention is no longer required.
        </p>
      </Section>

      <Section title="7. Security">
        <p>
          All traffic is encrypted in transit (HTTPS), passwords are hashed
          with bcrypt, payment card data never touches our servers, and access
          to customer data is limited to store staff who need it. No system is
          perfectly secure — if a breach ever affects your data, we will
          notify you and the NDPC as the law requires.
        </p>
      </Section>

      <Section title="8. Cookies and local storage">
        <p>
          We use only what the store needs to function: a session cookie to
          keep you signed in, and local storage for your cart and theme
          preference. No third-party advertising trackers.
        </p>
      </Section>

      <Section title="9. Children">
        <p>
          The store is not directed at children under 18; we do not knowingly
          collect their data.
        </p>
      </Section>

      <Section title="10. Changes">
        <p>
          If this policy changes materially, the date above is updated and
          significant changes are highlighted on the site. Continued use after
          a change means acceptance.
        </p>
      </Section>
    </div>
  );
}
