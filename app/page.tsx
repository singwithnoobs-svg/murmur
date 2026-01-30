"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import AdsterraBanner from "@/components/AdsterraBanner";
import { Shield, Zap, Lock, RefreshCw, Hash, Users } from "lucide-react";
import Navbar from "@/components/Navbar";
import { cn } from "@/lib/utils";

/* =========================
   ADVANCED IDENTITY WORD BANK
   ========================= */
const prefixes = [
  "Neon", "Void", "Silent", "Dark", "Solar", "Lunar", "Ghost",
  "Cyber", "Static", "Crimson", "Quantum", "Hidden", "Obsidian",
  "Frozen", "Infinite", "Echo", "Nova", "Shadow", "Digital", "Zero"
];

const cores = [
  "Phantom", "Cipher", "Oracle", "Specter", "Runner", "Signal",
  "Apex", "Pulse", "Drift", "Vector", "Nexus", "Warp", "Flux",
  "Vortex", "Kernel", "Node", "Logic", "Protocol", "Entity", "Core"
];

const suffixes = [
  "Prime", "Alpha", "Omega", "X", "Z", "Mk", "EX", "ULTRA",
  "Void", "One", "Null", "Origin", "Edge"
];
/* ========================= */

export default function LandingPage() {
  const [name, setName] = useState("");
  const router = useRouter();

  const generateIdentity = () => {
    const p = prefixes[Math.floor(Math.random() * prefixes.length)];
    const c = cores[Math.floor(Math.random() * cores.length)];
    const s = suffixes[Math.floor(Math.random() * suffixes.length)];

    const number = Math.floor(Math.random() * 100).toString().padStart(2, "0");
    const identity = `${p}${c}${s}${number}`;
    setName(identity);

    sessionStorage.setItem("murmur_nickname", identity);
  };

  useEffect(() => {
    generateIdentity();
  }, []);

  return (
    <div className="h-[100dvh] bg-zinc-950 text-zinc-100 overflow-hidden flex flex-col">
      <Navbar />

      <main className="flex-1 overflow-y-auto pt-32 pb-20 px-6 no-scrollbar">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">

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
                <span className="text-xs font-bold uppercase tracking-wider">
                  Anonymous
                </span>
              </div>
              <div className="flex gap-3 items-center text-zinc-500">
                <Lock className="text-purple-500 w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Ephemeral
                </span>
              </div>
            </div>
          </motion.div>

          {/* RIGHT CARD */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl blur opacity-20" />

            <div className="relative bg-zinc-900 border border-zinc-800 p-8 md:p-12 rounded-3xl shadow-2xl">

              {/* IDENTITY */}
              <div className="mb-10">
                <label className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-600 ml-1">
                  Assigned Identity
                </label>

                <div className="flex items-center gap-3 mt-2 bg-zinc-950 border border-zinc-800 p-5 rounded-2xl">
                  <span className="text-xl md:text-2xl font-mono text-purple-400 font-bold flex-1 tracking-tight">
                    {name}
                  </span>

                  <button
                    onClick={generateIdentity}
                    className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 transition-colors"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="space-y-4">
                <button
                  onClick={() => router.push("/matching")}
                  className={cn(
                    "w-full py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-3",
                    "bg-white text-black hover:bg-zinc-200 active:scale-95"
                  )}
                >
                  <Hash className="w-4 h-4" /> Random Match
                </button>

                <button
                  onClick={() => router.push("/lobby")}
                  className={cn(
                    "w-full py-5 rounded-2xl font-black text-xs uppercase tracking-widest border flex items-center justify-center gap-3",
                    "bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800 active:scale-95"
                  )}
                >
                  <Users className="w-4 h-4" /> Lobby / Private Room
                </button>
              </div>

              <div className="mt-8 pt-6 border-t border-zinc-800/50 flex justify-between items-center text-[9px] text-zinc-600 font-bold uppercase tracking-[0.2em]">
                <span>Status: Encrypted</span>
                <span className="text-purple-900">v3.1.0</span>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* =====================
          CENTERED ADSTERAA BANNER
          ===================== */}
      <div className="flex justify-center py-4">
        <AdsterraBanner
          adKey="fa3453ae0f13be3b5ba238031d224e99"
          width={300}
          height={250}
        />
      </div>
    </div>
  );
}
