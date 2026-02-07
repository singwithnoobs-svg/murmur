"use client";

import Link from "next/link";
import { MessageSquare, Shield } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 border-b border-zinc-900/30 bg-zinc-950/50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-4">
        
        {/* Logo Section - Optimized for small widths */}
        <Link href="/" className="flex items-center gap-2 sm:gap-3 group relative shrink-0">
          <div className="absolute -inset-2 bg-purple-500/10 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative p-2 rounded-xl bg-zinc-900/50 border border-zinc-800 group-hover:border-purple-500/50 transition-colors">
            <MessageSquare className="w-4 h-4 sm:w-5 h-5 text-purple-600 group-hover:scale-110 transition-transform duration-300" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-black text-lg sm:text-xl tracking-tighter italic leading-none">MURMUR</span>
            <span className="text-[7px] sm:text-[8px] text-zinc-700 font-bold tracking-[0.3em] sm:tracking-[0.4em] uppercase truncate">
              Private Frequency
            </span>
          </div>
        </Link>

        {/* System Status - Fluid hide/show logic */}
        <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-zinc-900/30 border border-zinc-800/50 shadow-inner">
            <div className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]"></span>
            </div>
            {/* Hide text on very small screens to prevent logo collision */}
            <span className="text-[9px] sm:text-[10px] font-black text-zinc-500 uppercase tracking-widest sm:tracking-[0.15em] whitespace-nowrap overflow-hidden">
              <span className="hidden xs:inline">Network</span> Online
            </span>
          </div>
          
          {/* Subtle Security Indicator - Hidden on extra small screens */}
          <div className="p-1 sm:p-2 text-zinc-800 hidden xs:block shrink-0">
            <Shield className="w-3.5 h-3.5 sm:w-4 h-4" />
          </div>
        </div>

      </div>
    </nav>
  );
}
