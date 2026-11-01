"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { 
  Plus, 
  FileText, 
  ShoppingBag, 
  Scale, 
  UserPlus, 
  DollarSign, 
  Factory,
  ChevronDown 
} from "lucide-react";

export function SidebarQuickCreate() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const quickActions = [
    {
      href: "/sales/invoices/new",
      icon: <FileText size={16} className="text-blue-500" />,
      label: "New Sales Invoice",
      description: "Order-to-Cash Saga",
    },
    {
      href: "/purchases/grn/new",
      icon: <ShoppingBag size={16} className="text-orange-500" />,
      label: "Add Goods Received Note (GRN)",
      description: "3-Way Match & Stock Receipt",
    },
    {
      href: "/accounting/journals/new",
      icon: <Scale size={16} className="text-indigo-500" />,
      label: "New Journal Entry",
      description: "Double-Entry Balance Check",
    },
    {
      href: "/people/customers/new",
      icon: <UserPlus size={16} className="text-emerald-500" />,
      label: "Add Customer",
      description: "CRM & Credit Limit",
    },
    {
      href: "/accounting/payments/new",
      icon: <DollarSign size={16} className="text-purple-500" />,
      label: "Record Payment",
      description: "Customer or Supplier Payment",
    },
    {
      href: "/manufacturing",
      icon: <Factory size={16} className="text-amber-500" />,
      label: "Manufacturing Work Order",
      description: "BOM & Production Yield",
    },
  ];

  return (
    <div className="relative px-3 pb-3" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-3.5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm shadow-blue-200"
      >
        <div className="flex items-center space-x-2">
          <Plus size={18} className="stroke-[2.5]" />
          <span>New Transaction</span>
        </div>
        <ChevronDown 
          size={16} 
          className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} 
        />
      </button>

      {isOpen && (
        <div className="absolute left-3 right-3 top-full mt-1.5 z-50 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Quick Actions
          </div>
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              onClick={() => setIsOpen(false)}
              className="flex items-start space-x-3 px-3 py-2 text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <div className="mt-0.5 p-1 bg-slate-50 rounded-md">
                {action.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-slate-800 leading-tight">
                  {action.label}
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">
                  {action.description}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
