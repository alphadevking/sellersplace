import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
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
