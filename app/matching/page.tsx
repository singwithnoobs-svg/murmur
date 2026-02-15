"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Shield, Users, ArrowLeft, Loader2, RefreshCcw } from "lucide-react";

export default function MatchmakingPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Initializing...");
  const [onlineCount, setOnlineCount] = useState(0);
  const channelRef = useRef<any>(null);
  const isMatched = useRef(false);

  useEffect(() => {
    const nickname = sessionStorage.getItem("murmur_nickname");
    if (!nickname) {
      router.push("/");
      return;
    }

    const startMatchmaking = async () => {
      const channel = supabase.channel("matchmaking_lobby", {
        config: { presence: { key: nickname } },
      });
      channelRef.current = channel;

      channel
        .on("presence", { event: "sync" }, () => {
          const state = channel.presenceState();
          const presences = Object.entries(state).map(([key, val]: any) => ({
            nickname: key,
            ...val[0],
          }));

          setOnlineCount(presences.length);
          if (!isMatched.current) {
            findMatch(presences, nickname);
          }
        })
        .on("broadcast", { event: "MATCH_PROPOSE" }, ({ payload }) => {
          if (payload.target === nickname && !isMatched.current) {
            isMatched.current = true;
            setStatus("Stranger found! Shaking hands...");
            
            channel.send({
              type: "broadcast",
              event: "MATCH_ACK",
              payload: { roomId: payload.roomId, partner: payload.origin }
            });

            executeMatch(payload.roomId);
          }
        })
        .on("broadcast", { event: "MATCH_ACK" }, ({ payload }) => {
          if (isMatched.current && payload.partner === nickname) {
            executeMatch(payload.roomId);
          }
        })
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            setStatus("Searching for peers...");
            await channel.track({
              status: "waiting",
              joined_at: Date.now(),
            });
          }
        });
    };

    const findMatch = (presences: any[], myName: string) => {
      const available = presences
        .filter((p) => p.nickname !== myName && p.status === "waiting")
        .sort((a, b) => a.joined_at - b.joined_at);

      if (available.length > 0) {
        const match = available[0];
        const myData = presences.find(p => p.nickname === myName);
        
        if (myData && myData.joined_at > match.joined_at) {
          initiateHandshake(match.nickname, myName);
        }
      }
    };

    const initiateHandshake = (targetName: string, myName: string) => {
      isMatched.current = true;
      const generatedRoomId = `meet_${Math.random().toString(36).slice(2, 11)}`;
      setStatus("Syncing with node...");

      channelRef.current.send({
        type: "broadcast",
        event: "MATCH_PROPOSE",
        payload: {
          origin: myName,
          target: targetName,
          roomId: generatedRoomId,
        },
      });
    };

    // --- FIXED FUNCTION ---
    const executeMatch = (roomId: string) => {
      setStatus("Connection Secure. Redirecting...");
      
      if (channelRef.current) {
          supabase.removeChannel(channelRef.current);
      }
      
      // We MUST pass the roomId as a query parameter (?id=) 
      // so the Chat script can read it and stay on the page.
      setTimeout(() => {
        router.push(`/random-chat?id=${roomId}`);
      }, 1000);
    };

    startMatchmaking();

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-[#05010a] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/5 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-sm w-full space-y-10 relative z-10 text-center">
        <div className="relative mx-auto w-32 h-32">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 border-t-2 border-purple-500 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.4)]"
          />
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-4 border border-purple-500/20 rounded-full"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Zap className="w-10 h-10 text-purple-400 fill-purple-400/20" />
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-2xl font-black uppercase italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-500">
            {status}
          </h2>
          <div className="flex items-center justify-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/5">
              <Users className="w-3 h-3 text-purple-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                {onlineCount} ACTIVE NODES
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/5 p-6 rounded-[2rem] backdrop-blur-md">
          <div className="flex flex-col items-center gap-4 text-center">
            <Shield className="w-6 h-6 text-purple-500 opacity-50" />
            <p className="text-[10px] text-zinc-500 font-bold uppercase leading-relaxed tracking-wider">
              Handshake protocol active. Verifying peer stability before establishing dynamic route.
            </p>
          </div>
        </div>

        <button
          onClick={() => router.push("/")}
          className="group flex items-center justify-center gap-2 text-zinc-600 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest w-full"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
          Abort Sequence
        </button>
      </div>
    </div>
  );
}
