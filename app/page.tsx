"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Hash, Users, MessageSquare, Globe, X, Megaphone, Zap } from "lucide-react";
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
    <div className="min-h-screen w-full bg-zinc-950 text-zinc-100 selection:bg-purple-500/30 overflow-y-auto flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12 relative">
        <div className="max-w-xl w-full mx-auto text-center space-y-10">
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <p className="text-zinc-500 font-black uppercase tracking-[0.4em] text-[10px]">
              Encrypted • Anonymous • Instant
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
            className="bg-zinc-900/30 border border-white/5 p-4 sm:p-6 rounded-[2.5rem] backdrop-blur-md relative group"
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-zinc-950 border border-white/10 px-4 py-1 rounded-full">
              <span className="text-[9px] uppercase tracking-[0.2em] font-black text-zinc-500">
                Ghost Identity
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 bg-black/40 border border-white/5 p-4 rounded-3xl mt-2">
              <div className="flex flex-col text-left overflow-hidden">
                <span className="text-2xl sm:text-3xl font-mono text-white font-bold tracking-tighter truncate">
                  {name}
                </span>
                <span className="text-[8px] text-zinc-600 uppercase font-black tracking-widest mt-1">Temporary Frequency Assigned</span>
              </div>
              <button
                onClick={generateIdentity}
                className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-purple-500 transition-all active:rotate-180 duration-500 shrink-0 border border-white/5"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </motion.div>

          <div className="flex flex-col items-center gap-6">
            {/* LARGE HERO BUTTON */}
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: "0 0 40px rgba(168, 85, 247, 0.2)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsMenuOpen(true)}
              className="w-full py-8 sm:py-10 rounded-[2.5rem] bg-white text-black font-black text-lg sm:text-xl uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-4 relative overflow-hidden group"
            >
              <Zap className="w-6 h-6 fill-black group-hover:animate-pulse" />
              Start Chatting
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </motion.button>

            {/* SECONDARY ACTION */}
            <button
              onClick={() => router.push('/promotions')}
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-zinc-900/50 border border-white/5 text-zinc-500 font-black text-[9px] uppercase tracking-[0.2em] hover:text-white hover:bg-zinc-800 transition-all"
            >
              <Megaphone className="w-3 h-3" /> Contact Team & Support
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
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-6 bg-black/95 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 40 }}
              className="bg-zinc-900 border border-white/10 w-full max-w-lg rounded-[3rem] overflow-hidden shadow-2xl mb-4 sm:mb-0"
            >
              <div className="p-8 border-b border-white/5 flex justify-between items-center bg-zinc-900/50">
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tighter italic text-white leading-none">Protocols</h3>
                  <p className="text-[9px] text-zinc-500 uppercase tracking-widest mt-2 font-black">Select Transmission Mode</p>
                </div>
                <button 
                  onClick={() => setIsMenuOpen(false)}
                  className="p-3 bg-white/5 hover:bg-red-500/20 hover:text-red-500 rounded-full text-zinc-500 transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-4 grid gap-3 max-h-[60vh] overflow-y-auto no-scrollbar">
                {menuOptions.map((opt) => (
                  <button
                    key={opt.name}
                    onClick={() => handleProtocolSelection(opt.path)}
                    className="flex items-center gap-5 p-5 rounded-[2rem] hover:bg-white hover:text-black group transition-all text-left border border-white/5 hover:border-white shadow-lg"
                  >
                    <div className="w-14 h-14 shrink-0 rounded-2xl bg-zinc-800 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                      {opt.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-black uppercase text-sm tracking-widest">{opt.name}</div>
                      <div className="text-xs text-zinc-500 group-hover:text-black/60 font-bold mt-1 uppercase tracking-tighter">{opt.desc}</div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="p-8 text-center bg-black/20">
                <p className="text-[8px] text-zinc-700 font-black uppercase tracking-[0.4em]">
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
