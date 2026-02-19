"use client";

import { motion } from "framer-motion";
import { 
  ExternalLink, 
  MessageCircle, 
  Rocket, 
  ShieldCheck, 
  Zap, 
  ArrowLeft, 
  Home 
} from "lucide-react";
import Link from "next/link";

export default function PromotionsPage() {
  const DISCORD_LINK = "https://discord.gg/E5pGCkSB";

  return (
    <div className="min-h-screen w-full bg-[#030303] text-zinc-100 font-sans overflow-y-auto selection:bg-purple-500/30">
      
      {/* Background Ambient Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 bg-purple-600/10 blur-[120px] pointer-events-none" />

      {/* TOP NAVIGATION BAR */}
      <nav className="fixed top-0 w-full z-[100] px-6 py-6 flex justify-between items-center max-w-4xl left-1/2 -translate-x-1/2">
        <Link 
          href="/" 
          className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900/50 border border-white/5 backdrop-blur-md hover:border-purple-500/40 transition-all active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 text-zinc-400 group-hover:text-purple-400 transition-colors" />
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-white">Back</span>
        </Link>

        <Link 
          href="/" 
          className="p-2.5 rounded-xl bg-zinc-900/50 border border-white/5 backdrop-blur-md hover:text-purple-400 transition-all"
        >
          <Home className="w-5 h-5" />
        </Link>
      </nav>

      <header className="max-w-4xl mx-auto px-6 pt-32 pb-12 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center gap-4"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 mb-2">
            <ShieldCheck className="w-3 h-3 text-purple-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">Secure Protocol</span>
          </div>
          <h1 className="text-5xl sm:text-7xl font-black italic uppercase tracking-tighter leading-none">
            Murmur <span className="text-purple-600">Hub</span>
          </h1>
          <p className="max-w-md text-zinc-500 text-xs font-medium uppercase tracking-[0.2em] leading-relaxed">
            authorized communication relay. Access community protocols, professional inquiries, and system support.
          </p>
        </motion.div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 space-y-16 relative z-10">
        
        {/* GLOBAL COMMAND CENTER - UNIFIED HUB */}
        <section className="pb-32">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="group bg-gradient-to-b from-zinc-900/40 to-black border border-white/5 rounded-[4rem] p-8 md:p-16 flex flex-col items-center text-center gap-8 hover:border-purple-500/20 transition-all shadow-2xl relative overflow-hidden"
          >
            {/* Top Accent Line */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
            
            <div className="flex -space-x-3">
              <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center border border-purple-500/20 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500">
                <Rocket className="text-purple-500 w-7 h-7" />
              </div>
              <div className="w-16 h-16 bg-[#5865F2]/10 rounded-2xl flex items-center justify-center border border-[#5865F2]/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                <MessageCircle className="text-[#5865F2] w-7 h-7" />
              </div>
            </div>

            <div className="max-w-xl space-y-4">
              <h4 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter leading-none">
                Global <span className="text-purple-600">Command</span> Center
              </h4>
              <p className="text-zinc-500 text-sm md:text-base font-medium leading-relaxed max-w-md mx-auto">
                Discord is our primary frequency. Connect here for <span className="text-white">Community Access</span>, 
                professional <span className="text-white">Partnerships</span>, <span className="text-white">Careers</span>, 
                and <span className="text-white">Official Support</span> tickets.
              </p>
            </div>

            {/* Hub Categories */}
            <div className="flex flex-wrap justify-center gap-2 md:gap-3">
              {["Community", "Support", "Partnerships", "Sponsorships", "Careers"].map((tag) => (
                <span key={tag} className="px-4 py-2 rounded-xl border border-white/5 bg-zinc-900/50 text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-purple-400 group-hover:border-purple-500/20 transition-colors">
                  {tag}
                </span>
              ))}
            </div>

            <a 
              href={DISCORD_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="group/btn relative w-full max-w-sm py-6 bg-purple-600 text-white rounded-[2.5rem] text-[12px] font-black uppercase tracking-[0.3em] hover:bg-purple-600 hover:text-white transition-all duration-500 text-center flex items-center justify-center gap-3 shadow-xl overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                Initialize Connection <ExternalLink className="w-4 h-4" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 opacity-0 transition-opacity duration-500" />
            </a>
            
            <div className="flex items-center gap-2 opacity-50">
              <Zap className="w-3 h-3 text-purple-500" />
              <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.5em]">
                Authorized HQ Relay
              </p>
            </div>
          </motion.div>
        </section>
      </main>

      <style jsx global>{`
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #030303; }
        ::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #7c3aed; }
      `}</style>
    </div>
  );
}
