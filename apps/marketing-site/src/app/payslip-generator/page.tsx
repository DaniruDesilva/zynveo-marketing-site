import React from "react";
import { PayslipGeneratorClient } from "@/components/payslip/PayslipGeneratorClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Payslip Generator Online | PDF Salary Slip Maker",
  description:
    "Generate professional PDF payslips and salary stubs for free. Enter employee details, earnings, deductions, and download an A4 PDF salary slip instantly — no sign-up or login required.",
  keywords: [
    "free payslip generator",
    "salary slip maker online",
    "pay stub generator",
    "payslip template PDF",
    "salary slip download",
    "employee payslip maker",
    "free salary slip generator",
    "payslip generator no login",
    "make pay stub online",
    "salary certificate generator",
  ],
  alternates: {
    canonical: "/payslip-generator",
  },
  openGraph: {
    title: "Free Payslip Generator Online | PDF Salary Slip Maker | Zynveo",
    description:
      "Create professional salary slips with dynamic earnings, deductions, and instant PDF download — 100% free, no sign-up needed.",
    url: "https://zynveo.com/payslip-generator",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Payslip Generator | Zynveo",
    description:
      "Generate professional PDF payslips for employees instantly. No login required.",
  },
};

export default function PayslipGeneratorPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Zynveo Free Payslip Generator",
    url: "https://zynveo.com/payslip-generator",
    description:
      "Free online payslip and salary stub generator. Create professional PDF salary slips with dynamic earnings, deductions, and instant download without registration.",
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
      <PayslipGeneratorClient />
    </>
  );
}
