"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function SidebarNavItem({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  const pathname = usePathname();
  
  // To correctly highlight exact matches or sub-routes.
  const isActive = pathname === href || pathname.startsWith(href + '/');

  return (
    <div className="px-3">
      <Link 
        href={href}
        className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
          isActive ? "text-blue-600 bg-blue-50" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
        }`}
      >
        <span className={isActive ? "text-blue-600" : "text-slate-400"}>{icon}</span>
        <span>{label}</span>
      </Link>
    </div>
  );
}
