"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Shield, Zap, Lock } from "lucide-react";
import Navbar from "@/components/Navbar";
import { cn } from "@/lib/utils";
import TermsModal from "@/components/TermsModal";

export default function LandingPage() {
  const [name, setName] = useState("");
  const [isRedirecting, setIsRedirecting] = useState(false);
  const router = useRouter();
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    // Open terms instead of redirecting immediately
    setIsTermsOpen(true);
  };

  const completeEntry = () => {
    setIsTermsOpen(false);
    setIsRedirecting(true);
    sessionStorage.setItem("murmur_nickname", name.trim());
    setTimeout(() => {
      router.push("/mode");
    }, 400);
  };

return (
    <div className="h-[100dvh] bg-zinc-950 text-zinc-100 selection:bg-purple-500/30 overflow-hidden flex flex-col">
      <Navbar />

      <main className="flex-1 overflow-y-auto pt-32 pb-20 px-6 no-scrollbar">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Side: Copy */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold tracking-widest uppercase">
              <Zap className="w-3 h-3" /> System Live
            </div>
            <h1 className="text-6xl md:text-7xl font-bold tracking-tight leading-[0.9]">
              Chat like a <span className="text-purple-500">ghost.</span>
            </h1>
            <p className="text-xl text-zinc-400 max-w-lg leading-relaxed">
              No accounts. No tracking. No logs. Whisper into the void and vanish without a trace.
            </p>
            
            <div className="grid grid-cols-2 gap-6 pt-4">
              <Feature icon={<Shield className="w-5 h-5" />} title="Private" desc="Encrypted Frequencies" />
              <Feature icon={<Lock className="w-5 h-5" />} title="Secure" desc="Ephemeral Storage" />
            </div>
          </motion.div>

          {/* Right Side: Start Chatting Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl blur opacity-20 transition duration-1000"></div>
            <div className="relative bg-zinc-900 border border-zinc-800 p-8 md:p-12 rounded-3xl shadow-2xl overflow-hidden">
              <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />

              <h2 className="text-2xl font-bold mb-6 italic tracking-tight uppercase">Identity Auth</h2>
              <form onSubmit={handleStart} className="space-y-6 relative z-10">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-600 ml-1">Assign Nickname</label>
                  <input
                    type="text"
                    placeholder="e.g. GhostWalker"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={15}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 focus:outline-none focus:border-purple-500/50 text-white transition-all text-[16px] placeholder:text-zinc-800 font-medium"
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={!name.trim() || isRedirecting}
                  className={cn(
                    "w-full py-5 rounded-2xl font-black flex items-center justify-center gap-3 transition-all text-sm uppercase tracking-widest shadow-xl active:scale-95",
                    name.trim() && !isRedirecting
                      ? "bg-purple-600 hover:bg-purple-500 text-white shadow-purple-900/40" 
                      : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                  )}
                >
                  {isRedirecting ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                      <Zap className="w-5 h-5" />
                    </motion.div>
                  ) : (
                    <>Initialize Protocol <ArrowRight className="w-5 h-5" /></>
                  )}
                </button>
              </form>
              <p className="text-center text-zinc-600 text-[10px] mt-6 font-bold uppercase tracking-widest">
                Protocol: Anonymous // Logs: Disabled
              </p>
            </div>
          </motion.div>
        </div>
      </main>

      {/* MODAL PLACED HERE - Outside of main content, rendered once */}
      <TermsModal isOpen={isTermsOpen} onClose={completeEntry} />
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="flex gap-4 items-start group">
      <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-purple-500 group-hover:border-purple-500/30 transition-colors shadow-inner">
        {icon}
      </div>
      <div>
        <h3 className="font-bold text-sm text-zinc-200">{title}</h3>
        <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}


