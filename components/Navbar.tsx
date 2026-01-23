"use client";

import Link from "next/link";
import { MessageSquare, Zap } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <MessageSquare className="w-5 h-5 text-purple-500 group-hover:rotate-12 transition-transform" />
          </div>
          <span className="font-black text-lg tracking-tighter italic">MURMUR</span>
        </Link>

        {/* Desktop Navigation - Simplified */}
        <div className="hidden md:flex items-center gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
          <Link href="/" className="hover:text-purple-400 transition-colors">Protocol</Link>
          <Link href="/mode" className="hover:text-purple-400 transition-colors flex items-center gap-2">
            <span className="w-1 h-1 bg-purple-500 rounded-full animate-pulse" />
            Active Nodes
          </Link>
        </div>

        {/* Call to Action */}
        <div className="flex items-center gap-3">
          <Link href="/mode">
            <button className="bg-white text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all flex items-center gap-2 active:scale-95 shadow-lg shadow-purple-500/10">
              <Zap className="w-3 h-3 fill-current" />
              Launch
            </button>
          </Link>
        </div>
      </div>
    </nav>
  );
}