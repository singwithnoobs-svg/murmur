"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Shield, Zap, Lock, RefreshCw, Hash, Users } from "lucide-react";
import Navbar from "@/components/Navbar";

const prefixes = ["Neon","Void","Silent","Dark","Solar","Lunar","Ghost","Cyber","Static","Crimson","Quantum","Hidden","Obsidian","Frozen","Infinite","Echo","Nova","Shadow","Digital","Zero"];
const cores = ["Phantom","Cipher","Oracle","Specter","Runner","Signal","Apex","Pulse","Drift","Vector","Nexus","Warp","Flux","Vortex","Kernel","Node","Logic","Protocol","Entity","Core"];
const suffixes = ["Prime","Alpha","Omega","X","Z","Mk","EX","ULTRA","Void","One","Null","Origin","Edge"];

export default function LandingPage() {
  const [name, setName] = useState("");
  const router = useRouter();

  const generateIdentity = () => {
    const p = prefixes[Math.floor(Math.random() * prefixes.length)];
    const c = cores[Math.floor(Math.random() * cores.length)];
    const s = suffixes[Math.floor(Math.random() * suffixes.length)];
    const number = Math.floor(Math.random() * 100).toString().padStart(2,"0");
    const identity = `${p}${c}${s}${number}`;
    setName(identity);
    sessionStorage.setItem("murmur_nickname", identity);
  };

  useEffect(() => { generateIdentity(); }, []);

  return (
    <div className="h-screen w-full bg-zinc-950 text-zinc-100 selection:bg-purple-500/30 overflow-y-auto flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center py-20 px-6">
        <div className="max-w-7xl w-full mx-auto grid lg:grid-cols-2 gap-16 items-center">

          {/* LEFT SIDE */}
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
              No registration. Assigned identities. Vanish without a trace.
            </p>

            <div className="grid grid-cols-2 gap-6 pt-4">
              <div className="flex gap-3 items-center text-zinc-500">
                <Shield className="text-purple-500 w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Anonymous</span>
              </div>
              <div className="flex gap-3 items-center text-zinc-500">
                <Lock className="text-purple-500 w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Ephemeral</span>
              </div>
            </div>
          </motion.div>

          {/* RIGHT SIDE CARD */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl blur opacity-20 pointer-events-none" />

            <div className="relative bg-zinc-900 border border-zinc-800 p-8 md:p-12 rounded-3xl shadow-2xl">
              <div className="mb-10">
                <label className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-600 ml-1">
                  Assigned Identity
                </label>
                <div className="flex items-center gap-3 mt-2 bg-zinc-950 border border-zinc-800 p-5 rounded-2xl group">
                  <span className="text-xl md:text-2xl font-mono text-purple-400 font-bold flex-1 tracking-tight">
                    {name}
                  </span>
                  <button
                    onClick={generateIdentity}
                    className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 transition-all active:rotate-180 duration-500"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => router.push("/matching")}
                  className="w-full py-5 rounded-2xl bg-white text-black font-black flex items-center justify-center gap-3 text-xs uppercase tracking-widest hover:bg-zinc-200 active:scale-95 transition-all"
                >
                  <Hash className="w-4 h-4" /> Random Match
                </button>

                <button
                  onClick={() => router.push("/lobby")}
                  className="w-full py-5 rounded-2xl bg-zinc-900 border border-zinc-800 text-white font-black flex items-center justify-center gap-3 text-xs uppercase tracking-widest hover:bg-zinc-800 active:scale-95 transition-all"
                >
                  <Users className="w-4 h-4" /> Lobby / Private Room
                </button>
              </div>

              <div className="mt-8 pt-6 border-t border-zinc-800/50 flex justify-between items-center text-[9px] text-zinc-600 font-bold uppercase tracking-[0.2em]">
                <span>Status: Encrypted</span>
                <span className="text-purple-900/50">v3.1.0</span>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
