"use client";

import React, { useEffect, useState } from "react";
import { Zap } from "lucide-react";

export function Preloader() {
  const [isLoading, setIsLoading] = useState(true);
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    // Dismiss loading screen smoothly after 1.2s
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1200);

    const removeTimer = setTimeout(() => {
      setIsHidden(true);
    }, 1700); // 500ms transition

    return () => {
      clearTimeout(timer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (isHidden) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/95 backdrop-blur-3xl transition-opacity duration-500 ease-in-out ${
        isLoading ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
      aria-hidden={!isLoading}
    >
      <div className="flex flex-col items-center space-y-8 max-w-sm px-6 text-center animate-in fade-in zoom-in-95 duration-500">
        {/* Brand Logo */}
        <div className="flex items-center gap-3.5 scale-125 sm:scale-150">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary via-indigo-600 to-accent text-white shadow-xl shadow-primary/30 animate-pulse">
            <Zap className="h-7 w-7 fill-current" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-3xl font-black tracking-tight text-slate-900 leading-none">
              Sync<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">tra</span>
            </span>
            <span className="text-[10px] font-extrabold tracking-widest uppercase text-slate-400 mt-0.5">
              Cloud OS
            </span>
          </div>
        </div>

        {/* Animated Geometric Loader Icons (Inspired by Image 2) */}
        <div className="flex items-center justify-center gap-4 pt-4">
          {/* Circle */}
          <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" style={{ animationDuration: '1s' }} />
          {/* Triangle */}
          <div className="h-4 w-4 border-b-[16px] border-b-indigo-500 border-l-[9px] border-l-transparent border-r-[9px] border-r-transparent animate-bounce" style={{ animationDelay: '150ms' }} />
          {/* Square */}
          <div className="h-4 w-4 rounded-sm bg-accent animate-pulse" style={{ animationDelay: '300ms' }} />
        </div>

        {/* Loading Text */}
        <div className="space-y-1 pt-2">
          <p className="text-xs font-black tracking-[0.25em] text-slate-500 uppercase animate-pulse">
            LOADING SYNCTRA...
          </p>
          <p className="text-[10px] font-bold text-slate-400">
            Enterprise ERP & Viral Pricing Suite
          </p>
        </div>
      </div>
    </div>
  );
}
