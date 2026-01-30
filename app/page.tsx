"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Shield, Zap, Lock, RefreshCw, Hash, Users, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { cn } from "@/lib/utils";

// WORD TABLES FOR GHOST IDENTITY
const adjectives = ["Good", "Dark", "Silent", "Ghost", "Swift", "Coded", "Hidden", "Shadow", "Neon", "Void", "Cyber", "Static", "Zenith", "Lunar", "Bitter", "Solar", "Cold", "Vivid", "Deep", "Lost"];
const nouns = ["Man", "Walker", "Echo", "Ghost", "Signal", "Node", "Runner", "Soul", "Viper", "Phantom", "Cipher", "Vector", "Logic", "Pulse", "Warp", "Apex", "Flow", "Zero", "Core", "Drift"];
const chars = ["!", "@", "#", "$", "*", "?", "+"];

export default function LandingPage() {
  const [name, setName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [countdown, setCountdown] = useState(15);
  const [targetPath, setTargetPath] = useState("");
  const router = useRouter();

  // ADSTERRA CONFIG
  const ADSTERRA_URL = "https://www.effectivegatecpm.com/qmd8u98s9?key=ca5fd57da3525204f3ef5c06fcc245cd";

  const generateIdentity = () => {
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const num = Math.floor(10 + Math.random() * 90); 
    const char = chars[Math.floor(Math.random() * chars.length)];
    setName(`${adj}${noun}${num}${char}`);
  };

  useEffect(() => {
    generateIdentity();
  }, []);

  // THE AD TRIGGER & TIMER LOGIC
  const triggerGateway = (path: string) => {
    // 1. Open the Adsterra Link
    window.open(ADSTERRA_URL, "_blank");

    // 2. Start the internal 15s wait UI
    setTargetPath(path);
    setIsProcessing(true);
    setCountdown(15);
    
    // Save identity immediately
    sessionStorage.setItem("murmur_nickname", name);

    let timer = 15;
    const interval = setInterval(() => {
      timer -= 1;
      setCountdown(timer);

      if (timer <= 0) {
        clearInterval(interval);
        router.push(path);
      }
    }, 1000);
  };

  return (
    <div className="h-[100dvh] bg-zinc-950 text-zinc-100 selection:bg-purple-500/30 overflow-hidden flex flex-col">
      <Navbar />

      <main className="flex-1 overflow-y-auto pt-32 pb-20 px-6 no-scrollbar">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Content */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
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

          {/* Right Card: Identity & Action */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl blur opacity-20"></div>
            <div className="relative bg-zinc-900 border border-zinc-800 p-8 md:p-12 rounded-3xl shadow-2xl">
              
              <div className="mb-10">
                <label className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-600 ml-1">Assigned Identity</label>
                <div className="flex items-center gap-3 mt-2 bg-zinc-950 border border-zinc-800 p-5 rounded-2xl group">
                  <span className="text-xl md:text-2xl font-mono text-purple-400 font-bold flex-1 tracking-tighter">{name}</span>
                  <button 
                    disabled={isProcessing}
                    onClick={generateIdentity} 
                    className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 transition-colors disabled:opacity-20"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* ACTION BUTTONS WITH AD LOGIC */}
              <div className="space-y-4">
                <button
                  onClick={() => triggerGateway("/matching")}
                  disabled={isProcessing}
                  className={cn(
                    "w-full py-5 rounded-2xl font-black transition-all text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-3",
                    isProcessing && targetPath === "/matching"
                      ? "bg-zinc-800 text-purple-500 cursor-wait"
                      : "bg-white text-black hover:bg-zinc-200 active:scale-95"
                  )}
                >
                  {isProcessing && targetPath === "/matching" ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Node Syncing... {countdown}s
                    </>
                  ) : (
                    <>
                      <Hash className="w-4 h-4" /> Random Match
                    </>
                  )}
                </button>

                <button
                  onClick={() => triggerGateway("/lobby")}
                  disabled={isProcessing}
                  className={cn(
                    "w-full py-5 rounded-2xl font-black transition-all text-xs uppercase tracking-widest border flex items-center justify-center gap-3",
                    isProcessing && targetPath === "/lobby"
                      ? "bg-zinc-800 border-zinc-700 text-purple-500 cursor-wait"
                      : "bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800 active:scale-95"
                  )}
                >
                  {isProcessing && targetPath === "/lobby" ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Fetching Frequency... {countdown}s
                    </>
                  ) : (
                    <>
                      <Users className="w-4 h-4" /> Lobby / Private Room
                    </>
                  )}
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
    </div>
  );
}
