// The cart page is a client component, so its noindex metadata lives here.
export const metadata = { title: "Cart", robots: { index: false, follow: false } };

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
