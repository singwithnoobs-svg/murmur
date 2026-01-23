"use client";

import { useEffect, useState } from "react"; // Added useEffect
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Lock, Plus, Users, ArrowRight, AlertCircle, ShieldCheck } from "lucide-react";
import Navbar from "@/components/Navbar";
import { cn } from "@/lib/utils";

export default function LobbyPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"public" | "private">("public");
  const [action, setAction] = useState<"join" | "create">("join");
  const [roomId, setRoomId] = useState("");
  const [password, setPassword] = useState("");
  const [statusError, setStatusError] = useState("");

  // NICKNAME CHECK: Ensure user didn't bypass the landing page
  useEffect(() => {
    const saved = sessionStorage.getItem("murmur_nickname");
    if (!saved) router.push("/");
  }, [router]);

  const handleAction = async () => {
    setStatusError("");
    if (!roomId) return;
    
    const cleanId = roomId.trim().toLowerCase().replace(/\s+/g, '-');

    const { data: existingRoom } = await supabase
      .from("rooms")
      .select("*")
      .eq("id", cleanId)
      .maybeSingle(); // Better than .single() to avoid 406 errors

    if (action === "create") {
      if (existingRoom) {
        setStatusError("Frequency ID already reserved.");
        return;
      }
      if (mode === "private" && !password) {
        setStatusError("Security pass required.");
        return;
      }

      const { error: createError } = await supabase
        .from("rooms")
        .insert([{ 
          id: cleanId, 
          is_private: mode === "private", 
          password: mode === "private" ? password : null 
        }]);

      if (createError) {
        setStatusError("Initialization failed.");
        return;
      }
    } 
    else if (action === "join") {
      if (!existingRoom) {
        setStatusError("Frequency not found.");
        return;
      }
      if (existingRoom.is_private) {
        if (!password || existingRoom.password !== password) {
          setStatusError("Invalid security pass.");
          return;
        }
      }
    }

    // UPDATED REDIRECT: Go to the chat page with the ID as a parameter
    router.push(`/${cleanId}`);
  };

  return (
    // FIXED: Mobile-optimized container
    <div className="h-[100dvh] bg-zinc-950 text-white flex flex-col overflow-hidden selection:bg-purple-500/30">
      <Navbar />
      
      {/* Scrollable area for the form */}
      <main className="flex-1 overflow-y-auto no-scrollbar pt-24 px-6 pb-10">
        <div className="max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-black mb-2 tracking-tighter italic">Welcome</h1>
            <p className="text-zinc-500 text-[10px] uppercase tracking-[0.3em] font-bold">Chat Management</p>
          </motion.div>

          {/* Mode Toggle */}
          <div className="flex bg-zinc-900/50 p-1.5 rounded-2xl border border-zinc-800/50 mb-6">
            <button onClick={() => setMode("public")} className={cn("flex-1 py-3 rounded-xl transition-all font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2", mode === "public" ? "bg-zinc-800 text-white" : "text-zinc-500")}>
              <Globe className="w-3.5 h-3.5" /> Public
            </button>
            <button onClick={() => setMode("private")} className={cn("flex-1 py-3 rounded-xl transition-all font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2", mode === "private" ? "bg-purple-600 text-white" : "text-zinc-500")}>
              <Lock className="w-3.5 h-3.5" /> Private
            </button>
          </div>

          {/* Action Toggle */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button onClick={() => setAction("join")} className={cn("p-5 rounded-[2rem] border transition-all text-left", action === "join" ? "bg-zinc-900 border-purple-500/50" : "bg-zinc-900/20 border-zinc-800 opacity-40")}>
              <Users className={cn("mb-3 w-5 h-5", action === "join" ? "text-purple-500" : "text-zinc-600")} />
              <h3 className="font-bold text-sm uppercase italic">Join</h3>
              <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-tighter">Existing Chat</p>
            </button>
            <button onClick={() => setAction("create")} className={cn("p-5 rounded-[2rem] border transition-all text-left", action === "create" ? "bg-zinc-900 border-purple-500/50" : "bg-zinc-900/20 border-zinc-800 opacity-40")}>
              <Plus className={cn("mb-3 w-5 h-5", action === "create" ? "text-purple-500" : "text-zinc-600")} />
              <h3 className="font-bold text-sm uppercase italic">Create</h3>
              <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-tighter">New Chat</p>
            </button>
          </div>

          {/* Input Box */}
          <motion.div layout className="bg-zinc-900/80 border border-zinc-800 p-6 md:p-8 rounded-[2.5rem] space-y-4 shadow-2xl backdrop-blur-2xl">
            <div>
              <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest ml-1">Chat ID</label>
              <input 
                type="text" 
                placeholder="e.g. shadow-net"
                value={roomId}
                onChange={(e) => { setRoomId(e.target.value); setStatusError(""); }}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 mt-1 focus:ring-1 focus:ring-purple-500/50 outline-none text-white transition-all text-[16px]" 
              />
            </div>

            <AnimatePresence>
              {mode === "private" && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest ml-1">Security Pass</label>
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setStatusError(""); }}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 mt-1 focus:ring-1 focus:ring-purple-500/50 outline-none text-white text-[16px]"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {statusError && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-red-400 text-[9px] font-bold uppercase tracking-widest bg-red-400/5 p-3 rounded-xl border border-red-400/20">
                  <AlertCircle className="w-3.5 h-3.5" /> {statusError}
                </motion.div>
              )}
            </AnimatePresence>

            <button onClick={handleAction} className="w-full bg-white text-black font-black py-5 rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-3 uppercase text-[10px] tracking-widest">
              {mode === "private" ? <ShieldCheck className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              {action === "create" ? "Create Chat" : "Join Chat"}
            </button>
          </motion.div>
        </div>
      </main>
    </div>
  );
}