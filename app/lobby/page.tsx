"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowRight, ShieldAlert, Clock, Zap, Hash, Key, 
  Loader2, Plus, Users, ShieldCheck, Sparkles
} from "lucide-react";
import Navbar from "@/components/Navbar";
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { cn } from "@/lib/utils";

export default function LobbyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [action, setAction] = useState<"join" | "create">("join");
  const [roomId, setRoomId] = useState("");
  const [password, setPassword] = useState("");
  const [statusError, setStatusError] = useState("");
  const [isVerifying, setIsVerifying] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // SECURITY STATE
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockType, setBlockType] = useState<"BANNED" | "PROCESSING" | null>(null);
  const [blockReason, setBlockReason] = useState("");

  useEffect(() => {
    const runSecurityCheck = async () => {
      setIsVerifying(true);
      const invitedId = searchParams.get("id");
      const savedNickname = sessionStorage.getItem("murmur_nickname");

      if (!savedNickname) { 
        router.push(invitedId ? `/?id=${invitedId}` : "/"); 
        return; 
      }

      try {
        const fpLoad = await FingerprintJS.load();
        const fpResult = await fpLoad.get();
        const visitorId = fpResult.visitorId;

        const { data: banData } = await supabase.from("banned_fingerprints").select("*").eq("fingerprint", visitorId).maybeSingle();
        if (banData) {
          setIsBlocked(true);
          setBlockType("BANNED");
          setBlockReason(banData.reason || "Device Excluded.");
          return;
        }

        const { count } = await supabase.from("reports").select("*", { count: 'exact', head: true }).eq("fingerprint", visitorId);
        if (count && count >= 5) {
          setIsBlocked(true);
          setBlockType("PROCESSING");
          setBlockReason("Pending review.");
          return;
        }

        if (invitedId) {
          setRoomId(invitedId);
          setAction("join");
        }
      } catch (err) {
        console.error("Handshake failed:", err);
      } finally {
        setIsVerifying(false);
      }
    };
    runSecurityCheck();
  }, [router, searchParams]);

  const handleEntry = async () => {
    if (!roomId.trim()) return;
    setIsProcessing(true);
    setStatusError("");
    
    const cleanId = roomId.trim().toLowerCase().replace(/\s+/g, '-');
    const { data: existingRoom } = await supabase.from("rooms").select("*").eq("id", cleanId).maybeSingle();

    if (action === "join") {
      if (!existingRoom) {
        setStatusError("Frequency not found.");
        setIsProcessing(false);
        return;
      }
      if (existingRoom.is_private && (!password || existingRoom.password !== password)) {
        setStatusError("Invalid Access Key.");
        setIsProcessing(false);
        return;
      }
    } else {
      if (existingRoom) {
        setStatusError("Frequency reserved.");
        setIsProcessing(false);
        return;
      }
      const { error } = await supabase.from("rooms").insert([{ 
        id: cleanId, 
        is_private: password.length > 0, 
        password: password.length > 0 ? password : null 
      }]);
      if (error) { setStatusError("Protocol failed."); setIsProcessing(false); return; }
    }
    router.push(`/${cleanId}`);
  };

  if (isVerifying) return <LoadingScreen />;
  if (isBlocked) return <BlockedScreen type={blockType} reason={blockReason} />;

  return (
    <div className="min-h-screen bg-[#05010a] text-white flex flex-col relative overflow-x-hidden selection:bg-purple-500/30">
      
      {/* PURPLE GRADIENT BACKGROUND */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-900/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-900/10 blur-[120px] rounded-full" />
      </div>

      <Navbar />
      
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative z-10">
        <div className="w-full max-w-[420px]">
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="text-center mb-10"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/5 border border-purple-500/20 mb-6 backdrop-blur-md">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-400/80">Secure Lobby</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tighter uppercase italic leading-none text-transparent bg-clip-text bg-gradient-to-b from-white to-purple-400/50">
              Chat<br/><span className="text-white">Room</span>
            </h1>
          </motion.div>

          <motion.div 
            layout
            className="bg-white/[0.03] border border-white/10 p-2 rounded-[3rem] backdrop-blur-2xl shadow-[0_30px_60px_rgba(0,0,0,0.5)]"
          >
            {/* Action Switcher */}
            <div className="flex bg-black/40 p-1.5 rounded-[2.2rem] border border-white/5 mb-4">
              <button 
                onClick={() => setAction("join")} 
                className={cn(
                  "flex-1 py-4 rounded-[1.8rem] transition-all font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 relative overflow-hidden",
                  action === "join" ? "bg-white text-black shadow-xl" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                <Users className="w-4 h-4" /> Join
              </button>
              <button 
                onClick={() => setAction("create")} 
                className={cn(
                  "flex-1 py-4 rounded-[1.8rem] transition-all font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 relative overflow-hidden",
                  action === "create" ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                <Plus className="w-4 h-4" /> Create
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* ID Input */}
              <div className="group relative">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                  <Hash className="w-4 h-4 text-zinc-600 group-focus-within:text-purple-400 transition-colors" />
                </div>
                <input 
                  type="text" 
                  placeholder="Room_ID"
                  value={roomId}
                  onChange={(e) => { setRoomId(e.target.value); setStatusError(""); }}
                  className="w-full bg-black/40 border border-white/5 rounded-[2rem] pl-16 pr-8 py-6 focus:border-purple-500/40 outline-none text-sm font-mono tracking-widest transition-all placeholder:text-zinc-700 focus:bg-black/60" 
                />
              </div>

              {/* Password Input */}
              <div className="group relative">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                  <Key className="w-4 h-4 text-zinc-600 group-focus-within:text-purple-400 transition-colors" />
                </div>
                <input 
                  type="password" 
                  placeholder="Password (OPTIONAL)"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setStatusError(""); }}
                  className="w-full bg-black/40 border border-white/5 rounded-[2rem] pl-16 pr-8 py-6 focus:border-purple-500/40 outline-none text-sm font-mono tracking-widest transition-all placeholder:text-zinc-700 focus:bg-black/60"
                />
              </div>

              <AnimatePresence mode="wait">
                {statusError && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    exit={{ opacity: 0, x: 10 }}
                    className="flex items-center gap-2 text-red-400 text-[10px] font-black uppercase tracking-widest px-4 py-2 bg-red-500/5 rounded-xl border border-red-500/10"
                  >
                    <ShieldAlert className="w-3 h-3" /> {statusError}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Main Action Button */}
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleEntry} 
                disabled={isProcessing || !roomId}
                className={cn(
                  "w-full font-black py-7 rounded-[2rem] transition-all flex items-center justify-center gap-4 uppercase text-[12px] tracking-[0.4em] mt-4 shadow-2xl relative overflow-hidden group",
                  action === "create" ? "bg-purple-600 text-white" : "bg-white text-black"
                )}
              >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    <span>{action === "create" ? "Create Chat" : "Enter Chat"}</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
                {/* Shimmer Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </motion.button>
            </div>
          </motion.div>
          
          <div className="mt-12 flex items-center justify-center gap-6 opacity-40">
            <div className="flex items-center gap-2">
               <Zap className="w-3 h-3 text-purple-500" />
               <p className="text-[9px] text-zinc-400 font-black uppercase tracking-[0.3em]">End-to-End</p>
            </div>
            <div className="w-1 h-1 bg-zinc-800 rounded-full" />
            <div className="flex items-center gap-2">
               <Sparkles className="w-3 h-3 text-purple-500" />
               <p className="text-[9px] text-zinc-400 font-black uppercase tracking-[0.3em]">Zero Logs</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="h-screen bg-[#05010a] flex flex-col items-center justify-center space-y-8">
      <div className="relative">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-t-2 border-purple-500 rounded-full" 
        />
        <Zap className="w-6 h-6 text-purple-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
      </div>
      <div className="text-center">
        <p className="text-white text-[10px] font-black uppercase tracking-[0.6em]">Syncing Handshake</p>
        <p className="text-zinc-600 text-[8px] font-bold uppercase tracking-[0.4em] mt-2">Checking device fingerprint...</p>
      </div>
    </div>
  );
}

function BlockedScreen({ type, reason }: { type: any, reason: string }) {
  return (
    <div className="h-screen bg-[#05010a] text-white flex items-center justify-center p-6">
      <div className="text-center space-y-8 border border-white/5 p-16 rounded-[4rem] bg-zinc-900/20 backdrop-blur-3xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-red-600" />
        {type === "BANNED" ? <ShieldAlert className="w-16 h-16 text-red-600 mx-auto" /> : <Clock className="w-16 h-16 text-amber-500 mx-auto" />}
        <div>
          <h1 className="text-3xl font-black uppercase italic tracking-tighter">Access<br/>Restricted</h1>
          <p className="text-zinc-500 text-[11px] font-bold uppercase tracking-[0.2em] mt-4 max-w-[240px] mx-auto leading-relaxed italic">{reason}</p>
        </div>
        <button 
          onClick={() => window.location.href = "/"}
          className="px-8 py-3 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
        >
          Return to Void
        </button>
      </div>
    </div>
  );
}
