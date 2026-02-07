"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { X, Zap } from "lucide-react";
import FingerprintJS from '@fingerprintjs/fingerprintjs';

export default function MatchingPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [status, setStatus] = useState("Initializing Ghost Protocol...");
  const [isBanned, setIsBanned] = useState(false);
  const [banDetails, setBanDetails] = useState<any>(null);
  
  const protocolStarted = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    const savedName = sessionStorage.getItem("murmur_nickname");
    if (!savedName) { router.push("/"); return; }
    setNickname(savedName);
    checkBanAndStart(savedName);

    // CLEANUP: If user closes tab or leaves
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (nickname) {
      // Deletes BOTH the signal and the matchmaking record for this nickname
      await supabase.from("matchmaking")
        .delete()
        .or(`nickname.eq.${nickname},partner_found.eq.${nickname}`);
    }
    if (channelRef.current) supabase.removeChannel(channelRef.current);
  };

  const checkBanAndStart = async (name: string) => {
    const fp = await (await FingerprintJS.load()).get();
    const { data } = await supabase.from("banned_fingerprints")
      .select("*")
      .eq("fingerprint", fp.visitorId)
      .maybeSingle();

    if (data && (!data.expires_at || new Date(data.expires_at) > new Date())) {
      setBanDetails(data);
      setIsBanned(true);
    } else {
      startMatchmaking(name);
    }
  };

  const startMatchmaking = async (name: string) => {
    if (protocolStarted.current) return;
    protocolStarted.current = true;

    try {
      setStatus("Scanning Frequencies...");
      
      // 1. Attempt to find an existing signal (Waiters)
      const { data: queue } = await supabase
        .from("matchmaking")
        .select("*")
        .is("partner_found", null)
        .neq("nickname", name) 
        .order("created_at", { ascending: true })
        .limit(1);

      if (queue && queue.length > 0) {
        const partner = queue[0];
        const roomId = `room_${Math.random().toString(36).substring(2, 12)}`;

        // Attempt to "Snap up" the partner
        const { data: claimed } = await supabase
          .from("matchmaking")
          .delete()
          .eq("id", partner.id)
          .select();

        if (claimed && claimed.length > 0) {
          setStatus("Link Established!");
          
          // Create the room
          await supabase.from("rooms").insert([{ id: roomId, created_by: name }]);
          
          // Leave a "Signal" for the partner to find the room
          await supabase.from("matchmaking").insert([{ 
            nickname: `SIGNAL_${partner.nickname}`, 
            partner_found: partner.nickname, 
            room_id: roomId 
          }]);
          
          router.push(`/random-chat?id=${roomId}`);
        } else {
          // If claim failed, retry immediately
          protocolStarted.current = false;
          startMatchmaking(name);
        }
      } else {
        // 2. No one found, Create our own signal and wait
        setStatus("Broadcasting Signal...");
        
        // Ensure old records of me are gone before inserting
        await supabase.from("matchmaking").delete().eq("nickname", name);
        await supabase.from("matchmaking").insert([{ nickname: name }]);

        intervalRef.current = setInterval(async () => {
          // Look for the "SIGNAL_" packet someone sent us
          const { data: signal } = await supabase
            .from("matchmaking")
            .select("*")
            .eq("partner_found", name) 
            .maybeSingle();

          if (signal?.room_id) {
            const finalRoomId = signal.room_id;
            clearInterval(intervalRef.current!);
            
            // Clean up our signal packet
            await supabase.from("matchmaking").delete().eq("id", signal.id);
            // Clean up our entry in the queue
            await supabase.from("matchmaking").delete().eq("nickname", name);
            
            router.push(`/random-chat?id=${finalRoomId}`);
          }
        }, 1500);
      }
    } catch (e) {
      protocolStarted.current = false;
      setStatus("Signal Lost. Retrying...");
    }
  };

  const abort = async () => {
    await cleanup();
    router.push("/");
  };

  if (isBanned) return <div className="h-screen bg-black text-white flex items-center justify-center p-10 text-center">Access Revoked: {banDetails?.reason}</div>;

  return (
    <div className="h-[100dvh] bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-6 overflow-hidden">
      {/* ... (Your existing UI remains the same) ... */}
      <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
        <div className="relative mb-12">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }} className="w-32 h-32 border-2 border-dashed border-zinc-800 rounded-full" />
          <motion.div animate={{ rotate: -360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="absolute inset-2 border-b-2 border-purple-500 rounded-full" />
          <div className="absolute inset-0 flex items-center justify-center"><Zap className="w-8 h-8 text-purple-500 animate-pulse" /></div>
        </div>
        <div className="text-center space-y-2 mb-10">
          <h2 className="text-2xl font-black uppercase italic tracking-tighter">Ghosting <span className="text-purple-600">Active</span></h2>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">{status}</p>
        </div>
        <button onClick={abort} className="flex items-center gap-2 text-zinc-600 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest"><X className="w-4 h-4" /> Abort Session</button>
      </div>
    </div>
  );
}
