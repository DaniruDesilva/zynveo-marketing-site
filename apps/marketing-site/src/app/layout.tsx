import React from "react";
import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Analytics } from "@/components/analytics/Analytics";
import { Preloader } from "@/components/layout/Preloader";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://zynveo.com"),
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  title: {
    default: "Zynveo | The Next-Gen Cloud OS For Retail, ERP, POS & Inventory",
    template: "%s | Zynveo",
  },
  description:
    "Zynveo is the modern cloud-native ERP and SaaS operating system for FMCG brands, wholesalers, and SMEs. Calculate true product margins, generate invoices, and scale your business.",
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
  authors: [{ name: "Zynveo Technologies" }],
  creator: "Zynveo Technologies",
  publisher: "Zynveo Technologies (Pvt) Ltd",
  verification: {
    google: "irsIIasYQ_21H1yyQwPRXc1LvkAnCOgGEeRITy3yocM",
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
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://zynveo.com",
    title: "Zynveo | The Next-Gen Cloud OS For Retail, ERP, POS & Inventory",
    description:
      "Empowering modern FMCG brands, manufacturers, and SMEs with million-dollar ERP tools, POS, and real-time pricing intelligence.",
    siteName: "Zynveo",
  },
  twitter: {
    card: "summary_large_image",
    title: "Zynveo | The Next-Gen Cloud OS For Retail, ERP, POS & Inventory",
    description:
      "Calculate true FMCG margins, generate instant PDF invoices without login, and create standardized retail barcodes.",
    creator: "@zynveo",
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
        "@id": "https://zynveo.com/#organization",
        name: "Zynveo Technologies",
        url: "https://zynveo.com",
        logo: "https://zynveo.com/logo.png",
        contactPoint: {
          "@type": "ContactPoint",
          telephone: "+94-72-375-8191",
          contactType: "customer service",
          email: "hello@zynveo.com",
        },
      },
      {
        "@type": "WebSite",
        "@id": "https://zynveo.com/#website",
        url: "https://zynveo.com",
        name: "Zynveo",
        publisher: {
          "@id": "https://zynveo.com/#organization",
        },
        potentialAction: {
          "@type": "SearchAction",
          target: "https://zynveo.com/blog?q={search_term_string}",
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "ItemList",
        "@id": "https://zynveo.com/#sitelinks",
        name: "Primary Navigation",
        itemListElement: [
          {
            "@type": "SiteNavigationElement",
            position: 1,
            name: "MRP & Margin Calculator",
            description: "Reverse-engineer shelf MRP prices and retail profit margins instantly.",
            url: "https://zynveo.com/mrp-calculator",
          },
          {
            "@type": "SiteNavigationElement",
            position: 2,
            name: "No-Login Invoice Generator",
            description: "Create and download professional branded PDF invoices with tax calculations.",
            url: "https://zynveo.com/invoice-generator",
          },
          {
            "@type": "SiteNavigationElement",
            position: 3,
            name: "SKU & Barcode Generator",
            description: "Generate thermal printer-ready retail SKUs, Code 128, and EAN13 barcodes.",
            url: "https://zynveo.com/barcode-generator",
          },
          {
            "@type": "SiteNavigationElement",
            position: 4,
            name: "About Zynveo",
            description: "Learn about our mission democratizing enterprise retail and ERP tools.",
            url: "https://zynveo.com/about",
          },
          {
            "@type": "SiteNavigationElement",
            position: 5,
            name: "Contact Sales & Support",
            description: "Reach our enterprise engineering and customer support team 24/7.",
            url: "https://zynveo.com/contact",
          },
          {
            "@type": "SiteNavigationElement",
            position: 6,
            name: "Retail & ERP Insights Blog",
            description: "Read actionable guides on inventory control, POS systems, and retail math.",
            url: "https://zynveo.com/blog",
          },
        ],
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
        <Preloader />
        <Navbar />
        <main className="flex-1 flex flex-col">{children}</main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
