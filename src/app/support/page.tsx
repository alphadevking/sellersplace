import { auth } from "@/lib/auth";
import ChatConversation from "@/components/storefront/ChatConversation";

export const metadata = { title: "Support", robots: { index: false, follow: false } };

/**
 * Full-screen support chat. The layout supplies the header and viewport-fit
 * column; the conversation (card list + pinned composer) fills the rest.
 */
export default async function SupportPage() {
  const session = await auth();
  return <ChatConversation signedIn={!!session?.user} variant="page" />;
}
