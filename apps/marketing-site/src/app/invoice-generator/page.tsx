import React from "react";
import { InvoiceGeneratorClient } from "@/components/invoice/InvoiceGeneratorClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free No-Login Invoice Generator | Zynveo",
  description:
    "The ultimate friction-free invoice generator. Create, preview, and download professional PDF invoices instantly without signing up or remembering passwords.",
  keywords: ["free invoice generator", "no login invoice maker", "PDF invoice tool", "GST VAT billing generator", "instant invoice link"],
  alternates: {
    canonical: "/invoice-generator",
  },
  openGraph: {
    title: "Free No-Login Invoice Generator | Zynveo",
    description:
      "Create branded PDF invoices instantly without signing up or remembering passwords.",
    url: "https://zynveo.com/invoice-generator",
  },
};

export default function InvoiceGeneratorPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Zynveo No-Login Invoice Generator",
    url: "https://zynveo.com/invoice-generator",
    description:
      "Friction-free online billing tool to create branded PDF invoices and payment links without user registration.",
    applicationCategory: "BusinessApplication",
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
      <InvoiceGeneratorClient />
    </>
  );
}
