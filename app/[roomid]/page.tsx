"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Hash, Send, Trash2, AlertTriangle, LogOut, Copy, Check } from "lucide-react";

export default function ChatRoom() {
  const params = useParams();
  const roomid = typeof params?.roomid === 'string' ? params.roomid : "";
  const router = useRouter();

  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [nickname, setNickname] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [copied, setCopied] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handlePurgeAndExit = async (targetNickname: string, targetRoomId: string) => {
    if (!targetRoomId || !targetNickname) return;
    try {
      await supabase.from("messages").delete().eq("room_id", targetRoomId).eq("nickname", targetNickname);
      const { data: remaining } = await supabase.from("messages").select("id").eq("room_id", targetRoomId);
      if (!remaining || remaining.length === 0) {
        await supabase.from("rooms").delete().eq("id", targetRoomId);
      }
    } catch (error) {
      console.error("Cleanup failed:", error);
    }
  };

  useEffect(() => {
    const savedName = sessionStorage.getItem("murmur_nickname");
    if (!savedName) {
      router.push("/");
      return;
    }
    setNickname(savedName);
  }, [router]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setMessages((prev) => 
        prev.filter((m) => !m.isSystem || (now - (m.timestamp || 0) < 30000))
      );
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!roomid || !nickname) return;

    const fetchMessages = async () => {
      const { data } = await supabase.from("messages").select("*").eq("room_id", roomid).order("created_at", { ascending: true });
      if (data) setMessages(data);
    };
    fetchMessages();

    const channel = supabase.channel(`room-${roomid}`, {
      config: { presence: { key: nickname } }
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        setOnlineCount(Object.keys(state).length);
      })
      .on("presence", { event: "join" }, (payload: any) => {
        if (payload.key !== nickname) {
          setMessages((prev) => [...prev, { id: `j-${Date.now()}`, content: `${payload.key} joined`, isSystem: true, timestamp: Date.now() }]);
        }
      })
      .on("presence", { event: "leave" }, (payload: any) => {
        if (payload.key) {
          setMessages((prev) => [...prev, { id: `l-${Date.now()}`, content: `${payload.key} left`, isSystem: true, timestamp: Date.now() }]);
        }
      })
      .on("postgres_changes" as any, { 
        event: "*", schema: "public", table: "messages", filter: `room_id=eq.${roomid}` 
      }, (event: any) => {
        if (event.eventType === "INSERT") setMessages((prev) => [...prev, event.new]);
        if (event.eventType === "DELETE") setMessages((prev) => prev.filter(m => m.id !== event.old.id));
      })
      .subscribe(async (status: string) => {
        if (status === "SUBSCRIBED") await channel.track({ online_at: new Date().toISOString() });
      });

    return () => {
      supabase.removeChannel(channel);
      handlePurgeAndExit(nickname, roomid);
    };
  }, [roomid, nickname]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomid || !newMessage.trim()) return;
    const content = newMessage;
    setNewMessage(""); 
    await supabase.from("messages").insert([{ room_id: roomid, nickname, content }]);
  };

  const copyInvite = () => {
    if (!roomid) return;
    const inviteUrl = `${window.location.origin}/lobby?id=${roomid}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
      <AnimatePresence>
        {showConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-zinc-900 border border-zinc-800 p-6 md:p-8 rounded-3xl max-w-xs w-full text-center shadow-2xl">
              <div className="w-14 h-14 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6"><AlertTriangle className="w-7 h-7" /></div>
              <h3 className="text-xl font-bold mb-2">End Session?</h3>
              <p className="text-zinc-400 text-xs mb-6 px-4">Your history will be purged immediately.</p>
              <div className="flex flex-col gap-3">
                <button onClick={() => { handlePurgeAndExit(nickname, roomid); router.push("/lobby"); }} className="w-full bg-red-600 py-4 rounded-2xl font-bold flex items-center justify-center gap-2">Confirm <LogOut className="w-4 h-4" /></button>
                <button onClick={() => setShowConfirm(false)} className="w-full bg-zinc-800 py-4 rounded-2xl text-zinc-400 font-bold">Stay</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="h-20 border-b border-zinc-800/50 bg-zinc-900/40 backdrop-blur-xl flex items-center justify-between px-4 md:px-8 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 bg-purple-600/20 rounded-xl flex items-center justify-center border border-purple-500/30 shrink-0">
            <Hash className="w-5 h-5 text-purple-400" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-sm md:text-lg truncate">{roomid}</h2>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{onlineCount} Active</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button onClick={copyInvite} className="h-10 px-3 md:px-5 rounded-xl border border-zinc-800 bg-zinc-900/50 flex items-center gap-2 text-[10px] md:text-sm font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all text-zinc-300">
            {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />} 
            <span className="hidden sm:inline">{copied ? "Copied" : "Invite"}</span>
          </button>
          <button onClick={() => setShowConfirm(true)} className="h-10 w-10 flex items-center justify-center rounded-xl border border-zinc-800 text-zinc-500 hover:text-red-400 active:scale-95"><Trash2 className="w-4 h-4" /></button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 no-scrollbar overscroll-none">
        {messages.map((msg, i) => (
          msg.isSystem ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={msg.id || i} className="flex justify-center my-2">
              <span className="text-[9px] bg-zinc-900/50 border border-zinc-800/30 px-4 py-1.5 rounded-full text-zinc-500 font-bold uppercase tracking-widest">
                {msg.content}
              </span>
            </motion.div>
          ) : (
            <motion.div key={msg.id || i} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={`max-w-[85%] md:max-w-[75%] flex flex-col ${msg.nickname === nickname ? "ml-auto items-end" : "items-start"}`}>
              <span className="text-[10px] font-bold text-zinc-600 mb-1 px-1 tracking-widest uppercase">{msg.nickname}</span>
              <div className={`px-4 py-3 rounded-2xl text-[15px] md:text-[16px] leading-relaxed shadow-lg ${
                msg.nickname === nickname 
                ? "bg-purple-600 text-white rounded-tr-none shadow-purple-900/10" 
                : "bg-zinc-900 border border-zinc-800 rounded-tl-none text-zinc-100"
              }`}>
                {msg.content}
              </div>
            </motion.div>
          )
        ))}
        <div ref={scrollRef} />
      </div>

      <div className="p-4 md:p-8 bg-zinc-950/50 backdrop-blur-md border-t border-zinc-900/80 safe-bottom shrink-0">
        <form onSubmit={sendMessage} className="max-w-5xl mx-auto relative flex items-center gap-2">
          <input 
            type="text" 
            value={newMessage} 
            onChange={(e) => setNewMessage(e.target.value)} 
            placeholder="Whisper into the void..." 
            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-4 pr-14 py-4 outline-none text-[16px] text-white focus:border-purple-500/50 transition-all" 
          />
          <button type="submit" className="absolute right-2 p-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl active:scale-90 transition-all">
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}