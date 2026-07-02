import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AnalyticsScripts } from "@/components/analytics/AnalyticsScripts";
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
  alternates: {
    canonical: "/",
  },
  applicationName: "Garemo",
  authors: [{ name: "Garemo" }],
  creator: "Garemo",
  description:
    "Compra talento universitario. Descubre negocios, productos y servicios universitarios cerca de tu campus.",
  metadataBase: new URL("https://www.garemo.online"),
  openGraph: {
    description:
      "Directorio universitario para descubrir emprendimientos, productos y servicios cerca de tu campus.",
    images: [
      {
        alt: "Garemo - Compra talento universitario",
        height: 630,
        url: "/brand/garemo-logo-horizontal.png",
        width: 1200,
      },
    ],
    locale: "es_BO",
    siteName: "Garemo",
    title: "Garemo - Compra talento universitario",
    type: "website",
    url: "https://www.garemo.online",
  },
  publisher: "Garemo",
  title: {
    default: "Garemo - Compra talento universitario",
    template: "%s | Garemo",
  },
  twitter: {
    card: "summary_large_image",
    description:
      "Descubre negocios, productos y servicios universitarios cerca de tu campus.",
    images: ["/brand/garemo-logo-horizontal.png"],
    title: "Garemo - Compra talento universitario",
  },
  icons: {
    icon: [
      { url: "/brand/garemo-icon.png", type: "image/png" },
      { url: "/brand/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico" },
    ],
    apple: [{ url: "/brand/garemo-icon.png", type: "image/png" }],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  applicationCategory: "MarketplaceApplication",
  description:
    "Directorio universitario para descubrir emprendimientos, productos y servicios cerca del campus.",
  name: "Garemo",
  operatingSystem: "Web",
  url: "https://www.garemo.online",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <script
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
          type="application/ld+json"
        />
        {children}
        <AnalyticsScripts />
      </body>
    </html>
  );
}
