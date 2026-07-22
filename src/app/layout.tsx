import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Bricolage_Grotesque } from "next/font/google";
import { storeConfig } from "@/config/store";
import RouteTransitionOverlay from "@/components/RouteTransitionOverlay";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Editorial display face — a modern variable grotesque with real character;
// Geist stays on body/UI so the two never compete. This is the single lever
// that makes headings feel distinctive.
const bricolage = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: storeConfig.name,
    template: `%s | ${storeConfig.name}`,
  },
  description: storeConfig.description,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: storeConfig.name,
  },
};

export const viewport: Viewport = {
  themeColor: storeConfig.primaryColor,
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${bricolage.variable} h-full antialiased`}
      style={{ "--brand": storeConfig.primaryColor } as React.CSSProperties}
    >
      <body className="min-h-full flex flex-col">
        {/* Apply the stored theme before paint so dark mode doesn't flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              'try{var t=localStorage.getItem("sellersplace:theme");if(t==="dark")document.documentElement.setAttribute("data-theme","dark")}catch(e){}',
          }}
        />
        {children}
        <RouteTransitionOverlay />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
