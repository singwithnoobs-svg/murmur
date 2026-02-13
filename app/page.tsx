"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Hash, Users, MessageSquare, Globe, MessageCircle, X, Megaphone } from "lucide-react";
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
    // CHANGED: h-screen to min-h-screen and overflow-hidden to overflow-y-auto to fix scrolling
    <div className="min-h-screen w-full bg-zinc-950 text-zinc-100 selection:bg-purple-500/30 overflow-y-auto flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12 relative">
        <div className="max-w-xl w-full mx-auto text-center space-y-8">
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <p className="text-zinc-500 font-bold uppercase tracking-[0.3em] text-[10px] sm:text-xs">
              No Logs • No Accounts • Pure Anonymity
            </p>
            {searchParams.get("id") && (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }}
                className="inline-block px-4 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-black uppercase tracking-widest"
              >
                Syncing with Invite: {searchParams.get("id")}
              </motion.div>
            )}
          </motion.div>

          {/* IDENTITY CARD */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900/50 border border-zinc-800 p-4 sm:p-6 rounded-[2rem] backdrop-blur-sm shadow-2xl"
          >
            <label className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-600 block mb-3 text-left ml-2">
              Your Temporary Ghost ID
            </label>
            <div className="flex items-center justify-between gap-3 bg-black border border-zinc-800 p-3 sm:p-4 rounded-2xl group transition-all focus-within:border-purple-500/50 overflow-hidden">
              <span className="text-lg sm:text-2xl font-mono text-purple-400 font-bold tracking-tighter break-all text-left flex-1 min-w-0 leading-tight">
                {name}
              </span>
              <button
                onClick={generateIdentity}
                className="p-3 bg-zinc-900 hover:bg-zinc-800 rounded-xl text-zinc-500 transition-all active:rotate-180 duration-500 shrink-0 border border-zinc-800"
              >
                <RefreshCw className="w-4 h-4 sm:w-5 h-5" />
              </button>
            </div>
          </motion.div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => setIsMenuOpen(true)}
              className="w-full py-5 sm:py-6 rounded-2xl bg-white text-black font-black text-xs sm:text-sm uppercase tracking-[0.2em] hover:bg-zinc-200 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)]"
            >
              Start Chatting
            </button>

            <a 
              href="https://discord.gg/E5pGCkSB" 
              target="_blank"
              className="flex items-center justify-center gap-3 py-4 rounded-2xl bg-[#5865F2]/10 border border-[#5865F2]/20 text-[#5865F2] font-black text-[10px] uppercase tracking-widest hover:bg-[#5865F2]/20 transition-all active:scale-95"
            >
              <MessageCircle className="w-4 h-4" /> Join Discord
            </a>

            {/* NEW PROMOTIONS BUTTON */}
            <button
              onClick={() => router.push('/promotions')}
              className="flex items-center justify-center gap-3 py-4 rounded-2xl bg-red-500/5 border border-red-500/10 text-red-500/80 font-black text-[10px] uppercase tracking-widest hover:bg-red-500/10 transition-all active:scale-95"
            >
              <Megaphone className="w-4 h-4" /> Promotions & Sponsors
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
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 40 }}
              className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl mb-4 sm:mb-0"
            >
              <div className="p-6 sm:p-8 border-b border-zinc-800 flex justify-between items-center">
                <h3 className="text-lg sm:text-xl font-black uppercase tracking-tighter italic">Select Protocol</h3>
                <button 
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 hover:bg-zinc-800 rounded-full text-zinc-500 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-3 sm:p-4 grid gap-2 sm:gap-3 max-h-[60vh] overflow-y-auto no-scrollbar">
                {menuOptions.map((opt) => (
                  <button
                    key={opt.name}
                    onClick={() => handleProtocolSelection(opt.path)}
                    className="flex items-center gap-4 sm:gap-5 p-4 sm:p-5 rounded-[1.5rem] sm:rounded-3xl hover:bg-white hover:text-black group transition-all text-left border border-transparent hover:border-white"
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-xl sm:rounded-2xl bg-zinc-800 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                      {opt.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-black uppercase text-[11px] sm:text-sm tracking-widest truncate">{opt.name}</div>
                      <div className="text-[10px] sm:text-xs text-zinc-500 group-hover:text-black/60 font-medium line-clamp-1">{opt.desc}</div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="p-6 sm:p-8 bg-zinc-950/50 text-center">
                <p className="text-[9px] sm:text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                  Safety Layer Active 
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
