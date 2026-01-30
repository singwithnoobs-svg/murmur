"use client";

import { useEffect, useState, useRef, Suspense, memo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Send, LogOut, RefreshCw, Zap, Loader2, Flag, X, Youtube } from "lucide-react";
import FingerprintJS from '@fingerprintjs/fingerprintjs';

/* AD COMPONENT: Wrapped in memo with Diagnostic Logs and Channel Fallback */
const AdsterraBanner = memo(() => {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (adRef.current && !adRef.current.firstChild) {
      console.log("[ADSTERRA] Initializing ad container...");

      const configScript = document.createElement("script");
      configScript.innerHTML = `
        atOptions = {
          'key' : 'fa3453ae0f13be3b5ba238031d224e99',
          'format' : 'iframe',
          'height' : 250,
          'width' : 300,
          'params' : {}
        };
      `;
      
      const adScript = document.createElement("script");
      adScript.type = "text/javascript";
      adScript.src = "https://www.highperformanceformat.com/fa3453ae0f13be3b5ba238031d224e99/invoke.js";

      adScript.onerror = () => console.error("[ADSTERRA] Script failed to load.");
      adScript.onload = () => {
        console.log("[ADSTERRA] Script injected. Checking delivery...");
        setTimeout(() => {
          const hasIframe = adRef.current?.querySelector('iframe');
          if (hasIframe) console.log("[ADSTERRA] SUCCESS: Ad active.");
          else console.warn("[ADSTERRA] WARNING: No ad fill. Showing fallback.");
        }, 3000);
      };

      adRef.current.appendChild(configScript);
      adRef.current.appendChild(adScript);
    }
  }, []);

  return (
    <div className="flex flex-col items-center my-8 py-4 border-y border-zinc-900/50 bg-zinc-950/30">
      <span className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.4em] mb-4">
        — Sponsored Transmission —
      </span>
      
      <div className="relative rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900 shadow-2xl min-h-[250px] min-w-[300px] flex items-center justify-center group">
        {/* 1. THE ACTUAL AD (Top Layer) */}
        <div ref={adRef} className="z-20 relative" />

        {/* 2. THE CHANNEL FALLBACK (Visible if ad is blank) */}
        <a 
          href="https://youtube.com/@yourchannel" // REPLACE WITH YOUR LINK
          target="_blank" 
          rel="noopener noreferrer"
          className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center space-y-4 bg-zinc-900 hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 group-hover:scale-110 transition-transform duration-500">
            <Youtube className="w-7 h-7 text-red-500" />
          </div>
          
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
              Signal Interrupted
            </p>
            <p className="text-xs text-white font-black uppercase tracking-widest bg-red-600 px-4 py-2 rounded-lg shadow-lg">
              SUBSCRIBE TO CHANNEL
            </p>
            <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-tighter">
              Bypass encryption to join the source
            </p>
          </div>
        </a>
      </div>
    </div>
  );
});
AdsterraBanner.displayName = "AdsterraBanner";

function ChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomid = searchParams.get("id") || "";
  
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [nickname, setNickname] = useState("");
  const [myFingerprint, setMyFingerprint] = useState<string | null>(null);
  const [partnerNickname, setPartnerNickname] = useState<string | null>(null);
  const [partnerFingerprint, setPartnerFingerprint] = useState<string | null>(null);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isPartnerTyping]);

  useEffect(() => {
    const savedName = sessionStorage.getItem("murmur_nickname");
    if (!savedName || !roomid) {
      router.push("/");
      return;
    }
    setNickname(savedName);
  }, [roomid, router]);

  useEffect(() => {
    if (!roomid || !nickname) return;

    const setupChat = async () => {
      const fpLoad = await FingerprintJS.load();
      const result = await fpLoad.get();
      const visitorId = result.visitorId;
      setMyFingerprint(visitorId);

      const channel = supabase.channel(`room_${roomid}`, {
        config: { presence: { key: nickname } }
      });

      channelRef.current = channel;

      channel
        .on("presence", { event: "sync" }, () => {
          const state = channel.presenceState();
          const otherUserKey = Object.keys(state).find(k => k !== nickname);
          
          if (otherUserKey) {
            const partnerData: any = state[otherUserKey][0];
            setPartnerNickname(otherUserKey);
            setPartnerFingerprint(partnerData?.fp || null);
            setIsPartnerTyping(partnerData?.isTyping || false);
          } else {
            setPartnerNickname(null);
            setPartnerFingerprint(null);
            setIsPartnerTyping(false);
          }
        })
        .on("postgres_changes" as any, { 
          event: "INSERT", schema: "public", table: "messages", filter: `room_id=eq.${roomid}` 
        }, (payload: any) => {
          setMessages((prev) => [...prev, payload.new]);
        })
        .on("postgres_changes" as any, { 
          event: "DELETE", schema: "public", table: "rooms", filter: `id=eq.${roomid}` 
        }, () => {
          router.replace("/matching");
        })
        .subscribe(async (status: string) => {
          if (status === "SUBSCRIBED") {
            await channel.track({ 
              isTyping: false,
              fp: visitorId,
              online_at: new Date().toISOString() 
            });
          }
        });
    };

    setupChat();

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [roomid, nickname, router]);

  const handleInputChange = (val: string) => {
    setNewMessage(val);
    if (channelRef.current) {
      channelRef.current.track({
        isTyping: val.length > 0,
        online_at: new Date().toISOString(),
        fp: myFingerprint 
      });
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !roomid) return;

    const content = newMessage;
    setNewMessage(""); 

    if (channelRef.current) {
      channelRef.current.track({ isTyping: false, fp: myFingerprint });
    }

    const { data: roomExists } = await supabase.from("rooms").select("id").eq("id", roomid).single();
    if (!roomExists) {
      router.replace("/matching");
      return;
    }

    await supabase.from("messages").insert([{ 
      room_id: roomid, 
      nickname: nickname, 
      content: content 
    }]);
  };

  const handleSkip = async () => {
    if (!roomid) return;
    await supabase.from("messages").delete().eq("room_id", roomid);
    await supabase.from("rooms").delete().eq("id", roomid);
    router.replace("/matching"); 
  };

  const handleExit = async () => {
    if (roomid) {
      await supabase.from("messages").delete().eq("room_id", roomid);
      await supabase.from("rooms").delete().eq("id", roomid);
    }
    sessionStorage.removeItem("murmur_nickname");
    router.push("/"); 
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-zinc-950 text-zinc-100 overflow-hidden selection:bg-blue-500/30">
      
      {/* REPORT MODAL */}
      <AnimatePresence>
        {showReportModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl w-full max-w-sm shadow-2xl">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-red-500"><Flag className="w-5 h-5"/> Report User</h3>
              <div className="space-y-3 mb-6">
                {["Inappropriate Behavior", "Spamming", "Harassment", "Other"].map((r) => (
                  <button key={r} onClick={() => setReportReason(r)} className={`w-full p-3 rounded-xl border text-xs font-bold transition-all uppercase tracking-widest ${reportReason === r ? "bg-red-600 border-red-500 text-white" : "bg-zinc-800 border-zinc-700 text-zinc-400"}`}>
                    {r}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setShowReportModal(false); handleSkip(); }} className="flex-1 bg-white text-black py-3 rounded-xl font-black text-xs uppercase tracking-widest">SUBMIT & SKIP</button>
                <button onClick={() => setShowReportModal(false)} className="px-5 bg-zinc-800 py-3 rounded-xl font-bold text-sm text-zinc-400"><X className="w-4 h-4" /></button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="h-20 shrink-0 border-b border-zinc-800/50 bg-zinc-900/40 backdrop-blur-xl flex items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
            <Zap className="w-5 h-5 text-blue-400" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-sm md:text-lg truncate max-w-[150px] md:max-w-none">
                {partnerNickname || "Connecting..."}
            </h2>
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${partnerNickname ? "bg-green-500 animate-pulse" : "bg-zinc-600"}`} />
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                {partnerNickname ? "SECURE" : "ENCRYPTING"}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowReportModal(true)} className="h-10 w-10 flex items-center justify-center rounded-xl border border-zinc-800 text-zinc-600 hover:text-red-500 transition-all"><Flag className="w-4 h-4" /></button>
          <button onClick={handleSkip} className="h-10 px-4 rounded-xl bg-white text-black text-xs font-black flex items-center gap-2 active:scale-95 transition-all"><RefreshCw className="w-4 h-4" /> SKIP</button>
          <button onClick={handleExit} className="h-10 w-10 flex items-center justify-center rounded-xl border border-zinc-800 text-zinc-500 active:scale-95 transition-all"><LogOut className="w-4 h-4" /></button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 no-scrollbar overscroll-none">
        <AnimatePresence>
          {!partnerNickname && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-full text-zinc-600 space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Establishing link...</p>
            </motion.div>
          )}
        </AnimatePresence>

        {messages.map((msg, i) => (
          <div key={i}>
            <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={`max-w-[85%] md:max-w-[75%] flex flex-col ${msg.nickname === nickname ? "ml-auto items-end" : "items-start"}`}>
              <span className="text-[10px] font-bold text-zinc-500 mb-1 uppercase tracking-tighter">{msg.nickname}</span>
              <div className={`px-4 py-3 rounded-2xl text-[15px] md:text-[16px] shadow-lg leading-relaxed ${
                msg.nickname === nickname ? "bg-blue-600 text-white rounded-tr-none" : "bg-zinc-900 border border-zinc-800 rounded-tl-none"
              }`}>
                {msg.content}
              </div>
            </motion.div>

            {(i + 1) % 10 === 0 && <AdsterraBanner />}
          </div>
        ))}
        <div ref={scrollRef} className="h-4" />
      </div>

      <div className="shrink-0 p-4 md:p-8 bg-zinc-950/50 backdrop-blur-md border-t border-zinc-900/80 safe-bottom">
        <div className="max-w-5xl mx-auto">
          <AnimatePresence>
            {isPartnerTyping && (
              <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-2 ml-1">
                Partner is typing...
              </motion.div>
            )}
          </AnimatePresence>
          <form onSubmit={sendMessage} className="relative flex items-center gap-2">
            <input 
              type="text" 
              disabled={!partnerNickname}
              value={newMessage} 
              onChange={(e) => handleInputChange(e.target.value)} 
              placeholder={partnerNickname ? "Type a message..." : "Waiting for connection..."} 
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-4 pr-14 py-4 outline-none text-[16px] text-white focus:border-blue-500/50 transition-all disabled:opacity-30" 
            />
            <button type="submit" disabled={!partnerNickname || !newMessage.trim()} className="absolute right-2 p-3 bg-blue-600 text-white rounded-xl active:scale-90 disabled:opacity-0 transition-all shadow-lg">
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function RandomChat() {
  return (
    <Suspense fallback={<div className="h-[100dvh] bg-zinc-950 flex items-center justify-center text-zinc-500"><Loader2 className="animate-spin" /></div>}>
      <ChatContent />
    </Suspense>
  );
}
