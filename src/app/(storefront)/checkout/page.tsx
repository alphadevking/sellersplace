import { auth } from "@/lib/auth";
import CheckoutForm from "@/components/storefront/CheckoutForm";

export default async function CheckoutPage() {
  const session = await auth();

  return (
    <CheckoutForm
      defaultEmail={session?.user?.email || ""}
      defaultName={session?.user?.name || ""}
      loggedIn={!!session?.user}
    />
  );
}
