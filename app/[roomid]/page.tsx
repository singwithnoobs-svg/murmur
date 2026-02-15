"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Hash, Send, LogOut, Copy, Check, Flag, X, Terminal, ChevronDown, SmilePlus, Reply } from "lucide-react";
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { Share2 } from "lucide-react";

export default function ChatRoom() {
  const params = useParams();
  const roomid = typeof params?.roomid === 'string' ? params.roomid : "";
  const router = useRouter();

  // Core State
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [nickname, setNickname] = useState("");
  const [myFingerprint, setMyFingerprint] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false); 
  const [copied, setCopied] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [activeReactionPicker, setActiveReactionPicker] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<any>(null);
  
  // Reporting State
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [extraReason, setExtraReason] = useState(""); 
  const [isReporting, setIsReporting] = useState(false);

  // Refs
  const scrollRef = useRef<HTMLDivElement>(null); 
  const chatAreaRef = useRef<HTMLDivElement>(null); 
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const channelRef = useRef<any>(null);

  const isImageUrl = (url: string) => url.match(/\.(jpeg|jpg|gif|png|webp)$/) != null;
  const isAudioUrl = (url: string) => url.match(/\.(ogg|wav|mp3)/) != null;

  useEffect(() => {
    const savedName = sessionStorage.getItem("murmur_nickname");
    if (!savedName) { router.push("/"); return; }
    setNickname(savedName);
  }, [router]);

  useEffect(() => {
    if (!roomid || !nickname) return;
    const setupChat = async () => {
      const fpLoad = await FingerprintJS.load();
      const result = await fpLoad.get();
      setMyFingerprint(result.visitorId);
      await supabase.from("rooms").upsert({ id: roomid }, { onConflict: 'id' });
      const channel = supabase.channel(`room-${roomid}`, { config: { presence: { key: nickname } } });
      channelRef.current = channel;
      channel
        .on("presence", { event: "sync" }, () => {
          const state = channel.presenceState();
          setOnlineCount(Object.keys(state).length);
          setTypingUsers(Object.keys(state).filter(k => k !== nickname && (state[k] as any)[0]?.isTyping));
        })
        .on("postgres_changes" as any, { event: "*", schema: "public", table: "messages", filter: `room_id=eq.${roomid}` }, (event: any) => {
          if (event.eventType === "INSERT") setMessages((prev) => [...prev, event.new]);
          if (event.eventType === "UPDATE") setMessages((prev) => prev.map(m => m.id === event.new.id ? event.new : m));
          if (event.eventType === "DELETE") setMessages((prev) => prev.filter(m => m.id !== event.old.id));
        })
        .subscribe(async (s: string) => { if (s === "SUBSCRIBED") await channel.track({ isTyping: false, fp: result.visitorId }); });
    };
    setupChat();
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current); };
  }, [roomid, nickname]);

  const handleExit = async () => {
    try {
      await supabase.from("messages").delete().eq("room_id", roomid).eq("nickname", nickname);
      if (onlineCount <= 1) await supabase.from("rooms").delete().eq("id", roomid);
      sessionStorage.removeItem("murmur_nickname");
      router.push("/");
    } catch (err) { router.push("/"); }
  };

  const submitReport = async () => {
    if (!reportReason || isReporting) return;
    setIsReporting(true);
    try {
      const presence = channelRef.current?.presenceState() || {};
      const lastOtherMessage = [...messages].reverse().find(m => m.nickname !== nickname);
      const targetNickname = lastOtherMessage?.nickname || "Unknown";
      const targetFp = presence[targetNickname]?.[0]?.fp || "Hidden_Node";
      const logs = messages.slice(-20).map(msg => ({ nickname: msg.nickname, content: msg.content }));
      await supabase.from("reports").insert([{ reported_user: targetNickname, fingerprint: targetFp, reason: `${reportReason}: ${extraReason}`, chat_log: logs, room_id: roomid }]);
      setShowReportModal(false); setReportReason(""); setExtraReason("");
    } catch (err) { console.error(err); } finally { setIsReporting(false); }
  };

  const addReaction = async (messageId: string, currentReactions: any, emoji: string) => {
    const updated = { ...(currentReactions || {}) };
    updated[emoji] = (updated[emoji] || 0) + 1;
    await supabase.from("messages").update({ reactions: updated }).eq("id", messageId);
    setActiveReactionPicker(null);
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    const content = newMessage;
    const replyData = replyTo ? { nickname: replyTo.nickname, content: replyTo.content } : null; 
    setNewMessage(""); 
    setReplyTo(null); 
    if (channelRef.current) channelRef.current.track({ isTyping: false, fp: myFingerprint });
    await supabase.from("messages").insert([{ room_id: roomid, nickname, content, reactions: {}, reply_metadata: replyData }]);
  };

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, typingUsers]);

