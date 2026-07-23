import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Bricolage_Grotesque } from "next/font/google";
import { storeConfig } from "@/config/store";
import CustomCursor from "@/components/CustomCursor";
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
  metadataBase: new URL(storeConfig.siteUrl),
  title: {
    default: `${storeConfig.name} — ${storeConfig.description}`,
    template: `%s | ${storeConfig.name}`,
  },
  description: storeConfig.description,
  applicationName: storeConfig.name,
  openGraph: {
    type: "website",
    siteName: storeConfig.name,
    title: storeConfig.name,
    description: storeConfig.description,
    url: "/",
    locale: "en_NG",
  },
  twitter: {
    card: "summary_large_image",
    title: storeConfig.name,
    description: storeConfig.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: { canonical: "/" },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: storeConfig.name,
  },
};

// Organization + WebSite structured data — site-wide identity for search
// engines (logo, name, sitelinks search box via the catalog search).
const identityJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${storeConfig.siteUrl}/#organization`,
      name: storeConfig.name,
      url: storeConfig.siteUrl,
      logo: storeConfig.logoUrl || `${storeConfig.siteUrl}/pwa-icon/512`,
      ...(storeConfig.phone ? { telephone: storeConfig.phone } : {}),
    },
    {
      "@type": "WebSite",
      "@id": `${storeConfig.siteUrl}/#website`,
      name: storeConfig.name,
      url: storeConfig.siteUrl,
      publisher: { "@id": `${storeConfig.siteUrl}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${storeConfig.siteUrl}/products?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
  ],
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(identityJsonLd) }}
        />
        {children}
        <RouteTransitionOverlay />
        <CustomCursor />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
