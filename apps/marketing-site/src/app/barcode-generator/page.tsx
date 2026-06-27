import React from "react";
import { SKUAndBarcodeGeneratorClient } from "@/components/barcode/SKUAndBarcodeGeneratorClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Retail SKU & Printable Barcode Generator | Synctra",
  description:
    "Generate standardized retail SKUs, printable Barcodes (EAN13, UPCA, Code 128, GS1-128), and high-resolution GS1 Digital Link QR codes for product packaging instantly. Thermal printer ready.",
  keywords: ["free barcode generator", "SKU generator retail", "Code 128 barcode maker", "EAN13 generator", "GS1 digital link QR generator", "thermal barcode sticker"],
  alternates: {
    canonical: "/barcode-generator",
  },
  openGraph: {
    title: "Free Retail SKU & Printable Barcode Generator | Synctra",
    description:
      "Generate standardized retail SKUs, thermal-printer ready barcodes, and GS1 Digital Link QR codes.",
    url: "https://synctrahq.com/barcode-generator",
  },
};

export default function BarcodeGeneratorPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Synctra SKU & Printable Barcode Generator",
    url: "https://synctrahq.com/barcode-generator",
    description:
      "Free web app to generate standardized retail product SKUs, Code 128 barcodes, EAN13 retail barcodes, and high-resolution QR stickers.",
    applicationCategory: "UtilityApplication",
    operatingSystem: "All",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SKUAndBarcodeGeneratorClient />
    </>
  );
}
