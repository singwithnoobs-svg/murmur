"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Reply, X, Globe, CornerDownRight, AlertCircle, ArrowLeft, Zap } from "lucide-react";
import Link from "next/link";

const getUserColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return `hsl(${Math.abs(hash) % 360}, 85%, 70%)`;
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
        setMessages((m) => [...m, payload].slice(-100));
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") await channel.track({ online_at: new Date().toISOString() });
      });

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Scroll to bottom whenever messages update
  useEffect(() => { 
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (cooldown > 0) {
      const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [cooldown]);

  const sendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const now = Date.now();
    if (now - lastSent.current < 5000) { setShowToast(true); setTimeout(() => setShowToast(false), 3000); return; }
    if (!input.trim()) return;

    const payload = {
      id: crypto.randomUUID(),
      nickname,
      content: input.trim(),
      timestamp: new Date().toISOString(),
      reply_to: replyTo ? { nickname: replyTo.nickname, content: replyTo.content } : null,
    };

    await channelRef.current.send({ type: "broadcast", event: "CHAT", payload });
    setMessages((m) => [...m, payload].slice(-100));
    setInput("");
    setReplyTo(null);
    lastSent.current = now;
    setCooldown(5);
  };

  return (
    // Main Container: Fixed at 100vh, no scroll on body
    <div className="flex flex-col h-screen w-full bg-[#05010a] text-zinc-100 overflow-hidden relative">
      
      {/* BACKGROUND DECOR */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/10 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-900/10 blur-[120px]" />
      </div>

      {/* TOAST */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 10 }} exit={{ opacity: 0, y: -20 }}
            className="absolute top-24 left-1/2 -translate-x-1/2 z-[100] bg-red-600 px-6 py-2 rounded-full flex items-center gap-2 shadow-2xl text-[12px] font-black uppercase tracking-widest"
          >
            <AlertCircle className="w-4 h-4" /> Wait {cooldown}s
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. HEADER (Fixed Height) */}
      <header className="relative z-10 h-20 border-b border-purple-500/10 bg-black/40 backdrop-blur-xl flex items-center justify-between px-8 shrink-0">
        <div className="flex items-center gap-6">
          <Link href="/" className="p-3 bg-white/5 hover:bg-purple-600/20 rounded-2xl transition-all border border-white/5">
            <ArrowLeft className="w-6 h-6 text-zinc-400" />
          </Link>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-purple-500 animate-pulse" />
              <h2 className="font-black text-[14px] uppercase tracking-[0.5em]">Global_Network</h2>
            </div>
            <span className="text-[10px] font-black text-purple-400/40 uppercase">Latency: 12ms</span>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-purple-500/5 px-4 py-2 rounded-full border border-purple-500/10">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
          <span className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">{onlineCount} Nodes</span>
        </div>
      </header>

      {/* 2. CHAT STREAM (Scrollable Area) */}
      <main className="flex-1 overflow-y-auto z-10 no-scrollbar py-10 px-6">
        <div className="max-w-3xl mx-auto space-y-8">
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const isMe = msg.nickname === nickname;
              const userColor = isMe ? "#c084fc" : getUserColor(msg.nickname);

              return (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`
                    relative max-w-[85%] px-8 py-6 rounded-[2.5rem] transition-all border shadow-2xl
                    ${isMe ? "bg-purple-600/10 border-purple-500/30 rounded-tr-none" : "bg-zinc-900/60 border-white/[0.05] rounded-tl-none"}
                  `}>
                    {msg.reply_to && (
                      <div className="flex items-center gap-3 mb-4 p-4 bg-black/40 rounded-2xl border-l-4 border-purple-500/50">
                        <CornerDownRight className="w-4 h-4 text-purple-500 shrink-0" />
                        <span className="text-[13px] text-zinc-500 truncate">
                          <b style={{ color: getUserColor(msg.reply_to.nickname) }}>@{msg.reply_to.nickname}</b>: {msg.reply_to.content}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-2 gap-8">
                      <button 
                        onClick={() => setReplyTo(msg)}
                        className="text-[13px] font-black uppercase tracking-widest hover:brightness-125 transition-all" 
                        style={{ color: userColor }}
                      >
                        {msg.nickname}
                      </button>
                      <button onClick={() => setReplyTo(msg)} className="opacity-0 group-hover:opacity-100 p-1 text-zinc-600 hover:text-purple-400 transition-all">
                        <Reply className="w-4 h-4" />
                      </button>
                    </div>

                    <p className={`text-[18px] leading-relaxed ${isMe ? "text-purple-50" : "text-zinc-200"}`}>
                      {msg.content}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          <div ref={scrollRef} className="h-4" />
        </div>
      </main>

      {/* 3. INPUT AREA (Fixed at Bottom) */}
      <footer className="relative z-10 p-8 bg-black/60 backdrop-blur-3xl border-t border-purple-500/10 shrink-0">
        <div className="max-w-2xl mx-auto">
          <AnimatePresence>
            {replyTo && (
              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="bg-purple-600/20 border border-purple-500/30 border-b-0 rounded-t-[2rem] px-8 py-3 flex justify-between items-center overflow-hidden">
                <span className="text-[11px] text-purple-300 font-black uppercase tracking-widest">Replying to {replyTo.nickname}</span>
                <X className="w-4 h-4 text-purple-300 cursor-pointer" onClick={() => setReplyTo(null)} />
              </motion.div>
            )}
          </AnimatePresence>
          
          <form onSubmit={sendMessage} className={`
            flex items-center bg-zinc-900/90 border p-2 shadow-2xl transition-all duration-300
            ${replyTo ? "rounded-b-[2rem] border-purple-500/40" : "rounded-[2.5rem] border-white/10"}
            focus-within:border-purple-500/60
          `}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Inject protocol..."
              className="flex-1 bg-transparent px-8 py-4 text-[17px] outline-none placeholder:text-zinc-700 placeholder:uppercase placeholder:text-[10px] placeholder:tracking-widest"
            />
            <button type="submit" className="p-5 bg-purple-600 text-white rounded-[2rem] hover:bg-purple-500 transition-all shadow-lg shadow-purple-600/20">
              <Send className="w-6 h-6" />
            </button>
          </form>
        </div>
      </footer>
    </div>
  );
}
