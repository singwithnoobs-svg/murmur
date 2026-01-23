"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Users, Zap, ArrowRight, Shield, Globe } from "lucide-react";

export default function ModeSelection() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");

  useEffect(() => {
    const saved = sessionStorage.getItem("murmur_nickname");
    if (!saved) return router.push("/");
    setNickname(saved);
  }, [router]);

  return (
    <div className="h-[100dvh] bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-6 font-sans overflow-hidden">
      <div className="w-full max-w-2xl space-y-12">
        
        <header className="text-center space-y-4">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-5xl font-black tracking-tighter uppercase italic">Select Protocol</h1>
            <p className="text-zinc-500 font-bold tracking-[0.3em] text-[10px]">OPERATOR: {nickname}</p>
          </motion.div>
        </header>

        <div className="grid md:grid-cols-2 gap-6">
          {/* OPTION 1: CHAT ROOMS (LOBBY) */}
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push("/lobby")}
            className="group relative bg-zinc-900 border border-zinc-800 p-8 rounded-[2.5rem] text-left hover:border-purple-500/50 transition-all shadow-2xl overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <Globe className="w-32 h-32" />
            </div>
            
            <div className="w-14 h-14 bg-purple-600/10 rounded-2xl flex items-center justify-center mb-6 border border-purple-500/20">
              <Users className="w-7 h-7 text-purple-500" />
            </div>
            <h3 className="text-2xl font-black mb-2 uppercase italic tracking-tight">Social Grid</h3>
            <p className="text-zinc-500 text-sm leading-relaxed mb-8">Join public frequencies or create private encrypted rooms for groups.</p>
            <div className="flex items-center gap-2 text-purple-400 text-xs font-black uppercase tracking-widest">
              Enter Lobby <ArrowRight className="w-4 h-4" />
            </div>
          </motion.button>

          {/* OPTION 2: RANDOM MATCHING */}
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push("/matching")}
            className="group relative bg-zinc-900 border border-zinc-800 p-8 rounded-[2.5rem] text-left hover:border-blue-500/50 transition-all shadow-2xl overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <Zap className="w-32 h-32" />
            </div>

            <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center mb-6 border border-blue-500/20">
              <Zap className="w-7 h-7 text-blue-500" />
            </div>
            <h3 className="text-2xl font-black mb-2 uppercase italic tracking-tight">Instant Link</h3>
            <p className="text-zinc-500 text-sm leading-relaxed mb-8">One-on-one encrypted matching with a random active operator.</p>
            <div className="flex items-center gap-2 text-blue-400 text-xs font-black uppercase tracking-widest">
              Start Matching <ArrowRight className="w-4 h-4" />
            </div>
          </motion.button>
        </div>

        <footer className="flex justify-center gap-8 pt-8">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-zinc-700" />
            <span className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest">End-to-End Secure</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest">System Online</span>
          </div>
        </footer>

      </div>
    </div>
  );
}