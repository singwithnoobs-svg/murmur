"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowRight, AlertCircle, ShieldCheck, ShieldAlert, 
  Clock, Zap, Hash, Key, Loader2, Plus, Users 
} from "lucide-react";
import Navbar from "@/components/Navbar";
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { cn } from "@/lib/utils";

export default function LobbyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Segregation State
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
      const savedNickname = sessionStorage.getItem("murmur_nickname");
      if (!savedNickname) { router.push("/"); return; }

      try {
        const fpLoad = await FingerprintJS.load();
        const fpResult = await fpLoad.get();
        const visitorId = fpResult.visitorId;

        const { data: banData } = await supabase.from("banned_fingerprints").select("*").eq("fingerprint", visitorId).maybeSingle();
        if (banData) {
          setIsBlocked(true);
          setBlockType("BANNED");
          setBlockReason(banData.reason || "Device excluded.");
          return;
        }

        const { count } = await supabase.from("reports").select("*", { count: 'exact', head: true }).eq("fingerprint", visitorId);
        if (count && count >= 5) {
          setIsBlocked(true);
          setBlockType("PROCESSING");
          setBlockReason("Pending review.");
          return;
        }

        const invitedId = searchParams.get("id");
        if (invitedId) {
          setRoomId(invitedId);
          setAction("join");
        }
      } catch (err) {
        console.error(err);
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
      // JOIN LOGIC: Must exist
      if (!existingRoom) {
        setStatusError("Chat not found. Try creating it instead.");
        setIsProcessing(false);
        return;
      }
      if (existingRoom.is_private) {
        if (!password || existingRoom.password !== password) {
          setStatusError("Invalid password for this chat .");
          setIsProcessing(false);
          return;
        }
      }
    } else {
      // CREATE LOGIC: Must NOT exist
      if (existingRoom) {
        setStatusError("Room name already reserved. Try somthing else.");
        setIsProcessing(false);
        return;
      }
      const { error: createError } = await supabase.from("rooms").insert([{ 
        id: cleanId, 
        is_private: password.length > 0, 
        password: password.length > 0 ? password : null 
      }]);
      if (createError) { setStatusError("Chat Creation failed."); setIsProcessing(false); return; }
    }

    router.push(`/${cleanId}`);
  };

  if (isVerifying) return <LoadingScreen />;
  if (isBlocked) return <BlockedScreen type={blockType} reason={blockReason} />;

  return (
    <div className="h-[100dvh] bg-zinc-950 text-white flex flex-col overflow-hidden">
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <h1 className="text-5xl font-black tracking-tighter italic uppercase italic"></h1>
            <p className="text-zinc-500 text-[10px] uppercase tracking-[0.4em] font-bold mt-2">Enjoy Chatting</p>
          </motion.div>

          {/* ACTION SELECTOR */}
          <div className="flex bg-zinc-900/50 p-1 rounded-2xl border border-zinc-800/50 mb-4">
            <button 
              onClick={() => { setAction("join"); setStatusError(""); }} 
              className={cn(
                "flex-1 py-3 rounded-xl transition-all font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2",
                action === "join" ? "bg-zinc-800 text-white shadow-lg" : "text-zinc-600 hover:text-zinc-400"
              )}
            >
              <Users className="w-3.5 h-3.5" /> Join
            </button>
            <button 
              onClick={() => { setAction("create"); setStatusError(""); }} 
              className={cn(
                "flex-1 py-3 rounded-xl transition-all font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2",
                action === "create" ? "bg-purple-600 text-white shadow-lg" : "text-zinc-600 hover:text-zinc-400"
              )}
            >
              <Plus className="w-3.5 h-3.5" /> Create
            </button>
          </div>

          <motion.div layout className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-[3rem] space-y-6 backdrop-blur-3xl shadow-2xl">
            {/* ROOM ID INPUT */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 ml-2">
                <Hash className="w-3 h-3 text-purple-500" />
                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                  {action === "create" ? "Choose Room ID" : "Enter Room ID"}
                </label>
              </div>
              <input 
                type="text" 
                placeholder="e.g. testchat"
                value={roomId}
                onChange={(e) => { setRoomId(e.target.value); setStatusError(""); }}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 focus:ring-1 focus:ring-purple-500/50 outline-none text-white transition-all placeholder:text-zinc-800" 
              />
            </div>

            {/* PASSWORD INPUT */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 ml-2">
                <Key className="w-3 h-3 text-zinc-500" />
                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                  {action === "create" ? "Set password (Optional)" : "Enter password"}
                </label>
              </div>
              <input 
                type="password" 
                placeholder={action === "create" ? "Leave empty for public chats" : "Enter password if required"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setStatusError(""); }}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 focus:ring-1 focus:ring-purple-500/50 outline-none text-white transition-all placeholder:text-zinc-800"
              />
            </div>

            {statusError && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-3 text-red-400 text-[9px] font-black uppercase tracking-widest bg-red-400/5 p-4 rounded-2xl border border-red-400/10">
                <AlertCircle className="w-4 h-4" /> {statusError}
              </motion.div>
            )}

            <button 
              onClick={handleEntry} 
              disabled={isProcessing || !roomId}
              className={cn(
                "w-full font-black py-5 rounded-[1.8rem] active:scale-[0.98] transition-all flex items-center justify-center gap-3 uppercase text-[11px] tracking-[0.2em] disabled:opacity-50",
                action === "create" ? "bg-purple-600 text-white shadow-purple-900/20 shadow-xl" : "bg-white text-black shadow-white/5 shadow-xl"
              )}
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                <>
                  <span>{action === "create" ? "Create Chat" : "Join Chat"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </motion.div>
          
          <p className="text-center text-[9px] text-zinc-600 font-bold uppercase tracking-[0.3em] mt-8">
            Ephemeral Storage • Auto-Wipe Active
          </p>
        </div>
      </main>
    </div>
  );
}

// ... LoadingScreen and BlockedScreen stay the same as your previous script

// Sub-components for cleaner code
function LoadingScreen() {
  return (
    <div className="h-screen bg-zinc-950 flex flex-col items-center justify-center space-y-4">
      <Zap className="w-8 h-8 text-purple-500 animate-pulse" />
      <p className="text-white text-[10px] font-black uppercase tracking-[0.4em]">Scanning Integrity...</p>
    </div>
  );
}

function BlockedScreen({ type, reason }: { type: any, reason: string }) {
  return (
    <div className="h-screen bg-black text-white flex items-center justify-center p-6 text-center">
      <div className="max-w-md space-y-6">
        {type === "BANNED" ? <ShieldAlert className="w-16 h-16 text-red-600 mx-auto" /> : <Clock className="w-16 h-16 text-amber-500 mx-auto" />}
        <h1 className="text-3xl font-black uppercase italic">{type === "BANNED" ? "Excluded" : "Reviewing"}</h1>
        <p className="text-zinc-500 text-sm">{reason}</p>
      </div>
    </div>
  );
}
