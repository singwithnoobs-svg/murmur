"use client";

import { useEffect, useState, useRef, memo } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Hash, Send, LogOut, Copy, Check, Flag, X, Terminal, ChevronDown, SmilePlus, Reply, ShieldAlert } from "lucide-react";
import FingerprintJS from '@fingerprintjs/fingerprintjs';

/* AD COMPONENT */
const AdsterraBanner = memo(() => {
  const adRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (adRef.current && !initialized.current) {
      initialized.current = true;
      const container = adRef.current;
      const configScript = document.createElement("script");
      configScript.type = "text/javascript";
      configScript.innerHTML = `atOptions = { 'key' : 'fa3453ae0f13be3b5ba238031d224e99', 'format' : 'iframe', 'height' : 250, 'width' : 300, 'params' : {} };`;
      const adScript = document.createElement("script");
      adScript.type = "text/javascript";
      adScript.src = "//www.highperformanceformat.com/fa3453ae0f13be3b5ba238031d224e99/invoke.js";
      container.appendChild(configScript);
      container.appendChild(adScript);
    }
  }, []);

  return (
    <div className="flex flex-col items-center my-8 py-6 border-y border-white/5 bg-zinc-950/40 shadow-inner">
      <span className="text-[9px] font-black text-zinc-700 uppercase tracking-[0.4em] mb-4">Transmission Sponsor</span>
      <div ref={adRef} className="rounded-xl overflow-hidden border border-zinc-800 bg-black min-h-[250px] min-w-[300px] flex items-center justify-center shadow-2xl" />
    </div>
  );
});
AdsterraBanner.displayName = "AdsterraBanner";

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
  const [replyTo, setReplyTo] = useState<any>(null); // NEW: Reply state
  
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
    const replyData = replyTo ? { nickname: replyTo.nickname, content: replyTo.content } : null; // Quote data
    
    setNewMessage(""); 
    setReplyTo(null); // Reset reply
    
    if (channelRef.current) channelRef.current.track({ isTyping: false, fp: myFingerprint });
    await supabase.from("messages").insert([{ 
      room_id: roomid, 
      nickname, 
      content, 
      reactions: {}, 
      reply_metadata: replyData // NEW: Store quote
    }]);
  };

  useEffect(() => { scrollToBottom(); }, [messages, typingUsers]);

  return (
    <div className="fixed inset-0 flex flex-col bg-[#050505] text-zinc-100 font-sans overflow-hidden">
      
      {/* FIXED EXIT UI */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-zinc-950 border border-white/10 p-8 rounded-[2.5rem] w-full max-w-sm shadow-[0_0_50px_rgba(0,0,0,0.5)] text-center">
              <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                <LogOut className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-black mb-2 uppercase italic tracking-tighter">Terminate Session?</h3>
              <p className="text-zinc-500 text-[11px] font-bold uppercase tracking-widest mb-8">Connection will be purged from node</p>
              <div className="flex gap-3">
                <button onClick={handleExit} className="flex-1 bg-red-600 hover:bg-red-500 py-4 rounded-xl font-black text-[10px] uppercase transition-all">Exit Room</button>
                <button onClick={() => setShowConfirm(false)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 py-4 rounded-xl font-black text-[10px] uppercase transition-all">Stay</button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showReportModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
            <div className="bg-zinc-900 border border-white/5 p-8 rounded-[2.5rem] w-full max-w-sm">
              <h3 className="text-xl font-black mb-6 text-red-500 uppercase italic flex items-center gap-3"><Flag className="w-5 h-5" /> Report</h3>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {["Harassment", "Spam", "NSFW", "Toxic"].map((r) => (
                  <button key={r} onClick={() => setReportReason(r)} className={`p-3 rounded-xl border text-[9px] font-black uppercase ${reportReason === r ? "bg-red-600 border-red-500 text-white" : "bg-black border-zinc-800 text-zinc-600"}`}>{r}</button>
                ))}
              </div>
              <textarea value={extraReason} onChange={(e) => setExtraReason(e.target.value)} placeholder="Note..." className="w-full bg-black border border-zinc-800 rounded-2xl p-4 text-xs mb-6 text-white outline-none" />
              <div className="flex gap-3">
                <button onClick={submitReport} disabled={!reportReason || isReporting} className="flex-1 bg-white text-black py-4 rounded-2xl font-black text-[10px] uppercase">{isReporting ? "..." : "Submit"}</button>
                <button onClick={() => setShowReportModal(false)} className="px-6 bg-zinc-800 rounded-2xl"><X className="w-4 h-4 text-zinc-400" /></button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER */}
      <header className="h-20 border-b border-white/5 bg-zinc-950/80 backdrop-blur-xl flex items-center justify-between px-4 md:px-8 shrink-0 z-50">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-10 h-10 bg-purple-600/10 rounded-xl flex items-center justify-center border border-purple-500/20"><Hash className="w-5 h-5 text-purple-400" /></div>
          <div>
            <h2 className="font-black text-sm uppercase italic truncate">{roomid}</h2>
            <span className="flex items-center gap-1.5 text-[9px] text-green-500 font-black uppercase tracking-widest"><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> {onlineCount} Active</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowReportModal(true)} className="h-10 w-10 flex items-center justify-center rounded-xl border border-white/5 text-zinc-600 hover:text-red-500 transition-colors"><Flag className="w-4 h-4" /></button>
          <button onClick={() => setShowConfirm(true)} className="h-10 w-10 flex items-center justify-center rounded-xl border border-white/5 text-zinc-500 active:scale-90"><LogOut className="w-4 h-4" /></button>
          <button onClick={copyInvite} className="h-10 px-4 rounded-xl border border-white/5 bg-black/40 flex items-center gap-2 text-[10px] font-black uppercase text-zinc-400 transition-all hover:border-purple-500/30">
             {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />} <span>Invite</span>
          </button>
        </div>
      </header>

      {/* CHAT AREA */}
      <div ref={chatAreaRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 no-scrollbar relative">
        <div className="max-w-4xl mx-auto space-y-10 pb-4">
          {messages.map((msg, i) => {
            const isMe = msg.nickname === nickname;
            const isImage = isImageUrl(msg.content);
            return (
              <div key={msg.id || i} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                <span className="text-[9px] font-black text-zinc-600 mb-2 px-1 uppercase flex items-center gap-2">
                  {!isMe && <Terminal className="w-3 h-3 text-purple-500" />} {msg.nickname}
                </span>
                
                <div className="group relative flex items-center gap-2 max-w-[85%]">
                  <div className={`px-6 py-4 rounded-3xl text-[15px] shadow-2xl ${isMe ? "bg-purple-600 text-white rounded-tr-none" : "bg-zinc-900 border border-white/5 rounded-tl-none text-zinc-200"}`}>
                    
                    {/* QUOTE SECTION */}
                    {msg.reply_metadata && (
                      <div className="mb-2 p-2 rounded-xl bg-black/20 border-l-2 border-white/20 text-[11px] opacity-70 italic truncate">
                        <span className="font-black not-italic text-white/50 uppercase block text-[9px]">@{msg.reply_metadata.nickname}</span>
                        {msg.reply_metadata.content}
                      </div>
                    )}

                    {isImage ? (
                      <img src={msg.content} alt="Decrypted Transmission" className="rounded-xl max-h-64 w-full object-cover border border-white/10" />
                    ) : (
                      <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                    )}
                    
                    {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                      <div className={`absolute -bottom-3 flex gap-1 ${isMe ? "right-0" : "left-0"}`}>
                        {Object.entries(msg.reactions).map(([emoji, count]) => (
                          <span key={emoji} className="bg-zinc-800 px-2 py-0.5 rounded-full text-[10px] border border-white/10 flex items-center gap-1 shadow-xl">
                            {emoji} <span>{count as number}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* ACTIONS BAR */}
                  <div className={`flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all ${isMe ? "order-first" : ""}`}>
                    <button onClick={() => setReplyTo(msg)} className="p-2 text-zinc-600 hover:text-white"><Reply className="w-4 h-4" /></button>
                    <button onClick={() => setActiveReactionPicker(msg.id)} className="p-2 text-zinc-600 hover:text-purple-400"><SmilePlus className="w-4 h-4" /></button>
                  </div>

                  <AnimatePresence>
                    {activeReactionPicker === msg.id && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="absolute -top-12 z-50 bg-zinc-900 border border-white/10 p-1.5 rounded-2xl flex gap-1 shadow-2xl backdrop-blur-xl">
                        {["🔥", "❤️", "😂", "🫡"].map(e => (
                          <button key={e} onClick={() => addReaction(msg.id, msg.reactions, e)} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-xl transition-all">{e}</button>
                        ))}
                        <button onClick={() => setActiveReactionPicker(null)} className="p-1.5 border-l border-white/5 ml-1"><X className="w-3 h-3 text-zinc-500" /></button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
          {typingUsers.length > 0 && <div className="text-[9px] font-black text-zinc-600 animate-pulse uppercase tracking-widest flex items-center gap-2"> <span className="w-1.5 h-1.5 bg-purple-500 rounded-full" /> Node Transmitting...</div>}
          <div ref={scrollRef} className="h-1" />
        </div>

        {/* JUMP TO BOTTOM */}
        <AnimatePresence>
          {showScrollButton && (
            <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={scrollToBottom} className="fixed bottom-32 left-1/2 -translate-x-1/2 bg-purple-600 p-4 rounded-full shadow-2xl active:scale-90"><ChevronDown className="w-5 h-5" /></motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* INPUT BAR */}
      <div className="p-4 md:p-10 bg-zinc-950/80 backdrop-blur-xl border-t border-white/5 shrink-0">
        <div className="max-w-3xl mx-auto">
          {/* REPLY PREVIEW */}
          <AnimatePresence>
            {replyTo && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="mb-2 p-3 bg-zinc-900 border border-white/10 rounded-2xl flex items-center justify-between">
                <div className="min-w-0">
                  <span className="text-[9px] font-black text-purple-400 uppercase block mb-1">Replying to @{replyTo.nickname}</span>
                  <p className="text-xs text-zinc-400 truncate italic">{replyTo.content}</p>
                </div>
                <button onClick={() => setReplyTo(null)} className="p-2 hover:bg-white/5 rounded-lg text-zinc-500"><X className="w-4 h-4" /></button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-end gap-3 bg-zinc-900/50 border border-white/10 rounded-[1.8rem] p-2 focus-within:border-purple-500/40 shadow-inner">
            <textarea
              ref={textareaRef}
              rows={1}
              value={newMessage}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              onChange={(e) => {
                setNewMessage(e.target.value);
                if (channelRef.current) channelRef.current.track({ isTyping: e.target.value.length > 0, fp: myFingerprint });
              }}
              placeholder="Relay transmission..."
              className="flex-1 bg-transparent border-none outline-none text-[15px] text-zinc-200 py-3 px-4 resize-none no-scrollbar placeholder:text-zinc-700 min-h-[44px] max-h-[200px]"
            />
            <button onClick={() => sendMessage()} disabled={!newMessage.trim()} className="p-3.5 bg-white text-black rounded-2xl active:scale-90 transition-all hover:bg-purple-500 hover:text-white mb-1 shrink-0"><Send className="w-5 h-5" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
