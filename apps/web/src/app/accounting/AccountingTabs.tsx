"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AccountingTabs() {
  const pathname = usePathname();

  const tabs = [
    { href: "/accounting", label: "Dashboard", exact: true },
    { href: "/accounting/accounts", label: "Chart of Accounts" },
    { href: "/accounting/journals", label: "Journal Entries" },
    { href: "/accounting/reports", label: "Reports" },
  ];

  return (
    <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 flex space-x-2">
      {tabs.map((tab) => {
        const isActive = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              isActive 
                ? "bg-blue-50 text-blue-600" 
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
