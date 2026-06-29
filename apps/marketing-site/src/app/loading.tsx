import React from "react";
import { Loader2, Sparkles, Cpu } from "lucide-react";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[90] flex flex-col items-center justify-center bg-slate-950 text-white">
      <div className="relative z-10 flex flex-col items-center max-w-md w-full px-6 text-center space-y-8 animate-pulse">
        <div className="relative flex items-center gap-4 px-6 py-4 rounded-3xl bg-slate-900/90 border border-white/10 shadow-2xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white p-2 shadow-lg">
            <img src="/logo.png" alt="Zynveo Logo" className="h-full w-full object-contain" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-3xl font-black tracking-tight text-white leading-none">
              Zyn<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-400 to-accent">veo</span>
            </span>
            <span className="text-[10px] font-extrabold tracking-widest uppercase text-emerald-400 mt-1">
              Cloud OS 2.0
            </span>
          </div>
        </div>

        <div className="w-full bg-slate-900/80 p-6 rounded-2xl border border-slate-800 flex items-center justify-center gap-3 text-xs font-mono font-bold text-slate-300">
          <Cpu className="h-4 w-4 text-indigo-400 animate-spin" />
          <span>PREPARING CLOUD WORKSPACE...</span>
        </div>
      </div>
    </div>
  );
}
