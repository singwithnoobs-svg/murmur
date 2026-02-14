"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { X, Radio, ShieldAlert } from "lucide-react";
import FingerprintJS from '@fingerprintjs/fingerprintjs';

export default function MatchingPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Initializing...");
  const [isBanned, setIsBanned] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const protocolStarted = useRef(false);
  const channelRef = useRef<any>(null);
  const myRecordId = useRef<string | null>(null);
  const nicknameRef = useRef<string | null>(null);
  const fallbackInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => (prev < 95 ? prev + 1 : prev));
    }, 500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const init = async () => {
      const savedName = sessionStorage.getItem("murmur_nickname");
      if (!savedName) { router.push("/"); return; }
      
      nicknameRef.current = savedName;
      const fpLoad = await FingerprintJS.load();
      const fp = await fpLoad.get();
      
      const banned = await checkBan(fp.visitorId);
      if (!banned) startMatchmaking(savedName, fp.visitorId);
    };

    init();

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
      if (fallbackInterval.current) clearInterval(fallbackInterval.current);
      if (nicknameRef.current) {
        supabase.from("matchmaking").delete().eq("nickname", nicknameRef.current).then();
      }
    };
  }, [router]);

  const checkBan = async (fp: string) => {
    const { data } = await supabase.from("banned_fingerprints")
      .select("*").eq("fingerprint", fp).maybeSingle();
    if (data) { setIsBanned(true); return true; }
    return false;
  };

  const startMatchmaking = async (name: string, fp: string) => {
    if (protocolStarted.current) return;
    protocolStarted.current = true;

    // 1. Clear old ghosts
    await supabase.from("matchmaking").delete().eq("nickname", name);

    setStatus("Searching for signals...");

    // 2. Look for a Host
    const { data: host } = await supabase
      .from("matchmaking")
      .select("*")
      .is("room_id", null)
      .neq("nickname", name)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (host) {
      // JOINER LOGIC
      setStatus("Linking Protocol...");
      const roomId = `room_${Math.random().toString(36).substring(2, 11)}`;
      
      await supabase.from("rooms").insert([{ id: roomId }]);

      const { error } = await supabase
        .from("matchmaking")
        .update({ room_id: roomId, partner_found: name })
        .eq("id", host.id);

      if (!error) {
        router.push(`/random-chat?id=${roomId}`);
        return;
      }
    }

    // 3. Become the HOST
    setStatus("Broadcasting Signal...");
    const { data: myNewRecord, error: insertError } = await supabase
      .from("matchmaking")
      .insert([{ nickname: name, fingerprint: fp }])
      .select()
      .single();

    if (insertError || !myNewRecord) {
      protocolStarted.current = false;
      return;
    }

    myRecordId.current = myNewRecord.id;

    // 4. THE HANDSHAKE (Realtime)
    channelRef.current = supabase
      .channel(`match-${myNewRecord.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'matchmaking', filter: `id=eq.${myNewRecord.id}` },
        (payload) => {
          if (payload.new.room_id) {
            handleSuccessfulMatch(payload.new.room_id);
          }
        }
      )
      .subscribe();

    // 5. THE FALLBACK (If Realtime is disabled or fails)
    fallbackInterval.current = setInterval(async () => {
      const { data } = await supabase
        .from("matchmaking")
        .select("room_id")
        .eq("id", myNewRecord.id)
        .maybeSingle();
      
      if (data?.room_id) {
        handleSuccessfulMatch(data.room_id);
      }
    }, 2000);
  };

  const handleSuccessfulMatch = (roomId: string) => {
    if (fallbackInterval.current) clearInterval(fallbackInterval.current);
    setStatus("Signal Locked!");
    router.push(`/random-chat?id=${roomId}`);
  };

  if (isBanned) return (
    <div className="h-screen bg-[#020105] text-purple-500 flex flex-col items-center justify-center p-10">
      <ShieldAlert className="w-16 h-16 mb-4" />
      <h1 className="font-black uppercase tracking-tighter">System Banned</h1>
    </div>
  );

  return (
    <div className="h-[100dvh] bg-[#020105] text-zinc-100 flex flex-col items-center justify-center p-6 overflow-hidden relative font-sans">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[radial-gradient(circle,rgba(168,85,247,0.15)_0%,transparent_70%)]" />
      </div>

      <div className="relative z-10 w-full max-w-xs flex flex-col items-center">
        <div className="relative mb-12">
          <motion.div 
            animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="w-44 h-44 rounded-full border border-purple-500/20 flex items-center justify-center"
          >
             <div className="w-36 h-36 rounded-full border-t-2 border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.3)]" />
          </motion.div>
          <Radio className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 text-purple-400 animate-pulse" />
        </div>

        <div className="text-center w-full space-y-6">
          <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">Matching</h2>
          <p className="text-[11px] font-bold text-purple-400 uppercase tracking-[0.4em]">{status}</p>
          
          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
            <motion.div animate={{ width: `${progress}%` }} className="h-full bg-purple-600 shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
          </div>

          <button 
            onClick={() => router.push("/")}
            className="mt-8 px-10 py-3 rounded-full bg-white/5 border border-white/10 text-zinc-400 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all"
          >
            Abort
          </button>
        </div>
      </div>
    </div>
  );
}
