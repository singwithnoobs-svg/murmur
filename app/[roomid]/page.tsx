"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Hash, Send, LogOut, Copy, Check, Flag, X, Terminal, ChevronDown, SmilePlus, Reply } from "lucide-react";
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { VoiceRecorder } from "@/components/VoiceRecorder";

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

  const copyInvite = () => {
    const inviteUrl = `${window.location.origin}/?id=${roomid}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [newMessage]);

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

      const channel = supabase.channel(`room-${roomid}`, {
        config: { presence: { key: nickname } }
      });
      channelRef.current = channel;

      channel
        .on("presence", { event: "sync" }, () => {
          const state = channel.presenceState();
          setOnlineCount(Object.keys(state).length);
          const typing = Object.keys(state).filter((key) => {
            const userPresence = state[key] as any;
            return key !== nickname && userPresence[0]?.isTyping;
          });
          setTypingUsers(typing);
        })
        .on("postgres_changes" as any, { 
          event: "*", schema: "public", table: "messages", filter: `room_id=eq.${roomid}` 
        }, (event: any) => {
          if (event.eventType === "INSERT") setMessages((prev) => [...prev, event.new]);
          if (event.eventType === "UPDATE") setMessages((prev) => prev.map(m => m.id === event.new.id ? event.new : m));
          if (event.eventType === "DELETE") setMessages((prev) => prev.filter(m => m.id !== event.old.id));
        })
        .subscribe(async (status: string) => {
          if (status === "SUBSCRIBED") {
            await channel.track({ online_at: new Date().toISOString(), fp: result.visitorId, isTyping: false });
          }
        });
    };

    setupChat();
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current); };
  }, [roomid, nickname]);

  const handleScroll = () => {
    if (chatAreaRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatAreaRef.current;
      setShowScrollButton(scrollHeight - scrollTop - clientHeight > 300);
    }
  };

  const scrollToBottom = () => scrollRef.current?.scrollIntoView({ behavior: "smooth" });

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

      await supabase.from("reports").insert([{
        reported_user: targetNickname, fingerprint: targetFp, reason: `${reportReason}: ${extraReason}`, chat_log: logs, room_id: roomid
      }]);

      setShowReportModal(false);
      setReportReason("");
      setExtraReason("");
      alert("Sector violation logged.");
    } catch (err) { console.error(err); } finally { setIsReporting(false); }
  };

  const addReaction = async (messageId: string, currentReactions: any, emoji: string) => {
    const updated = { ...(currentReactions || {}) };
    updated[emoji] = (updated[emoji] || 0) + 1;
    await supabase.from("messages").update({ reactions: updated }).eq("id", messageId);
    setActiveReactionPicker(null);
  };

  const sendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!roomid || !newMessage.trim()) return;
    const content = newMessage;
    const replyData = replyTo ? { nickname: replyTo.nickname, content: replyTo.content } : null; 
    
    setNewMessage(""); 
    setReplyTo(null); 
    
    if (channelRef.current) channelRef.current.track({ isTyping: false, fp: myFingerprint });
    await supabase.from("messages").insert([{ 
      room_id: roomid, 
      nickname, 
      content, 
      reactions: {}, 
      reply_metadata: replyData 
    }]);
  };

  useEffect(() => { scrollToBottom(); }, [messages, typingUsers]);

  return (
    <div className="fixed inset-0 flex flex-col bg-[#08080a] text-zinc-100 font-sans overflow-hidden">
      
      <AnimatePresence>
        {showConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-zinc-900 border border-purple-500/20 p-10 rounded-[2.5rem] w-full max-w-md shadow-2xl text-center">
              <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                <LogOut className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-2xl font-black mb-2 uppercase italic tracking-tighter">Terminate Session?</h3>
              <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest mb-10">Connection will be purged</p>
              <div className="flex gap-4">
                <button onClick={handleExit} className="flex-1 bg-red-600 hover:bg-red-500 py-5 rounded-2xl font-black text-xs uppercase transition-all">Exit Room</button>
                <button onClick={() => setShowConfirm(false)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 py-5 rounded-2xl font-black text-xs uppercase transition-all">Stay</button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showReportModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
            <div className="bg-zinc-900 border border-purple-500/20 p-10 rounded-[3rem] w-full max-w-md">
              <h3 className="text-2xl font-black mb-8 text-red-500 uppercase italic flex items-center gap-4"><Flag className="w-6 h-6" /> Report User</h3>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {["Harassment", "Spam", "NSFW", "Toxic"].map((r) => (
                  <button key={r} onClick={() => setReportReason(r)} className={`p-5 rounded-2xl border text-xs font-black uppercase transition-all ${reportReason === r ? "bg-red-600 border-red-500 text-white" : "bg-black border-zinc-800 text-zinc-600"}`}>{r}</button>
                ))}
              </div>
              <textarea value={extraReason} onChange={(e) => setExtraReason(e.target.value)} placeholder="Note..." className="w-full bg-black border border-zinc-800 rounded-[1.5rem] p-6 text-sm mb-8 text-white outline-none focus:border-purple-500/50" />
              <div className="flex gap-4">
                <button onClick={submitReport} disabled={!reportReason || isReporting} className="flex-1 bg-white text-black py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest">{isReporting ? "..." : "Submit"}</button>
                <button onClick={() => setShowReportModal(false)} className="px-8 bg-zinc-800 rounded-[1.5rem] text-zinc-400"><X className="w-6 h-6" /></button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="h-24 border-b border-purple-500/10 bg-zinc-950/80 backdrop-blur-xl flex items-center justify-between px-6 md:px-12 shrink-0 z-50">
        <div className="flex items-center gap-5 min-w-0">
          <div className="w-12 h-12 bg-purple-600/10 rounded-2xl flex items-center justify-center border border-purple-500/20 shadow-lg shadow-purple-500/5"><Hash className="w-6 h-6 text-purple-400" /></div>
          <div>
            <h2 className="font-black text-lg uppercase italic truncate tracking-tight">{roomid}</h2>
            <span className="flex items-center gap-2 text-xs text-green-500 font-black uppercase tracking-widest"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> {onlineCount} Active</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowReportModal(true)} className="h-12 w-12 flex items-center justify-center rounded-2xl border border-white/5 text-zinc-600 hover:text-red-500 transition-colors"><Flag className="w-5 h-5" /></button>
          <button onClick={() => setShowConfirm(true)} className="h-12 w-12 flex items-center justify-center rounded-2xl border border-white/5 text-zinc-500 active:scale-90"><LogOut className="w-5 h-5" /></button>
          <button onClick={copyInvite} className="h-12 px-6 rounded-2xl border border-purple-500/30 bg-purple-600/10 flex items-center gap-3 text-xs font-black uppercase text-purple-400 transition-all hover:bg-purple-600/20">
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />} <span>Invite</span>
          </button>
        </div>
      </header>

      <div ref={chatAreaRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-6 md:p-10 space-y-12 no-scrollbar relative bg-[#08080a]">
        <div className="max-w-5xl mx-auto space-y-12 pb-6">
          {messages.map((msg, i) => {
            const isMe = msg.nickname === nickname;
            const isImage = isImageUrl(msg.content);
            const isAudio = isAudioUrl(msg.content);

            return (
              <div key={msg.id || i} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                <span className={`text-[11px] font-black mb-3 px-2 uppercase flex items-center gap-2 ${isMe ? "text-purple-400" : "text-zinc-600"}`}>
                  {!isMe && <Terminal className="w-4 h-4 text-purple-500" />} {msg.nickname}
                </span>
                
                <div className={`group relative flex items-center gap-4 max-w-[85%] ${isMe ? "flex-row-reverse" : ""}`}>
                  <div className={`px-8 py-5 rounded-[2.5rem] text-lg shadow-2xl ${isMe ? "bg-purple-600 text-white rounded-tr-none shadow-purple-900/20" : "bg-zinc-900 border border-purple-500/10 rounded-tl-none text-zinc-200"}`}>
                    
                    {msg.reply_metadata && (
                      <div className="mb-4 p-4 rounded-[1.5rem] bg-black/20 border-l-4 border-white/20 text-sm opacity-70 italic truncate">
                        <span className="font-black not-italic text-white/50 uppercase block text-[10px] tracking-widest mb-1">@{msg.reply_metadata.nickname}</span>
                        {msg.reply_metadata.content}
                      </div>
                    )}

                    {isAudio ? (
                      <audio controls className="h-12 w-64 md:w-80 brightness-90 contrast-125 invert opacity-80">
                        <source src={msg.content} type="audio/ogg" />
                      </audio>
                    ) : isImage ? (
                      <img src={msg.content} alt="Transmitted" className="rounded-2xl max-h-80 w-full object-cover border border-white/10" />
                    ) : (
                      <div className="whitespace-pre-wrap break-words leading-relaxed">{msg.content}</div>
                    )}
                    
                    {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                      <div className={`absolute -bottom-4 flex gap-2 ${isMe ? "right-4" : "left-4"}`}>
                        {Object.entries(msg.reactions).map(([emoji, count]) => (
                          <span key={emoji} className="bg-zinc-800 px-3 py-1 rounded-full text-xs border border-white/10 flex items-center gap-2 shadow-xl">
                            {emoji} <span className="font-black">{count as number}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className={`flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all ${isMe ? "order-first" : ""}`}>
                    <button onClick={() => setReplyTo(msg)} className="p-2.5 text-zinc-600 hover:text-white"><Reply className="w-5 h-5" /></button>
                    <button onClick={() => setActiveReactionPicker(msg.id)} className="p-2.5 text-zinc-600 hover:text-purple-400"><SmilePlus className="w-5 h-5" /></button>
                  </div>

                  <AnimatePresence>
                    {activeReactionPicker === msg.id && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="absolute -top-16 z-50 bg-zinc-900 border border-purple-500/20 p-2 rounded-2xl flex gap-2 shadow-2xl backdrop-blur-xl">
                        {["🔥", "❤️", "😂", "🫡"].map(e => (
                          <button key={e} onClick={() => addReaction(msg.id, msg.reactions, e)} className="w-10 h-10 text-xl flex items-center justify-center hover:bg-purple-500/20 rounded-xl transition-all">{e}</button>
                        ))}
                        <button onClick={() => setActiveReactionPicker(null)} className="p-2 border-l border-white/5 ml-1"><X className="w-4 h-4 text-zinc-500" /></button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
          {typingUsers.length > 0 && <div className="text-xs font-black text-purple-500 animate-pulse uppercase tracking-[0.2em] flex items-center gap-3"> <span className="w-2 h-2 bg-purple-500 rounded-full" /> Transmitting...</div>}
          <div ref={scrollRef} className="h-2" />
        </div>

        <AnimatePresence>
          {showScrollButton && (
            <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={scrollToBottom} className="fixed bottom-40 left-1/2 -translate-x-1/2 bg-purple-600 text-white p-5 rounded-full shadow-2xl active:scale-90 z-40"><ChevronDown className="w-6 h-6" /></motion.button>
          )}
        </AnimatePresence>
      </div>

      <div className="p-8 md:p-12 bg-zinc-950/80 backdrop-blur-xl border-t border-purple-500/10 shrink-0">
        <div className="max-w-4xl mx-auto">
          <AnimatePresence>
            {replyTo && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="mb-4 p-5 bg-zinc-900 border border-purple-500/20 rounded-[2rem] flex items-center justify-between">
                <div className="min-w-0">
                  <span className="text-[10px] font-black text-purple-400 uppercase block mb-1 tracking-widest">Replying to @{replyTo.nickname}</span>
                  <p className="text-sm text-zinc-400 truncate italic">{replyTo.content}</p>
                </div>
                <button onClick={() => setReplyTo(null)} className="p-3 hover:bg-white/5 rounded-xl text-zinc-500"><X className="w-5 h-5" /></button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-end gap-4 bg-zinc-900/50 border border-purple-500/10 rounded-[2.5rem] p-3 focus-within:border-purple-500/40 shadow-inner">
            <textarea
              ref={textareaRef}
              rows={1}
              value={newMessage}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              onChange={(e) => {
                setNewMessage(e.target.value);
                if (channelRef.current) channelRef.current.track({ isTyping: e.target.value.length > 0, fp: myFingerprint });
              }}
              placeholder="Type your message..."
              className="flex-1 bg-transparent border-none outline-none text-lg text-zinc-200 py-4 px-6 resize-none no-scrollbar placeholder:text-zinc-800 min-h-[60px] max-h-[200px]"
            />
            
            <div className="flex items-center gap-3 pr-2 pb-2">
              <VoiceRecorder onUploadComplete={async (url) => {
                await supabase.from("messages").insert([{ 
                  room_id: roomid, 
                  nickname, 
                  content: url, 
                  reactions: {}, 
                  reply_metadata: replyTo ? { nickname: replyTo.nickname, content: replyTo.content } : null 
                }]);
                setReplyTo(null);
              }} />

              <button onClick={() => sendMessage()} disabled={!newMessage.trim()} className="p-5 bg-white text-black rounded-3xl active:scale-95 transition-all hover:bg-purple-600 hover:text-white shrink-0 shadow-xl"><Send className="w-6 h-6" /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
