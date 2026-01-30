"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, X, Timer, ShieldX, Clock, Calendar } from "lucide-react";
import FingerprintJS from '@fingerprintjs/fingerprintjs';

export default function MatchingPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [status, setStatus] = useState("Initializing...");
  const [cooldown, setCooldown] = useState(5);
  const [onlineCount, setOnlineCount] = useState(1);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Ban States
  const [isBanned, setIsBanned] = useState(false);
  const [banDetails, setBanDetails] = useState<{ reason: string; expires_at: string | null } | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>("");

  // 1. Initial Auth & Ban Check
  useEffect(() => {
    const savedName = sessionStorage.getItem("murmur_nickname");
    if (!savedName) {
      router.push("/");
      return;
    }
    setNickname(savedName);

    const checkBanStatus = async () => {
      const fp = await (await FingerprintJS.load()).get();
      const visitorId = fp.visitorId;
      
      const { data, error } = await supabase
        .from("banned_fingerprints")
        .select("reason, expires_at")
        .eq("fingerprint", visitorId)
        .maybeSingle();

      if (data) {
        // Check if temporary ban has already expired
        if (data.expires_at && new Date(data.expires_at) < new Date()) {
          await supabase.from("banned_fingerprints").delete().eq("fingerprint", visitorId);
          setIsBanned(false);
        } else {
          setBanDetails(data);
          setIsBanned(true);
          setStatus("Access Denied.");
        }
      }
    };

    checkBanStatus();
  }, [router]);

  // 2. Countdown Timer for Ban
  useEffect(() => {
    if (!isBanned || !banDetails?.expires_at) return;

    const calculateTime = () => {
      const now = new Date().getTime();
      const end = new Date(banDetails.expires_at!).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft("EXPIRED");
        window.location.reload(); // Refresh to lift ban
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      setTimeLeft(`${days}d ${hours}h ${minutes}m`);
    };

    calculateTime();
    const timer = setInterval(calculateTime, 60000); // Update every minute
    return () => clearInterval(timer);
  }, [isBanned, banDetails]);

  // 3. Global Presence (Online Count)
  useEffect(() => {
    if (!nickname || isBanned) return;
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
  }, [nickname, isBanned]);

  // 4. Cooldown Logic
  useEffect(() => {
    if (!nickname || isBanned) return; 
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      setStatus(`De-syncing frequencies... ${cooldown}s`);
      return () => clearTimeout(timer);
    } else {
      startProtocol(nickname);
    }
  }, [cooldown, nickname, isBanned]);

const startProtocol = async (name: string) => {
    try {
      setStatus("Purging ghost data...");
      await supabase.from("matchmaking").delete().eq("nickname", name);
      await new Promise(res => setTimeout(res, 800)); 

      setStatus("Scanning for signals...");
      const { data: queue } = await supabase
        .from("matchmaking")
        .select("*")
        .neq("nickname", name) 
        .order("created_at", { ascending: true })
        .limit(1);

      if (queue && queue.length > 0) {
        const partner = queue[0];
        // FIX 1: Simplified Room ID for more reliable matching
        const roomId = `room_${Math.random().toString(36).substring(2, 15)}`;
        
        await supabase.from("matchmaking").delete().eq("id", partner.id);
        
        // FIX 2: Ensure room insertion is AWAITED before redirect
        const { error: roomErr } = await supabase.from("rooms").insert([{ id: roomId }]);
        
        if (roomErr) throw roomErr;

        setStatus("Link established!");
        router.push(`/random-chat?id=${roomId}`);

      } else {
        setStatus("Broadcasting signal...");
        // Enter the queue
        await supabase.from("matchmaking").insert([{ nickname: name }]);

        intervalRef.current = setInterval(async () => {
          // FIX 3: Check if a partner has deleted our matchmaking entry 
          // (Signifying they created a room for us)
          const { data: amIStillInQueue } = await supabase
            .from("matchmaking")
            .select("id")
            .eq("nickname", name)
            .maybeSingle();

          if (!amIStillInQueue) {
             // If we aren't in queue, it means someone matched us.
             // Look for the room created in the last 10 seconds that we are part of
             const { data: matchedRooms } = await supabase
                .from("rooms")
                .select("id")
                .order('created_at', { ascending: false })
                .limit(1);

             if (matchedRooms && matchedRooms.length > 0) {
               clearInterval(intervalRef.current!);
               router.push(`/random-chat?id=${matchedRooms[0].id}`);
             }
          }
        }, 2000);
      }
    } catch (e: any) {
      console.error(e);
      setStatus("Signal lost. Retrying...");
      setTimeout(() => startProtocol(name), 3000);
    }
  };

  const cancelMatch = async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    await supabase.from("matchmaking").delete().eq("nickname", nickname);
    router.push("/");
  };

  // Render Banned Screen
  if (isBanned) {
    return (
      <div className="h-[100dvh] bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-sm w-full">
          <div className="w-20 h-20 bg-red-600/10 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-red-500/20 shadow-[0_0_30px_rgba(220,38,38,0.1)]">
            <ShieldX className="w-10 h-10 text-red-500" />
          </div>
          
          <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white mb-6">Access Revoked</h2>
          
          <div className="space-y-4 bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl mb-8">
            <div className="text-left">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                <X className="w-3 h-3"/> Violation Reason
              </p>
              <p className="text-sm font-bold text-zinc-200 uppercase">{banDetails?.reason || "Restricted Behavior"}</p>
            </div>

            <div className="h-px bg-zinc-800 w-full" />

            <div className="text-left">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                <Clock className="w-3 h-3"/> Remaining Time
              </p>
              <p className="text-xl font-black text-red-500 font-mono">
                {banDetails?.expires_at ? timeLeft : "PERMANENT"}
              </p>
            </div>
          </div>

          <button 
            onClick={() => router.push("/")} 
            className="text-zinc-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest underline underline-offset-4"
          >
            Return to Surface
          </button>
        </motion.div>
      </div>
    );
  }

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
