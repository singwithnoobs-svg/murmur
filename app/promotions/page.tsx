"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Megaphone, ExternalLink, MessageCircle, 
  Rocket, ShieldAlert, ChevronDown 
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock Data - You can replace these with real Adsterra/Partner banners
const AD_BANNERS = [
  { id: 1, title: "Secure VPN Protocol", desc: "Encrypt your node now.", color: "from-blue-600 to-indigo-900" },
  { id: 2, title: "Shadow Marketplace", desc: "Pure peer-to-peer exchange.", color: "from-purple-600 to-pink-900" },
  { id: 3, title: "Zero-Log Browser", desc: "No traces. No history.", color: "from-emerald-600 to-teal-900" },
  { id: 4, title: "Cyber Security Audit", desc: "Protect your digital ghost.", color: "from-orange-600 to-red-900" },
];

export default function PromotionsPage() {
  const [activeAds, setActiveAds] = useState([AD_BANNERS[0]]);
  
  const addNextPromotion = () => {
    // Cycles through the array or adds random ones
    const nextAd = AD_BANNERS[activeAds.length % AD_BANNERS.length];
    // Create a unique instance of the ad
    setActiveAds([...activeAds, { ...nextAd, id: Date.now() }]);
    
    // Smooth scroll to bottom
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="min-h-screen w-full bg-[#050505] text-zinc-100 font-sans selection:bg-red-500/30">
      
      {/* HEADER */}
      <div className="max-w-4xl mx-auto px-6 pt-12 pb-8 border-b border-white/5">
        <div className="flex items-center gap-4 mb-2">
          <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/20">
            <Megaphone className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h1 className="text-3xl font-black italic uppercase tracking-tighter">Sponsor Deck</h1>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em]">Encrypted Feed</p>
          </div>
        </div>
      </div>

      {/* AD FEED */}
      <main className="max-w-4xl mx-auto px-6 py-10 space-y-6">
        <AnimatePresence mode="popLayout">
          {activeAds.map((ad, idx) => (
            <motion.div
              key={ad.id}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className={cn(
                "relative group overflow-hidden rounded-[2rem] border border-white/5 bg-zinc-900/20 p-8 flex flex-col sm:flex-row items-center justify-between gap-6",
                "hover:border-white/10 transition-all duration-500"
              )}
            >
              {/* Background Glow */}
              <div className={cn("absolute inset-0 bg-gradient-to-r opacity-5 group-hover:opacity-10 transition-opacity", ad.color)} />
              
              <div className="relative z-10 flex items-center gap-6">
                <div className={cn("w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center shrink-0 shadow-2xl", ad.color)}>
                  <ShieldAlert className="text-white w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase italic tracking-tight">{ad.title}</h3>
                  <p className="text-zinc-500 text-sm font-medium">{ad.desc}</p>
                </div>
              </div>

              <button className="relative z-10 px-8 py-4 bg-white text-black rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-500 hover:text-white transition-all active:scale-95 shrink-0">
                Access Node
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* ADD NEXT BUTTON */}
        <div className="py-10 flex flex-col items-center gap-4">
          <button 
            onClick={addNextPromotion}
            className="group flex flex-col items-center gap-2 text-zinc-600 hover:text-white transition-colors"
          >
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Next Frequency</span>
            <div className="p-4 rounded-full border border-white/5 group-hover:border-red-500/50 group-hover:bg-red-500/10 transition-all">
              <ChevronDown className="w-6 h-6 animate-bounce" />
            </div>
          </button>
        </div>

        <hr className="border-white/5 my-20" />

        {/* BOTTOM CALL TO ACTION */}
        <section className="grid sm:grid-cols-2 gap-6 pb-20">
          {/* ORG PROMOTION */}
          <div className="bg-zinc-900/40 border border-white/5 rounded-[2.5rem] p-8 flex flex-col justify-between items-start gap-8">
            <div>
              <Rocket className="text-red-500 w-10 h-10 mb-4" />
              <h4 className="text-xl font-black uppercase italic tracking-tighter">Promote Your Org</h4>
              <p className="text-zinc-500 text-xs leading-relaxed mt-2">
                Gain instant visibility. Your banner will be broadcasted to thousands of anonymous nodes globally.
              </p>
            </div>
            <button className="w-full py-4 bg-zinc-800 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all">
              Contact Admin
            </button>
          </div>

          {/* DISCORD SYNC */}
          <div className="bg-[#5865F2]/5 border border-[#5865F2]/20 rounded-[2.5rem] p-8 flex flex-col justify-between items-start gap-8">
            <div>
              <MessageCircle className="text-[#5865F2] w-10 h-10 mb-4" />
              <h4 className="text-xl font-black uppercase italic tracking-tighter">Official Discord</h4>
              <p className="text-zinc-500 text-xs leading-relaxed mt-2">
                Join the underground network. Chat with the devs and the community in real-time.
              </p>
            </div>
            <a 
              href="https://discord.gg/E5pGCkSB" 
              target="_blank"
              className="w-full py-4 bg-[#5865F2] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all text-center flex items-center justify-center gap-2"
            >
              Enter Hub <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </section>
      </main>

      {/* FOOTER PADDING FOR MOBILE */}
      <div className="h-20" />
    </div>
  );
}