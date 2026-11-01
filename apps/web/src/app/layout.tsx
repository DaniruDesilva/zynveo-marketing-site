import type { Metadata } from "next";
import "./globals.css";
import React from "react";
import { AuthProvider } from "../components/AuthProvider";
import { AppShell } from "../components/AppShell";

export const metadata: Metadata = {
  title: "Zynveo ERP OS",
  description: "Autonomous Enterprise Resource Planning System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#f0f4f8] text-slate-900">
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
