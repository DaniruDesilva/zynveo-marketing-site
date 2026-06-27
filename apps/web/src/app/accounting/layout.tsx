import React from "react";
import AccountingTabs from "./AccountingTabs";

export default function AccountingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4">
      <AccountingTabs />
      <div>
        {children}
      </div>
    </div>
  );
}
