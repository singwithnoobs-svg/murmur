"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Megaphone, ExternalLink, MessageCircle, Rocket, ChevronDown, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * AD COMPONENT
 * Handles the manual injection of Adsterra scripts into the DOM
 */
function AdsterraBanner({ instanceId }: { instanceId: number }) {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (adRef.current && adRef.current.innerHTML === "") {
      const adKey = "d5b7d02c3eed6fede79ae09ea0e30660";
      
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
    }
  }, [instanceId]);

  return (
    <div className="flex flex-col items-center justify-center w-full py-8 bg-zinc-900/10 rounded-[2.5rem] border border-white/5 min-h-[320px] shadow-inner">
      <div className="mb-4 flex items-center gap-2">
        <ShieldCheck className="w-3 h-3 text-zinc-800" />
        <span className="text-[8px] font-black text-zinc-800 uppercase tracking-[0.4em]">Verified Ad Feed</span>
      </div>
      <div ref={adRef} className="rounded-lg overflow-hidden shadow-2xl border border-white/5" />
    </div>
  );
}

export default function PromotionsPage() {
  const [visibleAds, setVisibleAds] = useState([1]);
  const DISCORD_LINK = "https://discord.gg/E5pGCkSB";

  const addNextPromotion = () => {
    setVisibleAds(prev => [...prev, Date.now()]);
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 200);
  };

  return (
    <div className="min-h-screen w-full bg-[#050505] text-zinc-100 font-sans overflow-y-auto selection:bg-red-500/30">
      
      {/* HEADER SECTION */}
      <div className="max-w-4xl mx-auto px-6 pt-16 pb-10 border-b border-white/5">
        <motion.div 
          initial={{ opacity: 0, x: -20 }} 
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-5"
        >
          <div className="p-4 bg-red-500/10 rounded-2xl border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
            <Megaphone className="w-7 h-7 text-red-500" />
          </div>
          <div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter">Sponsor Deck</h1>
            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.5em] mt-1">Authorized Commercial Stream</p>
          </div>
        </motion.div>
      </div>

      <main className="max-w-4xl mx-auto px-6 py-12 space-y-12">
        <AnimatePresence mode="popLayout">
          {visibleAds.map((id) => (
            <motion.div
              key={id}
              initial={{ opacity: 0, y: 30, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <AdsterraBanner instanceId={id} />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* LOAD MORE */}
        <div className="py-16 flex flex-col items-center gap-6">
          <button 
            onClick={addNextPromotion}
            className="group flex flex-col items-center gap-4 text-zinc-700 hover:text-white transition-all"
          >
            <span className="text-[10px] font-black uppercase tracking-[0.5em]">Sync Next Sponsor</span>
            <div className="p-5 rounded-full border border-white/5 group-hover:border-red-500/50 group-hover:bg-red-500/10 transition-all shadow-xl active:scale-90">
              <ChevronDown className="w-6 h-6 animate-bounce text-red-500" />
            </div>
          </button>
        </div>

        <hr className="border-white/5 my-12" />

        {/* PROMOTION CTAS */}
        <section className="grid sm:grid-cols-2 gap-8 pb-32">
          
          {/* CONTACT/JOB BOX - NOW REDIRECTS TO DISCORD */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-zinc-900/30 border border-white/5 rounded-[3rem] p-10 flex flex-col justify-between items-start gap-10 hover:border-red-500/20 transition-all"
          >
            <div>
              <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6">
                <Rocket className="text-red-500 w-6 h-6" />
              </div>
              <h4 className="text-2xl font-black uppercase italic tracking-tighter">Branding & Jobs</h4>
              <p className="text-zinc-500 text-xs leading-relaxed mt-4">
                To apply for job positions or discuss branding/partnerships, join our HQ. All business inquiries are handled via our <span className="text-white font-bold">#Support-Tickets</span> channel.
              </p>
            </div>
            <a 
              href={DISCORD_LINK}
              target="_blank"
              className="w-full py-5 bg-white text-black rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all text-center flex items-center justify-center gap-2"
            >
              Contact Team <ExternalLink className="w-3 h-3" />
            </a>
          </motion.div>

          {/* DISCORD BOX */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-[#5865F2]/5 border border-[#5865F2]/20 rounded-[3rem] p-10 flex flex-col justify-between items-start gap-10 hover:border-[#5865F2]/40 transition-all"
          >
            <div>
              <div className="w-12 h-12 bg-[#5865F2]/10 rounded-2xl flex items-center justify-center mb-6">
                <MessageCircle className="text-[#5865F2] w-6 h-6" />
              </div>
              <h4 className="text-2xl font-black uppercase italic tracking-tighter">Join Community</h4>
              <p className="text-zinc-500 text-xs leading-relaxed mt-4">
                Connect with developers and the elite community. Direct access to dev-logs, beta protocols, and global announcements.
              </p>
            </div>
            <a 
              href={DISCORD_LINK}
              target="_blank"
              className="w-full py-5 bg-[#5865F2] text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all text-center flex items-center justify-center gap-3"
            >
              Enter Hub <ExternalLink className="w-3 h-3" />
            </a>
          </motion.div>
        </section>
      </main>

      <style jsx global>{`
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: #050505; }
        ::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #ef4444; }
      `}</style>
    </div>
  );
}