const handleShare = async () => {
  const shareUrl = `${window.location.origin}/?id=${roomid}`;
  
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'Join Murmur Node',
        text: `Secure connection requested. Join my room:`,
        url: shareUrl,
      });
    } catch (err) {
      console.log("Share failed:", err);
    }
  } else {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }
};

  return (
    <div className="fixed inset-0 flex flex-col bg-[#050507] text-zinc-100 overflow-hidden font-sans">
      
      {/* MODALS */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
            <div className="bg-zinc-900 border border-purple-500/20 p-8 rounded-[2.5rem] w-full max-w-sm text-center">
              <LogOut className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-black mb-6 uppercase italic tracking-tighter">Exit Room?</h3>
              <div className="flex gap-3">
                <button onClick={handleExit} className="flex-1 bg-red-600 py-4 rounded-xl font-black text-xs uppercase active:scale-95">Exit</button>
                <button onClick={() => setShowConfirm(false)} className="flex-1 bg-zinc-800 py-4 rounded-xl font-black text-xs uppercase">Stay</button>
              </div>
            </div>
          </div>
        )}

        {showReportModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
            <div className="bg-zinc-900 border border-purple-500/20 p-8 rounded-[2rem] w-full max-w-md">
              <h3 className="text-xl font-black mb-6 text-red-500 uppercase italic">Report Node</h3>
              <div className="grid grid-cols-2 gap-2 mb-6">
                {["Harassment", "Spam", "NSFW", "Toxic"].map((r) => (
                  <button key={r} onClick={() => setReportReason(r)} className={`p-4 rounded-xl border text-[10px] font-black uppercase ${reportReason === r ? "bg-red-600 border-red-500" : "bg-black border-zinc-800"}`}>{r}</button>
                ))}
              </div>
              <textarea value={extraReason} onChange={(e) => setExtraReason(e.target.value)} placeholder="Details..." className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-sm mb-6 outline-none" />
              <div className="flex gap-3">
                <button onClick={submitReport} className="flex-1 bg-white text-black py-4 rounded-xl font-black text-xs uppercase">{isReporting ? "..." : "Submit"}</button>
                <button onClick={() => setShowReportModal(false)} className="px-6 bg-zinc-800 rounded-xl"><X className="w-5 h-5" /></button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* HEADER */}
      <header className="h-20 border-b border-purple-500/10 bg-black/40 backdrop-blur-md flex items-center justify-between px-5 shrink-0 z-50">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 bg-purple-600/20 rounded-xl flex items-center justify-center border border-purple-500/20"><Hash className="w-5 h-5 text-purple-400" /></div>
          <div className="truncate">
            <h2 className="font-black text-sm uppercase italic tracking-tight truncate">{roomid}</h2>
            <span className="flex items-center gap-1.5 text-[10px] text-green-500 font-bold uppercase tracking-widest"><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> {onlineCount} Nodes</span>
          </div>
        </div>
       <div className="flex items-center gap-2">
  <button onClick={() => setShowReportModal(true)} className="h-12 w-12 flex items-center justify-center rounded-2xl border border-white/5 bg-zinc-900/50 text-zinc-400 hover:text-red-500 active:scale-90 transition-all">
    <Flag className="w-6 h-6" />
  </button>
  
  <button onClick={() => setShowConfirm(true)} className="h-12 w-12 flex items-center justify-center rounded-2xl border border-white/5 bg-zinc-900/50 text-zinc-400 hover:text-purple-400 active:scale-90 transition-all">
    <LogOut className="w-6 h-6" />
  </button>

  {/* NEW INVITE/SHARE BUTTON */}
  <button 
    onClick={handleShare} 
    className="h-12 px-4 rounded-2xl border border-purple-500/30 bg-purple-600/10 flex items-center gap-2 text-xs font-black uppercase text-purple-400 active:scale-95 transition-all"
  >
    {copied ? (
      <Check className="w-4 h-4 text-green-500" />
    ) : (
      <Share2 className="w-4 h-4" /> 
    )} 
    <span className="hidden sm:inline">{copied ? "Copied" : "Invite"}</span>
  </button>
