"use client";

import Link from "next/link";
import { MessageSquare, ShieldCheck, Mail, Info, Fingerprint } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { name: "About", href: "/about", icon: Info },
    { name: "Contact", href: "/contact", icon: Mail },
    { name: "Privacy", href: "/privacy", icon: Fingerprint },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 border-b border-zinc-900 bg-zinc-950/70 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        
        {/* Logo Section */}
        <Link href="/" className="flex items-center gap-3 group relative">
          <div className="absolute -inset-2 bg-purple-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative p-2 rounded-xl bg-zinc-900 border border-zinc-800 group-hover:border-purple-500/50 transition-colors">
            <MessageSquare className="w-5 h-5 text-purple-500 group-hover:scale-110 transition-transform duration-300" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-xl tracking-tighter italic leading-none">MURMUR</span>
            <span className="text-[8px] text-zinc-600 font-bold tracking-[0.3em] uppercase">Encrypted</span>
          </div>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-10">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link 
                key={link.name} 
                href={link.href}
                className={cn(
                  "relative text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 flex items-center gap-2 group",
                  pathname === link.href ? "text-purple-400" : "text-zinc-500 hover:text-white"
                )}
              >
                <Icon className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                {link.name}
                
                {/* Animated Underline */}
                <span className={cn(
                  "absolute -bottom-1 left-0 h-[1px] bg-purple-500 transition-all duration-300",
                  pathname === link.href ? "w-full" : "w-0 group-hover:w-full"
                )} />
              </Link>
            );
          })}
        </div>

        {/* Security Status (Replaced Launch Button) */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900/50 border border-zinc-800">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
              Nodes Secured
            </span>
          </div>
          
          {/* Mobile Icon Only for Privacy */}
          <Link href="/privacy" className="md:hidden p-2 text-zinc-500">
            <ShieldCheck className="w-5 h-5 hover:text-purple-500 transition-colors" />
          </Link>
        </div>

      </div>
    </nav>
  );
}
