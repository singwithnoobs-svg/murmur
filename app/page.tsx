"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Hash, Users, MessageSquare, Globe, X, Megaphone, Zap, ShieldCheck } from "lucide-react";
import Navbar from "@/components/Navbar";

const prefixes = ["Neon","Void","Silent","Dark","Solar","Lunar","Ghost","Cyber","Static","Crimson","Quantum","Hidden","Obsidian","Frozen","Infinite","Echo","Nova","Shadow","Digital","Zero"];
const cores = ["Phantom","Cipher","Oracle","Specter","Runner","Signal","Apex","Pulse","Drift","Vector","Nexus","Warp","Flux","Vortex","Kernel","Node","Logic","Protocol","Entity","Core"];
const suffixes = ["Prime","Alpha","Omega","X","Z","Mk","EX","ULTRA","Void","One","Null","Origin","Edge"];

export default function LandingPage() {
  const [name, setName] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const generateIdentity = () => {
    const p = prefixes[Math.floor(Math.random() * prefixes.length)];
    const c = cores[Math.floor(Math.random() * cores.length)];
    const s = suffixes[Math.floor(Math.random() * suffixes.length)];
    const number = Math.floor(Math.random() * 100).toString().padStart(2,"0");
    const identity = `${p}${c}${s}${number}`;
    setName(identity);
    sessionStorage.setItem("murmur_nickname", identity);
    return identity;
  };

  useEffect(() => { 
    const currentName = generateIdentity(); 
    const inviteId = searchParams.get("id");
    if (inviteId) {
      sessionStorage.setItem("murmur_nickname", currentName);
      router.push(`/lobby?id=${inviteId}`);
    }
  }, [searchParams, router]);

  const handleProtocolSelection = (path: string) => {
    sessionStorage.setItem("murmur_nickname", name);
    const inviteId = searchParams.get("id");
    if (inviteId && path === "/lobby") {
      router.push(`/lobby?id=${inviteId}`);
    } else {
      router.push(path);
    }
  };

  const menuOptions = [
    { name: "Random Chat", icon: <Hash className="w-5 h-5" />, path: "/matching", desc: "Instant match with a stranger" },
    { name: "Chat with Friends", icon: <Users className="w-5 h-5" />, path: "/lobby", desc: "Private rooms via invite link" },
    { name: "Global Chat Rooms", icon: <Globe className="w-5 h-5" />, path: "/livechat", desc: "Public frequencies" },
    { name: "Community Polls", icon: <MessageSquare className="w-5 h-5" />, path: "/polls", desc: "Permanent discussions" },
  ];

  return (
    <div className="min-h-screen w-full bg-[#030005] text-zinc-100 selection:bg-purple-500/30 overflow-y-auto flex flex-col relative">
      
      {/* ATMOSPHERIC BACKGROUND ELEMENTS */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {/* Deep Purple Radial Glow */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-900/20 blur-[120px] rounded-full opacity-60" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-900/20 blur-[140px] rounded-full opacity-40" />
        
        {/* Animated Center Bloom */}
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3] 
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[50%] bg-purple-600/5 blur-[120px] rounded-full"
        />
      </div>

      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12 relative z-10">
        <div className="max-w-xl w-full mx-auto text-center space-y-10">
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
                <ShieldCheck className="w-3 h-3 text-purple-400" />
                <p className="text-purple-400/80 font-black uppercase tracking-[0.5em] text-[9px]">
                    Encrypted • Anonymous • Instant
                </p>
            </div>
            {searchParams.get("id") && (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }}
                className="inline-block px-4 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[10px] font-black uppercase tracking-widest backdrop-blur-sm"
              >
                Syncing with Invite: {searchParams.get("id")}
              </motion.div>
            )}
          </motion.div>

          {/* IDENTITY CARD */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900/40 border border-white/10 p-5 sm:p-7 rounded-[2.5rem] backdrop-blur-xl relative group shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#12051a] border border-purple-500/30 px-5 py-1 rounded-full shadow-lg">
              <span className="text-[10px] uppercase tracking-[0.3em] font-black text-purple-300">
                Ghost Identity
              </span>
            </div>

            <div className="flex items-center justify-between gap-4 bg-black/40 border border-white/5 p-5 rounded-3xl mt-2 transition-all group-hover:border-purple-500/20">
              <div className="flex flex-col text-left overflow-hidden">
                <span className="text-2xl sm:text-4xl font-mono text-white font-bold tracking-tighter truncate drop-shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                  {name}
                </span>
                <span className="text-[8px] text-zinc-500 uppercase font-black tracking-[0.2em] mt-1.5 flex items-center gap-2">
                    <span className="w-1 h-1 bg-purple-500 rounded-full animate-pulse" />
                    Temporary Node Active
                </span>
              </div>
              <button
                onClick={generateIdentity}
                className="p-4 bg-white/5 hover:bg-purple-500 hover:text-white rounded-2xl text-purple-400 transition-all active:rotate-180 duration-500 shrink-0 border border-white/5"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </motion.div>

          <div className="flex flex-col items-center gap-8">
            {/* LARGE HERO BUTTON */}
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: "0 0 50px rgba(168, 85, 247, 0.25)" }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setIsMenuOpen(true)}
              className="w-full py-9 sm:py-11 rounded-[2.5rem] bg-white text-black font-black text-xl sm:text-2xl uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-4 relative overflow-hidden group shadow-2xl"
            >
              <Zap className="w-6 h-6 fill-black group-hover:scale-125 transition-transform" />
              Start Chatting
              {/* Subtle shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </motion.button>

            {/* CONTACT TEAM ACTION */}
            <button
              onClick={() => router.push('/promotions')}
              className="flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-white/5 border border-white/5 text-zinc-400 font-black text-[10px] uppercase tracking-[0.3em] hover:text-purple-300 hover:bg-purple-500/10 hover:border-purple-500/20 transition-all backdrop-blur-sm"
            >
              <Megaphone className="w-3.5 h-3.5" /> Contact Team & Support
            </button>
          </div>
        </div>
      </main>

      {/* MENU MODAL */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-6 bg-[#030005]/95 backdrop-blur-2xl"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 40 }}
              className="bg-zinc-900 border border-white/10 w-full max-w-lg rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(168,85,247,0.15)] mb-4 sm:mb-0"
            >
              <div className="p-9 border-b border-white/5 flex justify-between items-center bg-zinc-900/50">
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tighter italic text-white leading-none">Protocols</h3>
                  <p className="text-[10px] text-purple-400 uppercase tracking-[0.3em] mt-2.5 font-black">Select Transmission Mode</p>
                </div>
                <button 
                  onClick={() => setIsMenuOpen(false)}
                  className="p-3 bg-white/5 hover:bg-red-500/20 hover:text-red-500 rounded-full text-zinc-500 transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-5 grid gap-4 max-h-[60vh] overflow-y-auto no-scrollbar">
                {menuOptions.map((opt) => (
                  <button
                    key={opt.name}
                    onClick={() => handleProtocolSelection(opt.path)}
                    className="flex items-center gap-6 p-6 rounded-[2.2rem] hover:bg-white hover:text-black group transition-all text-left border border-white/5 hover:border-white shadow-xl"
                  >
                    <div className="w-16 h-16 shrink-0 rounded-2xl bg-zinc-800 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                      {opt.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-black uppercase text-[15px] tracking-widest">{opt.name}</div>
                      <div className="text-[11px] text-zinc-500 group-hover:text-black/60 font-bold mt-1 uppercase tracking-tighter">{opt.desc}</div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="p-8 text-center bg-black/40">
                <p className="text-[9px] text-zinc-600 font-black uppercase tracking-[0.5em]">
                  Secure Peer-to-Peer Tunnel Active 
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