</div>
      </header>

      {/* CHAT AREA */}
      <div ref={chatAreaRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 no-scrollbar relative">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((msg) => {
            const isMe = msg.nickname === nickname;
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                <span className={`text-[9px] font-black mb-1 px-1 uppercase ${isMe ? "text-purple-500" : "text-zinc-600"}`}>{msg.nickname}</span>
                <div className={`group relative flex items-center gap-2 max-w-[90%] ${isMe ? "flex-row-reverse" : ""}`}>
                  <div className={`px-4 py-2.5 rounded-2xl text-[15px] shadow-lg ${isMe ? "bg-purple-600 text-white rounded-tr-none" : "bg-zinc-900 border border-purple-500/5 text-zinc-200 rounded-tl-none"}`}>
                    {msg.reply_metadata && <div className="mb-2 p-2 rounded-lg bg-black/20 border-l-2 border-white/20 text-[11px] opacity-60 italic truncate">{msg.reply_metadata.content}</div>}
                    {isAudioUrl(msg.content) ? <audio controls className="h-8 w-48 invert brightness-90 opacity-70"><source src={msg.content} /></audio> : <div className="whitespace-pre-wrap break-words leading-snug">{msg.content}</div>}
                  </div>
                  <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => setReplyTo(msg)} className="p-1 text-zinc-600 hover:text-white"><Reply className="w-4 h-4" /></button>
                    <button onClick={() => setActiveReactionPicker(msg.id)} className="p-1 text-zinc-600 hover:text-purple-400"><SmilePlus className="w-4 h-4" /></button>
                  </div>
                  {activeReactionPicker === msg.id && (
                    <div className="absolute -top-10 z-50 bg-zinc-900 border border-purple-500/20 p-1 rounded-xl flex gap-1 shadow-2xl">
                      {["🔥", "❤️", "😂", "🫡"].map(e => (
                        <button key={e} onClick={() => addReaction(msg.id, msg.reactions, e)} className="w-8 h-8 text-base hover:bg-white/5 rounded-lg">{e}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {typingUsers.length > 0 && <div className="text-[9px] font-black text-purple-500 animate-pulse uppercase px-2">Signal Inbound...</div>}
          <div ref={scrollRef} className="h-4" />
        </div>
      </div>

      {/* INPUT AREA */}
      <div className="p-4 md:p-8 bg-zinc-950/60 border-t border-purple-500/10 shrink-0 backdrop-blur-md">
        <div className="max-w-3xl mx-auto">
          {replyTo && (
            <div className="mb-2 px-4 py-2 bg-zinc-900/50 rounded-t-2xl flex items-center justify-between border-x border-t border-purple-500/10">
              <p className="text-[10px] text-zinc-500 truncate italic">Replying to {replyTo.nickname}</p>
              <X className="w-4 h-4 text-zinc-600 cursor-pointer" onClick={() => setReplyTo(null)} />
            </div>
          )}
          <div className={`flex items-end gap-2 bg-zinc-900/80 border border-white/5 p-2 transition-all ${replyTo ? 'rounded-b-2xl' : 'rounded-[2rem]'} focus-within:border-purple-500/30`}>
            <textarea
              ref={textareaRef}
              rows={1}
              value={newMessage}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Inject signal..."
              className="flex-1 bg-transparent border-none outline-none text-[16px] py-3 px-4 resize-none max-h-32 placeholder:text-zinc-700 no-scrollbar"
            />
            <div className="flex items-center gap-2 pr-1 pb-1">
              {/* VOICE RECORDER RESTORED */}
              <VoiceRecorder onUploadComplete={async (url) => {
                await supabase.from("messages").insert([{ room_id: roomid, nickname, content: url, reactions: {}, reply_metadata: replyTo }]);
                setReplyTo(null);
              }} />
              <button onClick={sendMessage} className="p-4 bg-white text-black rounded-2xl active:scale-90 transition-all shadow-lg shadow-black/40"><Send className="w-5 h-5" /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
