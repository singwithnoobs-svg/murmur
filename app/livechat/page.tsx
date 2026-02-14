"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Reply, X, Globe, CornerDownRight, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

/* ---------------- COLOR ENGINE ---------------- */
const getUserColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return `hsl(${Math.abs(hash) % 360}, 75%, 65%)`;
};

export default function GlobalChat() {
  const [nickname, setNickname] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [replyTo, setReplyTo] = useState<any>(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  const [showToast, setShowToast] = useState(false);

  const lastSent = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    const realName = localStorage.getItem("murmur_nickname") || `User_${Math.random().toString(36).slice(2, 5)}`;
    setNickname(realName);

    const channel = supabase.channel("global_pro_v1", { config: { presence: { key: realName } } });
    channelRef.current = channel;

    channel
      .on("presence", { event: "sync" }, () => setOnlineCount(Object.keys(channel.presenceState()).length))
      .on("broadcast", { event: "CHAT" }, ({ payload }) => {
        setMessages((m) => {
          const newMessages = [...m, payload];
          return newMessages.slice(-100);
        });
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") await channel.track({ online_at: new Date().toISOString() });
      });

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: "auto" }); }, [messages]);

  useEffect(() => {
    if (cooldown > 0) {
      const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [cooldown]);

  const sendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const now = Date.now();
    
    if (now - lastSent.current < 5000) {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    if (!input.trim()) return;

    const payload = {
      id: crypto.randomUUID(),
      nickname,
      content: input.trim(),
      timestamp: new Date().toISOString(),
      reply_to: replyTo ? { nickname: replyTo.nickname, content: replyTo.content } : null,
    };

    await channelRef.current.send({ type: "broadcast", event: "CHAT", payload });
    
    setMessages((m) => {
      const next = [...m, payload];
      return next.slice(-100);
    });

    setInput("");
    setReplyTo(null);
    lastSent.current = now;
    setCooldown(5);
  };

  return (
    <div className="relative flex flex-col h-[100dvh] bg-[#020202] text-zinc-100 font-sans overflow-hidden">
      
      {/* TOAST POPUP */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 20 }} exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-[100] bg-red-600 text-white px-5 py-2 rounded-full flex items-center gap-2 shadow-2xl text-[12px] font-black uppercase tracking-tighter"
          >
            <AlertCircle className="w-4 h-4" /> Wait {cooldown}s
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER */}
      <header className="relative z-10 h-14 border-b border-white/5 bg-black/40 backdrop-blur-md flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 -ml-2 hover:bg-white/5 rounded-full transition-colors group">
            <ArrowLeft className="w-5 h-5 text-zinc-500 group-hover:text-white transition-colors" />
          </Link>
          
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-purple-500" />
            <h2 className="font-black text-[10px] uppercase tracking-[0.4em]">Global</h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-zinc-600 tracking-widest">{onlineCount} NODES</span>
        </div>
      </header>

      {/* CHAT STREAM */}
      <div className="relative z-10 flex-1 overflow-y-auto pt-4 no-scrollbar">
        <div className="max-w-[85%] mx-auto space-y-2.5">
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const isMe = msg.nickname === nickname;
              const userColor = isMe ? "#a855f7" : getUserColor(msg.nickname);
              const mentionedMe = msg.reply_to?.nickname === nickname;

              return (
                <motion.div key={msg.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="group">
                  <div className={`
                    relative px-4 py-3 rounded-2xl transition-all border
                    ${isMe ? "bg-purple-600/5 border-purple-500/20" : "bg-zinc-900/40 border-white/[0.03]"}
                    ${mentionedMe ? "ring-1 ring-amber-500/50 bg-amber-500/5" : ""}
                  `}>
                    {msg.reply_to && (
                      <div className="flex items-center gap-2 mb-2 p-2 bg-black/40 rounded-lg border-l-2 border-purple-500/50">
                        <CornerDownRight className="w-3 h-3 text-purple-500 shrink-0" />
                        <span className="text-[11px] text-zinc-500 truncate italic">
                          <b style={{ color: getUserColor(msg.reply_to.nickname) }}>@{msg.reply_to.nickname}</b>: {msg.reply_to.content}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-0.5">
                      <button 
                        onClick={() => setReplyTo(msg)}
                        className="text-[10px] font-black uppercase tracking-widest hover:underline text-left" 
                        style={{ color: userColor }}
                      >
                        {msg.nickname}
                      </button>
                      <button onClick={() => setReplyTo(msg)} className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-white transition-all">
                        <Reply className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className={`text-[15px] leading-snug ${isMe ? "text-purple-50" : "text-zinc-300"}`}>
                      {msg.content}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          <div ref={scrollRef} className="h-6" />
        </div>
      </div>

      {/* INPUT AREA */}
      <div className="relative z-10 p-6 bg-black/90 backdrop-blur-2xl border-t border-white/5">
        <div className="max-w-[85%] mx-auto">
          <AnimatePresence>
            {replyTo && (
              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="bg-purple-600/10 border border-purple-500/20 border-b-0 rounded-t-xl px-4 py-2 flex justify-between items-center overflow-hidden">
                <span className="text-[10px] text-zinc-500 font-bold uppercase truncate">Replying to {replyTo.nickname}</span>
                <X className="w-4 h-4 text-zinc-500 cursor-pointer" onClick={() => setReplyTo(null)} />
              </motion.div>
            )}
          </AnimatePresence>
          <form onSubmit={sendMessage} className="flex items-center bg-zinc-900/60 border border-white/10 p-1.5 rounded-2xl group focus-within:border-purple-500/40 transition-all">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Broadcast..."
              className="flex-1 bg-transparent px-4 py-3 text-sm outline-none"
            />
            <button type="submit" className="p-3 bg-white text-black rounded-xl hover:bg-purple-500 hover:text-white transition-all">
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
