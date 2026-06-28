"use client";

import React, { useEffect, useState } from "react";
import { Zap, Sparkles, ShieldCheck, Cpu } from "lucide-react";

const loadingSteps = [
  { progress: 15, text: "CONNECTING TO ENTERPRISE CLOUD NODES..." },
  { progress: 45, text: "SYNCING MULTI-BRANCH POS & INVENTORY..." },
  { progress: 80, text: "LOADING 100% FREE VIRAL UTILITY SUITE..." },
  { progress: 100, text: "CLOUD OS LIVE • LAUNCHING ZYNVEO..." },
];

export function Preloader() {
  const [progress, setProgress] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    // Simulate realistic, fast high-tech loading progression
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setIsLoading(false), 300);
          setTimeout(() => setIsHidden(true), 1000);
          return 100;
        }
        const next = prev + Math.floor(Math.random() * 8) + 4;
        return next > 100 ? 100 : next;
      });
    }, 45);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress < 30) setCurrentStepIndex(0);
    else if (progress < 65) setCurrentStepIndex(1);
    else if (progress < 95) setCurrentStepIndex(2);
    else setCurrentStepIndex(3);
  }, [progress]);

  if (isHidden) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950 text-white transition-all duration-700 ease-out overflow-hidden ${
        isLoading
          ? "opacity-100 scale-100 pointer-events-auto"
          : "opacity-0 blur-md scale-105 pointer-events-none"
      }`}
      aria-hidden={!isLoading}
    >
      {/* Background Ambient Radial Glows */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '4s' }} />
      <div className="absolute bottom-1/3 right-1/3 w-[400px] h-[400px] bg-accent/15 rounded-full blur-[100px] pointer-events-none animate-pulse" style={{ animationDuration: '6s' }} />

      <div className="relative z-10 flex flex-col items-center max-w-md w-full px-6 text-center space-y-10 animate-in fade-in zoom-in-95 duration-500">
        {/* Animated Brand Logo with Glowing Rings */}
        <div className="relative flex flex-col items-center">
          {/* Outer Rotating Glow Ring */}
          <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-primary via-indigo-500 to-accent opacity-40 blur-xl animate-spin" style={{ animationDuration: '10s' }} />
          
          <div className="relative flex items-center gap-4 px-6 py-4 rounded-3xl bg-slate-900/90 border border-white/10 shadow-2xl backdrop-blur-xl">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white p-2 shadow-lg relative overflow-hidden">
              <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full animate-[shimmer_2s_infinite]" />
              <img src="/logo.png" alt="Zynveo Logo" className="h-full w-full object-contain" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-4xl font-black tracking-tight text-white leading-none">
                Zyn<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-400 to-accent">veo</span>
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-[10px] font-extrabold tracking-widest uppercase text-emerald-400">
                  Cloud OS 2.0
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Progress Bar Container */}
        <div className="w-full space-y-3 bg-slate-900/80 p-6 rounded-2xl border border-slate-800/80 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between text-xs font-mono font-bold">
            <span className="text-slate-400 flex items-center gap-1.5 truncate max-w-[240px] sm:max-w-none">
              <Cpu className="h-3.5 w-3.5 text-indigo-400 animate-spin shrink-0" style={{ animationDuration: '3s' }} />
              <span className="truncate">{loadingSteps[currentStepIndex].text}</span>
            </span>
            <span className="text-accent font-black text-sm ml-2">{progress}%</span>
          </div>

          {/* Progress Track */}
          <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/50 shadow-inner relative">
            <div
              className="h-full bg-gradient-to-r from-primary via-indigo-500 to-accent rounded-full transition-all duration-150 ease-out relative shadow-[0_0_12px_rgba(79,46,229,0.8)]"
              style={{ width: `${progress}%` }}
            >
              {/* Shimmer inside progress bar */}
              <div className="absolute inset-0 bg-white/30 animate-pulse" />
            </div>
          </div>

          {/* Bottom Security Pill */}
          <div className="flex items-center justify-center gap-4 pt-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            <span className="flex items-center gap-1 text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
              256-Bit Encrypted
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-slate-400">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              Ready In Milliseconds
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
