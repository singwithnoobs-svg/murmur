"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RefreshCw, Hash, Users, MessageSquare, Globe, X, Megaphone, Zap, ShieldCheck } from "lucide-react";
import Navbar from "@/components/Navbar";

// Simplified Name Library
const prefixes = ["Neo", "Vox", "Zen", "Lux", "Nyx", "Sol", "Axe", "Bio", "Sky", "Net"];
const cores = ["Bit", "Vex", "Max", "Dot", "Ace", "Hub", "Zip", "Ray", "Mod", "Key"];
const suffixes = ["1", "X", "0", "Z", "V", "9", "A", "M", "Q", "P"];

export default function LandingPage() {
  const [name, setName] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const generateIdentity = () => {
    const p = prefixes[Math.floor(Math.random() * prefixes.length)];
    const c = cores[Math.floor(Math.random() * cores.length)];
    const s = suffixes[Math.floor(Math.random() * suffixes.length)];
    const identity = `${p}${c}${s}`; // Shorter, cleaner names
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
    { name: "Random Chat", icon: <Hash className="w-5 h-5" />, path: "/matching", desc: "Instant Match" },
    { name: "Private Chat", icon: <Users className="w-5 h-5" />, path: "/lobby", desc: "Via Invite Link" },
    { name: "Global Rooms", icon: <Globe className="w-5 h-5" />, path: "/livechat", desc: "Public Stream" },
    { name: "Polls", icon: <MessageSquare className="w-5 h-5" />, path: "/polls", desc: "Discussions" },
  ];

  return (
    <div className="min-h-screen w-full bg-[#05010a] text-zinc-100 flex flex-col relative font-sans">
      
      {/* STATIC DEEP PURPLE BACKGROUND (NO ANIMATION) */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-[radial-gradient(circle,rgba(88,28,135,0.08)_0%,transparent_70%)]" />
      </div>

      <Navbar />

      <main className="flex-1 flex items-center justify-center px-6 py-12 relative z-10">
        <div className="max-w-md w-full mx-auto text-center space-y-8">
          
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2">
                <ShieldCheck className="w-3 h-3 text-purple-500" />
                <p className="text-purple-400/60 font-black uppercase tracking-[0.4em] text-[8px]">
                    Encrypted Protocol Active
                </p>
            </div>
            {searchParams.get("id") && (
              <div className="inline-block px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[9px] font-black uppercase tracking-widest">
                Invited to Room: {searchParams.get("id")}
              </div>
            )}
          </div>

          {/* IDENTITY CARD (COMPACT) */}
          <div className="bg-zinc-900/40 border border-white/5 p-6 rounded-[2rem] backdrop-blur-md shadow-2xl">
            <div className="flex items-center justify-between gap-4 bg-black/40 border border-purple-500/10 p-4 rounded-2xl">
              <div className="flex flex-col text-left">
                <span className="text-3xl font-black tracking-tight text-white uppercase italic">
                  {name}
                </span>
                <span className="text-[8px] text-purple-500 uppercase font-black tracking-widest mt-1">
                    Temporary Node
                </span>
              </div>
              <button
                onClick={generateIdentity}
                className="p-3 bg-purple-500/10 hover:bg-purple-500 text-purple-400 hover:text-white rounded-xl transition-all border border-purple-500/20"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center gap-6">
            {/* PURPLE START BUTTON (SMALLER) */}
            <button
              onClick={() => setIsMenuOpen(true)}
              className="w-full py-6 rounded-[1.8rem] bg-purple-600 hover:bg-purple-500 text-white font-black text-xl uppercase tracking-[0.3em] transition-all shadow-[0_10px_40px_rgba(147,51,234,0.3)] flex items-center justify-center gap-3"
            >
              <Zap className="w-5 h-5 fill-white" />
              Join Chat
            </button>

            <button
              onClick={() => router.push('/promotions')}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/5 border border-white/5 text-zinc-500 font-black text-[9px] uppercase tracking-widest hover:text-purple-400 transition-all"
            >
              <Megaphone className="w-3 h-3" /> Support
            </button>
          </div>
        </div>
      </main>

      {/* MENU MODAL (INSTANT LOAD) */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0a0a0f] border border-white/10 w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-3xl">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h3 className="text-lg font-black uppercase tracking-widest italic text-white">Protocols</h3>
              <button 
                onClick={() => setIsMenuOpen(false)}
                className="p-2 hover:bg-white/5 rounded-full text-zinc-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 grid gap-3">
              {menuOptions.map((opt) => (
                <button
                  key={opt.name}
                  onClick={() => handleProtocolSelection(opt.path)}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-900/50 hover:bg-purple-600 text-white group transition-all text-left border border-white/5"
                >
                  <div className="w-10 h-10 shrink-0 rounded-xl bg-purple-500/10 flex items-center justify-center group-hover:bg-white group-hover:text-purple-600">
                    {opt.icon}
                  </div>
                  <div>
                    <div className="font-black uppercase text-[12px] tracking-widest">{opt.name}</div>
                    <div className="text-[9px] text-zinc-500 group-hover:text-white/80 font-bold uppercase">{opt.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
