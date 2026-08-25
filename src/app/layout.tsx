import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { siteConfig } from "@/config/site";
import { AnalyticsProvider } from "@/components/analytics/analytics-provider";

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
  metadataBase: new URL("https://www.crealy.app"),
  title: {
    default: "Crealy | Diseña sin saber diseñar",
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  alternates: { canonical: "/" },
  icons: {
    icon: [
      {
        url: "/brand/crealy-favicon.webp",
        type: "image/webp",
        sizes: "200x200",
      },
    ],
    shortcut: "/brand/crealy-favicon.webp",
  },
  openGraph: {
    type: "website",
    locale: "es_PA",
    siteName: siteConfig.name,
    title: "Crealy | Diseña sin saber diseñar",
    description: siteConfig.description,
    url: "/",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Crealy: diseña miniaturas, posts y banners sin complicaciones",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Crealy | Diseña sin saber diseñar",
    description: siteConfig.description,
    images: ["/opengraph-image"],
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
    other: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION
      ? { "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION }
      : undefined,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#080808",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <a
          href="#main-content"
          className="fixed top-3 left-3 z-[100] -translate-y-20 rounded-lg bg-brand px-4 py-2 text-sm font-bold text-brand-ink focus:translate-y-0"
        >
          Saltar al contenido
        </a>
        <div id="main-content" tabIndex={-1} className="contents outline-none">
          {children}
        </div>
        <AnalyticsProvider />
      </body>
    </html>
  );
}
