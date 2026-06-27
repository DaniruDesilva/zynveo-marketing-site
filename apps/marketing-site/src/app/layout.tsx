import React from "react";
import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Analytics } from "@/components/analytics/Analytics";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://synctrahq.com"),
  title: {
    default: "Synctra | Million-Dollar Invoicing, ERP & Viral Pricing Calculator",
    template: "%s | Synctra",
  },
  description:
    "Synctra is the modern cloud-native ERP and SaaS operating system for FMCG brands, wholesalers, and SMEs. Calculate true product margins, generate invoices, and scale your business.",
  keywords: [
    "ERP software",
    "FMCG billing software",
    "MRP calculator",
    "retail margin calculator",
    "free invoice generator",
    "POS system Sri Lanka",
    "cloud ERP",
    "inventory management",
    "barcode generator",
  ],
  authors: [{ name: "Synctra Technologies" }],
  creator: "Synctra Technologies",
  publisher: "Synctra Technologies (Pvt) Ltd",
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://synctrahq.com",
    title: "Synctra | Worldwide Retail & Warehouse Operating System",
    description:
      "Empowering modern FMCG brands, manufacturers, and SMEs with million-dollar ERP tools, POS, and real-time pricing intelligence.",
    siteName: "Synctra",
  },
  twitter: {
    card: "summary_large_image",
    title: "Synctra | Worldwide Retail & Warehouse Operating System",
    description:
      "Calculate true FMCG margins, generate instant PDF invoices without login, and create standardized retail barcodes.",
    creator: "@synctrahq",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://synctrahq.com/#organization",
        name: "Synctra Technologies",
        url: "https://synctrahq.com",
        logo: "https://synctrahq.com/logo.png",
        contactPoint: {
          "@type": "ContactPoint",
          telephone: "+94-72-375-8191",
          contactType: "customer service",
          email: "hello@synctrahq.com",
        },
      },
      {
        "@type": "WebSite",
        "@id": "https://synctrahq.com/#website",
        url: "https://synctrahq.com",
        name: "Synctra",
        publisher: {
          "@id": "https://synctrahq.com/#organization",
        },
      },
    ],
  };

  return (
    <html lang="en" className={`scroll-smooth ${inter.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-neutral-bg text-neutral-text font-sans antialiased">
        <Navbar />
        <main className="flex-1 flex flex-col">{children}</main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
