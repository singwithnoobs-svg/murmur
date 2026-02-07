"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowRight, ShieldAlert, Clock, Zap, Hash, Key, 
  Loader2, Plus, Users, LayoutGrid
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
        setStatusError("Frequency already reserved.");
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
    <div className="h-[100dvh] bg-zinc-950 text-white flex flex-col overflow-hidden selection:bg-purple-500/30">
      <Navbar />
      
      <main className="flex-1 flex flex-col items-center justify-center px-6 relative">
        {/* Background Ambient Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-600/10 blur-[120px] pointer-events-none" />
        
        <div className="w-full max-w-[400px] z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="text-center mb-10"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 mb-4">
            </div>
            <h1 className="text-4xl font-black tracking-[0.1em] uppercase italic bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent">
              Chat With friends
            </h1>
          </motion.div>

          <motion.div 
            layout
            className="bg-zinc-900/40 border border-white/5 p-6 rounded-[2.5rem] backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
          >
            {/* Action Switcher */}
            <div className="flex bg-black/40 p-1 rounded-2xl border border-white/5 mb-6">
              <button 
                onClick={() => setAction("join")} 
                className={cn(
                  "flex-1 py-3 rounded-xl transition-all font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2",
                  action === "join" ? "bg-white text-black" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                <Users className="w-3.5 h-3.5" /> Join
              </button>
              <button 
                onClick={() => setAction("create")} 
                className={cn(
                  "flex-1 py-3 rounded-xl transition-all font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2",
                  action === "create" ? "bg-purple-600 text-white" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                <Plus className="w-3.5 h-3.5" /> Create
              </button>
            </div>

            <div className="space-y-4">
              <div className="group relative">
                <Hash className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-purple-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="ROOM_ID"
                  value={roomId}
                  onChange={(e) => { setRoomId(e.target.value); setStatusError(""); }}
                  className="w-full bg-black/40 border border-white/5 rounded-2xl pl-14 pr-6 py-5 focus:border-purple-500/50 outline-none text-sm font-mono tracking-wider transition-all placeholder:text-zinc-700" 
                />
              </div>

              <div className="group relative">
                <Key className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-purple-500 transition-colors" />
                <input 
                  type="password" 
                  placeholder="ROOM_PASSWORD"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setStatusError(""); }}
                  className="w-full bg-black/40 border border-white/5 rounded-2xl pl-14 pr-6 py-5 focus:border-purple-500/50 outline-none text-sm font-mono tracking-wider transition-all placeholder:text-zinc-700"
                />
              </div>

              <AnimatePresence mode="wait">
                {statusError && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: "auto" }} 
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2 text-red-400 text-[10px] font-bold uppercase tracking-widest px-2"
                  >
                    <LayoutGrid className="w-3 h-3" /> {statusError}
                  </motion.div>
                )}
              </AnimatePresence>

              <button 
                onClick={handleEntry} 
                disabled={isProcessing || !roomId}
                className={cn(
                  "w-full font-black py-5 rounded-2xl active:scale-[0.97] transition-all flex items-center justify-center gap-3 uppercase text-[11px] tracking-[0.3em] mt-2",
                  action === "create" ? "bg-purple-600 text-white shadow-purple-500/10" : "bg-white text-black"
                )}
              >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    <span>{action === "create" ? "Create Chat" : "Join Chat"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
          
          <div className="flex flex-col items-center mt-10 space-y-2 opacity-30 grayscale hover:grayscale-0 transition-all cursor-default">
             <Zap className="w-4 h-4 text-purple-500" />
             <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-[0.4em]">
               P2P Safe model
             </p>
          </div>
        </div>
      </main>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="h-screen bg-zinc-950 flex flex-col items-center justify-center space-y-6">
      <div className="relative">
        <div className="w-12 h-12 border-2 border-purple-500/20 rounded-full animate-ping" />
        <Zap className="w-6 h-6 text-purple-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      </div>
      <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.5em] animate-pulse">Scanning Bio-ID</p>
    </div>
  );
}

function BlockedScreen({ type, reason }: { type: any, reason: string }) {
  return (
    <div className="h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="text-center space-y-6 border border-white/5 p-12 rounded-[3rem] bg-zinc-900/20 backdrop-blur-xl">
        {type === "BANNED" ? <ShieldAlert className="w-12 h-12 text-red-600 mx-auto" /> : <Clock className="w-12 h-12 text-amber-500 mx-auto" />}
        <h1 className="text-2xl font-black uppercase italic tracking-tighter">{type === "BANNED" ? "Protocol Exclusion" : "Security Review"}</h1>
        <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest max-w-[200px] mx-auto leading-relaxed">{reason}</p>
      </div>
    </div>
  );
}
