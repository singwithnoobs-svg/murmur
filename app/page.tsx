"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, RefreshCw, Hash, Users, MessageSquare, Globe, MessageCircle, X } from "lucide-react";
import Navbar from "@/components/Navbar";

const prefixes = ["Neon","Void","Silent","Dark","Solar","Lunar","Ghost","Cyber","Static","Crimson","Quantum","Hidden","Obsidian","Frozen","Infinite","Echo","Nova","Shadow","Digital","Zero"];
const cores = ["Phantom","Cipher","Oracle","Specter","Runner","Signal","Apex","Pulse","Drift","Vector","Nexus","Warp","Flux","Vortex","Kernel","Node","Logic","Protocol","Entity","Core"];
const suffixes = ["Prime","Alpha","Omega","X","Z","Mk","EX","ULTRA","Void","One","Null","Origin","Edge"];

export default function LandingPage() {
  const [name, setName] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Generate identity and sync with session storage
  const generateIdentity = () => {
    const p = prefixes[Math.floor(Math.random() * prefixes.length)];
    const c = cores[Math.floor(Math.random() * cores.length)];
    const s = suffixes[Math.floor(Math.random() * suffixes.length)];
    const number = Math.floor(Math.random() * 100).toString().padStart(2,"0");
    const identity = `${p}${c}${s}${number}`;
    setName(identity);
    sessionStorage.setItem("murmur_nickname", identity);
  };

  useEffect(() => { 
    // Only generate if we don't already have one, or force new one on first load
    generateIdentity(); 
  }, []);

  // HANDSHAKE LOGIC: Preserves the invite ID during redirection
  const handleProtocolSelection = (path: string) => {
    // Ensure the current name is locked in
    sessionStorage.setItem("murmur_nickname", name);
    
    const inviteId = searchParams.get("id");

    if (inviteId && path === "/lobby") {
      // Direct handshake to the private room
      router.push(`/lobby?id=${inviteId}`);
    } else {
      // Standard navigation
      router.push(path);
    }
  };

  const menuOptions = [
    { name: "Random Chat", icon: <Hash className="w-5 h-5" />, path: "/matching", desc: "Instant match with a stranger" },
    { name: "Chat with Friends", icon: <Users className="w-5 h-5" />, path: "/lobby", desc: "Private rooms via invite link" },
    { name: "Global Chat Rooms", icon: <Globe className="w-5 h-5" />, path: "/lobby", desc: "Public frequencies" },
    { name: "Community Forum", icon: <MessageSquare className="w-5 h-5" />, path: "/forum", desc: "Permanent discussions" },
  ];

  return (
    <div className="h-screen w-full bg-zinc-950 text-zinc-100 selection:bg-purple-500/30 overflow-hidden flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-6 relative">
        <div className="max-w-xl w-full mx-auto text-center space-y-12">
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <p className="text-zinc-500 font-bold uppercase tracking-[0.3em] text-xs">
              No Logs • No Accounts • Pure Anonymity
            </p>
            {searchParams.get("id") && (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }}
                className="inline-block px-4 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-black uppercase tracking-widest"
              >
                Invite Link Detected
              </motion.div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl backdrop-blur-sm shadow-2xl"
          >
            <label className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-600 block mb-3 text-left ml-2">
              Your Temporary Ghost ID
            </label>
            <div className="flex items-center gap-3 bg-black border border-zinc-800 p-4 rounded-2xl group transition-all focus-within:border-purple-500/50">
              <span className="text-2xl font-mono text-purple-400 font-bold flex-1 tracking-tighter">
                {name}
              </span>
              <button
                onClick={generateIdentity}
                className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-500 transition-all active:rotate-180 duration-500"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </motion.div>

          <div className="flex flex-col gap-4">
            <button
              onClick={() => setIsMenuOpen(true)}
              className="w-full py-6 rounded-2xl bg-white text-black font-black text-sm uppercase tracking-[0.2em] hover:bg-zinc-200 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)]"
            >
              Start Chatting
            </button>

            <a 
              href="https://discord.gg/yourlink" 
              target="_blank"
              className="flex items-center justify-center gap-3 py-4 rounded-2xl bg-[#5865F2]/10 border border-[#5865F2]/20 text-[#5865F2] font-black text-xs uppercase tracking-widest hover:bg-[#5865F2]/20 transition-all active:scale-95"
            >
              <MessageCircle className="w-4 h-4" /> Join Discord Community
            </a>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl"
            >
              <div className="p-8 border-b border-zinc-800 flex justify-between items-center">
                <h3 className="text-xl font-black uppercase tracking-tighter italic">Select Protocol</h3>
                <button 
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 hover:bg-zinc-800 rounded-full text-zinc-500 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-4 grid gap-3">
                {menuOptions.map((opt) => (
                  <button
                    key={opt.name}
                    onClick={() => handleProtocolSelection(opt.path)}
                    className="flex items-center gap-5 p-5 rounded-3xl hover:bg-white hover:text-black group transition-all text-left border border-transparent hover:border-white"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                      {opt.icon}
                    </div>
                    <div>
                      <div className="font-black uppercase text-sm tracking-widest">{opt.name}</div>
                      <div className="text-xs text-zinc-500 group-hover:text-black/60 font-medium">{opt.desc}</div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="p-8 bg-zinc-950/50 text-center">
                <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                  Encryption Layer Active • All sessions ephemeral
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
