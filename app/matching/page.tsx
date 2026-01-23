"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { Loader2, X, Timer } from "lucide-react";

export default function MatchingPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [status, setStatus] = useState("Initializing...");
  const [cooldown, setCooldown] = useState(5);
  const [onlineCount, setOnlineCount] = useState(1);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Initial Auth Check
  useEffect(() => {
    const savedName = sessionStorage.getItem("murmur_nickname");
    if (!savedName) {
      router.push("/");
      return;
    }
    setNickname(savedName);
  }, [router]);

  // 2. Global Presence (Online Count)
  useEffect(() => {
    if (!nickname) return;
    const channel = supabase.channel("global_presence", {
      config: { presence: { key: nickname } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        setOnlineCount(Object.keys(state).length);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => { supabase.removeChannel(channel); };
  }, [nickname]);

  // 3. Cooldown Logic
  useEffect(() => {
    if (!nickname) return;
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      setStatus(`De-syncing frequencies... ${cooldown}s`);
      return () => clearTimeout(timer);
    } else {
      startProtocol(nickname);
    }
  }, [cooldown, nickname]);

  const startProtocol = async (name: string) => {
    try {
      // CLEANUP
      setStatus("Purging ghost data...");
      await supabase.from("matchmaking").delete().eq("nickname", name);
      await new Promise(res => setTimeout(res, 1000)); 

      // SEARCH PHASE
      setStatus("Scanning for signals...");
      const { data: queue } = await supabase
        .from("matchmaking")
        .select("*")
        .neq("nickname", name) 
        .order("created_at", { ascending: true })
        .limit(1);

      if (queue && queue.length > 0) {
        const partner = queue[0];
        const roomId = `match_${name.replace(/\s+/g, '')}_${partner.nickname.replace(/\s+/g, '')}_${Date.now()}`;
        
        await supabase.from("matchmaking").delete().eq("id", partner.id);
        await supabase.from("rooms").insert([{ id: roomId }]);
        
        setStatus("Link established!");
        router.push(`/random-chat?id=${roomId}`);

      } else {
        setStatus("Broadcasting signal...");
        await supabase.from("matchmaking").insert([{ nickname: name }]);

        intervalRef.current = setInterval(async () => {
          const cleanMe = name.replace(/\s+/g, '');
          const { data: matchedRooms } = await supabase
            .from("rooms")
            .select("id")
            .ilike("id", `%${cleanMe}%`)
            .order('created_at', { ascending: false });

          if (matchedRooms && matchedRooms.length > 0) {
            clearInterval(intervalRef.current!);
            router.push(`/random-chat?id=${matchedRooms[0].id}`);
          }
        }, 2000);
      }
    } catch (e: any) {
      setStatus("Signal lost. Retrying...");
      setTimeout(() => startProtocol(name), 3000);
    }
  };

  const cancelMatch = async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    await supabase.from("matchmaking").delete().eq("nickname", nickname);
    router.push("/mode");
  };

  return (
    <div className="h-[100dvh] bg-zinc-950 flex flex-col items-center justify-center p-6 text-zinc-100 font-sans overflow-hidden">
      <div className="w-full max-w-sm text-center space-y-10">
        <div className="relative flex items-center justify-center h-40">
          <motion.div 
            animate={{ 
              scale: cooldown > 0 ? [1, 1.1, 1] : [1, 1.4, 1], 
              opacity: cooldown > 0 ? 0.05 : [0.1, 0.2, 0.1] 
            }} 
            transition={{ duration: 2, repeat: Infinity }} 
            className={`absolute w-64 h-64 border rounded-full ${cooldown > 0 ? 'border-zinc-500' : 'border-blue-500/20'}`} 
          />
          <div className="relative z-10">
            {cooldown > 0 ? (
              <Timer className="w-12 h-12 text-zinc-600 animate-pulse" />
            ) : (
              <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-3xl font-black uppercase italic tracking-tighter">
            {cooldown > 0 ? "Cooling Down" : "Searching"}
          </h2>
          <div className="flex flex-col gap-1">
            <p className="text-zinc-500 font-bold text-[10px] tracking-widest uppercase">
              {status}
            </p>
            {/* Online Count Display */}
            <div className="flex items-center justify-center gap-2 mt-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                {onlineCount} Signals Active
              </span>
            </div>
          </div>
        </div>

        <button 
          onClick={cancelMatch} 
          className="w-full py-4 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-500 font-bold text-xs uppercase hover:text-red-400 transition-all active:scale-95"
        >
          <X className="w-4 h-4 mx-auto" />
        </button>
      </div>
    </div>
  );
}