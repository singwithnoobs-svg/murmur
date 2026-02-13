"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Megaphone, ExternalLink, MessageCircle, Rocket, ChevronDown, ShieldCheck, Cpu, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * AD COMPONENT
 * Improved with cleanup and loading state
 */
function AdsterraBanner({ instanceId }: { instanceId: number }) {
  const adRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (adRef.current && adRef.current.innerHTML === "") {
      const adKey = "d5b7d02c3eed6fede79ae09ea0e30660";
      
      try {
        const configScript = document.createElement("script");
        configScript.innerHTML = `
          atOptions = {
            'key' : '${adKey}',
            'format' : 'iframe',
            'height' : 250,
            'width' : 300,
            'params' : {}
          };
        `;
        
        const invokeScript = document.createElement("script");
        invokeScript.src = `https://www.highperformanceformat.com/${adKey}/invoke.js`;
        invokeScript.async = true;
        invokeScript.type = "text/javascript";
        
        adRef.current.appendChild(configScript);
        adRef.current.appendChild(invokeScript);
        
        // Simulate load completion for UI
        setTimeout(() => setIsLoaded(true), 1500);
      } catch (e) {
        console.error("Adsterra Injection Failed", e);
      }
    }
    
    // Cleanup function to prevent ghost scripts on unmount
    return () => {
      if (adRef.current) adRef.current.innerHTML = "";
    };
  }, [instanceId]);

  return (
    <div className="relative flex flex-col items-center justify-center w-full py-10 bg-purple-900/[0.03] rounded-[3rem] border border-purple-500/10 min-h-[380px] shadow-2xl transition-all hover:border-purple-500/30">
      
      {!isLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm rounded-[3rem] z-10">
            <Cpu className="w-8 h-8 text-purple-600 animate-pulse mb-3" />
            <span className="text-[10px] font-black text-purple-500 uppercase tracking-widest animate-pulse">Scanning Frequencies...</span>
        </div>
      )}

      <div className="mb-6 flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping" />
        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.4em]">Node ID: 0x{instanceId.toString(16).slice(-4)}</span>
      </div>

      <div ref={adRef} className="rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/5" />
      
      <div className="mt-6 flex items-center gap-4">
         <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3 h-3 text-purple-900" />
            <span className="text-[8px] font-bold text-zinc-700 uppercase">Encrypted</span>
         </div>
         <div className="flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-purple-900" />
            <span className="text-[8px] font-bold text-zinc-700 uppercase">High Bandwidth</span>
         </div>
      </div>
    </div>
  );
}

export default function PromotionsPage() {
  const [visibleAds, setVisibleAds] = useState([1]);
  const DISCORD_LINK = "https://discord.gg/E5pGCkSB";

  const addNextPromotion = () => {
    setVisibleAds(prev => [...prev, Date.now()]);
    // Smooth scroll with a slight delay to allow render
    setTimeout(() => {
      window.scrollTo({ 
        top: document.body.scrollHeight, 
        behavior: 'smooth' 
      });
    }, 100);
  };

  return (
    <div className="min-h-screen w-full bg-[#030303] text-zinc-100 font-sans overflow-y-auto selection:bg-purple-500/30">
      
      {/* PURPLE AMBIENT GLOW */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 bg-purple-600/10 blur-[120px] pointer-events-none" />

      {/* HEADER SECTION */}
      <header className="max-w-4xl mx-auto px-6 pt-24 pb-12 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center gap-4"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 mb-2">
            <Zap className="w-3 h-3 text-purple-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">Verified Sponsor Stream</span>
          </div>
          <h1 className="text-5xl sm:text-7xl font-black italic uppercase tracking-tighter leading-none">
            Sponsor <span className="text-purple-600">Deck</span>
          </h1>
          <p className="max-w-md text-zinc-500 text-xs font-medium uppercase tracking-[0.2em] leading-relaxed">
            authorized commercial relay. interactions here directly fuel the development of the Murmurz ecosystem.
          </p>
        </motion.div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 space-y-16 relative z-10">
        
        {/* ADS LIST */}
        <div className="space-y-12">
            <AnimatePresence mode="popLayout">
            {visibleAds.map((id) => (
                <motion.div
                key={id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", damping: 20 }}
                >
                <AdsterraBanner instanceId={id} />
                </motion.div>
            ))}
            </AnimatePresence>
        </div>

        {/* SYNC BUTTON */}
        <div className="py-10 flex flex-col items-center gap-6">
          <button 
            onClick={addNextPromotion}
            className="relative group p-[2px] rounded-full overflow-hidden transition-all active:scale-95"
          >
            {/* Animated border */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500 to-transparent group-hover:via-purple-400 animate-[spin_3s_linear_infinite]" />
            
            <div className="relative flex flex-col items-center gap-2 bg-black px-12 py-6 rounded-full border border-white/5 transition-colors group-hover:bg-zinc-900">
                <span className="text-[11px] font-black uppercase tracking-[0.5em] text-purple-500">Sync Next Node</span>
                <ChevronDown className="w-5 h-5 text-white animate-bounce" />
            </div>
          </button>
        </div>

        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/5 to-transparent" />

        {/* PROMOTION CTAS */}
        <section className="grid sm:grid-cols-2 gap-8 pb-32">
          
          <motion.div 
            whileHover={{ y: -8 }}
            className="group bg-zinc-900/20 border border-white/5 rounded-[3.5rem] p-10 flex flex-col justify-between items-start gap-12 hover:border-purple-500/20 transition-all"
          >
            <div className="space-y-6">
              <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Rocket className="text-purple-500 w-7 h-7" />
              </div>
              <h4 className="text-3xl font-black uppercase italic tracking-tighter">Careers & <br/>Partners</h4>
              <p className="text-zinc-500 text-[13px] leading-relaxed">
                Join our HQ for job applications or branding discussions. All professional inquiries are routed via our <span className="text-purple-400 font-bold">#Support-Tickets</span>.
              </p>
            </div>
            <a 
              href={DISCORD_LINK}
              target="_blank"
              className="w-full py-5 bg-purple-600 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-widest hover:bg-purple-500 transition-all text-center flex items-center justify-center gap-2 shadow-lg shadow-purple-900/20"
            >
              Contact Team <ExternalLink className="w-3 h-3" />
            </a>
          </motion.div>

          <motion.div 
            whileHover={{ y: -8 }}
            className="group bg-zinc-900/20 border border-white/5 rounded-[3.5rem] p-10 flex flex-col justify-between items-start gap-12 hover:border-[#5865F2]/20 transition-all"
          >
            <div className="space-y-6">
              <div className="w-14 h-14 bg-[#5865F2]/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <MessageCircle className="text-[#5865F2] w-7 h-7" />
              </div>
              <h4 className="text-3xl font-black uppercase italic tracking-tighter">Enter the <br/>Community</h4>
              <p className="text-zinc-500 text-[13px] leading-relaxed">
                Connect with the Murmurz elite. Get direct access to beta protocols, dev-logs, and global live-chats.
              </p>
            </div>
            <a 
              href={DISCORD_LINK}
              target="_blank"
              className="w-full py-5 bg-[#5865F2] text-white rounded-[2rem] text-[11px] font-black uppercase tracking-widest hover:opacity-90 transition-all text-center flex items-center justify-center gap-3 shadow-lg shadow-blue-900/20"
            >
              Access Hub <ExternalLink className="w-3 h-3" />
            </a>
          </motion.div>
        </section>
      </main>

      <style jsx global>{`
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #030303; }
        ::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #7c3aed; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
