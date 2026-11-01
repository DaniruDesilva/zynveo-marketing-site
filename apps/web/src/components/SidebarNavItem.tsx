"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function SidebarNavItem({ 
  href, 
  icon, 
  label, 
  badge,
  badgeColor = "bg-blue-100 text-blue-700" 
}: { 
  href: string; 
  icon: React.ReactNode; 
  label: string;
  badge?: string;
  badgeColor?: string;
}) {
  const pathname = usePathname();
  
  // Highlight active path or sub-routes
  const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href + '/'));

  return (
    <div className="px-3">
      <Link 
        href={href}
        className={`group flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all ${
          isActive 
            ? "text-blue-600 bg-blue-50/80 font-semibold shadow-xs" 
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        }`}
      >
        <div className="flex items-center space-x-3 min-w-0">
          <span className={`transition-colors ${isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"}`}>
            {icon}
          </span>
          <span className="truncate">{label}</span>
        </div>
        {badge && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeColor}`}>
            {badge}
          </span>
        )}
      </Link>
    </div>
  );
}
