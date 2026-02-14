"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Send, LogOut, RefreshCw, Zap, Loader2, Flag, X, UserX, Reply, CornerDownRight, Terminal, Hash } from "lucide-react";
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { VoiceRecorder } from "@/components/VoiceRecorder"; 

function ChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomid = searchParams.get("id") || "";
  
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [nickname, setNickname] = useState("");
  const [myFingerprint, setMyFingerprint] = useState<string | null>(null);
  const [partnerNickname, setPartnerNickname] = useState<string | null>(null);
  const [partnerFingerprint, setPartnerFingerprint] = useState<string | null>(null); 
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [hasPartnerLeft, setHasPartnerLeft] = useState(false);
  
  const isAudioUrl = (url: string) => url.match(/\.(ogg|wav|mp3)/) != null;
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isPartnerTyping]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  }, [newMessage]);

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
      setMyFingerprint(result.visitorId);

      await supabase.from("rooms").upsert({ id: roomid }, { onConflict: 'id' });

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
            setIsPartnerTyping(partnerData?.isTyping || false);
            setPartnerFingerprint(partnerData?.fp || null);
          } else {
            setIsPartnerTyping(false);
          }
        })
        .on("broadcast", { event: "PARTNER_EXITED" }, () => {
          setPartnerNickname(null);
          setHasPartnerLeft(true);
        })
        .on("postgres_changes" as any, { 
          event: "INSERT", 
          schema: "public", 
          table: "messages", 
          filter: `room_id=eq.${roomid}` 
        }, (payload: any) => {
          setMessages((prev) => [...prev, payload.new]);
        })
        .subscribe(async (status: string) => {
          if (status === "SUBSCRIBED") {
            await channel.track({ isTyping: false, fp: result.visitorId, online_at: new Date().toISOString() });
          }
        });
    };

    setupChat();
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current); };
  }, [roomid, nickname]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !roomid || !partnerNickname) return;
    
    const messageData = {
      room_id: roomid,
      nickname: nickname,
      content: newMessage,
      reply_metadata: replyingTo ? { nickname: replyingTo.nickname, content: replyingTo.content } : null
    };

    setNewMessage("");
    setReplyingTo(null);
    if (channelRef.current) channelRef.current.track({ isTyping: false, fp: myFingerprint });
    await supabase.from("messages").insert([messageData]);
  };

  const handleSkip = async () => {
    if (!roomid) return;
    if (channelRef.current) await channelRef.current.send({ type: "broadcast", event: "PARTNER_EXITED" });
    await supabase.from("messages").delete().eq("room_id", roomid);
    await supabase.from("rooms").delete().eq("id", roomid);
    router.replace("/matching"); 
  };

  const submitReportAndSkip = async () => {
    if (!partnerNickname || !partnerFingerprint) {
      handleSkip();
      return;
    }
    const chatContext = messages.slice(-15).map(m => ({ nickname: m.nickname, content: m.content }));
    await supabase.from("reports").insert([{
      fingerprint: partnerFingerprint,
      reported_user: partnerNickname,
      reason: reportReason || "Violation of Protocol",
      chat_log: chatContext
    }]);
    setShowReportModal(false);
    handleSkip();
  };

  const handleExit = async () => {
    if (roomid) {
      if (channelRef.current) await channelRef.current.send({ type: "broadcast", event: "PARTNER_EXITED" });
      await supabase.from("messages").delete().eq("room_id", roomid).eq("nickname", nickname);
    }
    sessionStorage.removeItem("murmur_nickname");
    router.push("/"); 
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-[#08080a] text-zinc-100 overflow-hidden font-sans">
      
      <AnimatePresence>
        {showExitConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-zinc-900 border border-purple-500/20 p-10 rounded-[2.5rem] w-full max-w-md shadow-2xl text-center">
              <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                <LogOut className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-2xl font-black mb-2 uppercase italic tracking-tighter">Terminate?</h3>
              <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest mb-10">Frequency will be purged</p>
              <div className="flex gap-4">
                <button onClick={handleExit} className="flex-1 bg-red-600 hover:bg-red-500 py-5 rounded-2xl font-black text-xs uppercase transition-all">Exit</button>
                <button onClick={() => setShowExitConfirm(false)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 py-5 rounded-2xl font-black text-xs uppercase transition-all text-zinc-300">Stay</button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showReportModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-zinc-900 border border-purple-500/20 p-10 rounded-[3rem] w-full max-w-md shadow-2xl">
              <h3 className="text-2xl font-black mb-8 flex items-center gap-4 text-red-500 uppercase tracking-tighter italic"><Flag className="w-6 h-6"/> Report Peer</h3>
              <div className="grid gap-3 mb-6">
                {["Harassment", "Spam", "Inappropriate", "Nudity"].map((r) => (
                  <button key={r} onClick={() => setReportReason(r)} className={`w-full p-5 rounded-2xl border text-xs font-black transition-all uppercase tracking-widest ${reportReason === r ? "bg-red-600 border-red-500 text-white" : "bg-black border-zinc-800 text-zinc-400"}`}>{r}</button>
                ))}
              </div>
              <div className="flex gap-4">
                <button onClick={submitReportAndSkip} className="flex-1 bg-white text-black py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest">Confirm & Skip</button>
                <button onClick={() => setShowReportModal(false)} className="px-8 bg-zinc-800 rounded-[1.5rem]"><X className="w-6 h-6 text-white" /></button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {hasPartnerLeft && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/95 backdrop-blur-2xl">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-zinc-900 border border-purple-500/20 p-10 rounded-[3rem] w-full max-w-md text-center shadow-2xl">
              <UserX className="w-16 h-16 text-purple-500 mx-auto mb-6" />
              <h3 className="text-2xl font-black uppercase tracking-tighter mb-2 italic">Signal Lost</h3>
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-10 leading-relaxed">Partner disconnected.</p>
              <div className="space-y-4">
                <button onClick={handleSkip} className="w-full bg-white text-black py-5 rounded-3xl font-black text-sm uppercase tracking-[0.2em]">Next Sync</button>
                <button onClick={handleExit} className="w-full bg-zinc-800 text-zinc-400 py-5 rounded-3xl font-black text-sm uppercase tracking-[0.2em]">Exit</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="h-24 shrink-0 border-b border-purple-500/10 bg-zinc-950/80 backdrop-blur-xl flex items-center justify-between px-6 md:px-12 z-50">
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 bg-purple-600/10 rounded-2xl flex items-center justify-center border border-purple-500/20">
            <Hash className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h2 className="font-black text-lg uppercase italic tracking-tight truncate max-w-[150px] md:max-w-none">{partnerNickname || "Connecting..."}</h2>
            <span className="text-[10px] text-green-500 font-black uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> Live Node
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => setShowReportModal(true)} className="h-12 w-12 flex items-center justify-center rounded-2xl border border-white/5 text-zinc-600 hover:text-red-500 transition-all">
            <Flag className="w-5 h-5" />
          </button>
          <button onClick={handleSkip} className="flex items-center gap-3 h-12 px-6 rounded-2xl bg-white text-black font-black text-xs uppercase active:scale-95 transition-all">
            <RefreshCw className="w-4 h-4" /> SKIP
          </button>
          <button onClick={() => setShowExitConfirm(true)} className="h-12 w-12 flex items-center justify-center rounded-2xl border border-white/5 text-zinc-500 hover:bg-zinc-900 transition-all">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 md:p-10 no-scrollbar scroll-smooth">
        <div className="max-w-5xl mx-auto space-y-12">
          <AnimatePresence mode="popLayout">
            {messages.map((msg, i) => {
              const isMe = msg.nickname === nickname;
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className={`flex flex-col ${isMe ? "items-end" : "items-start"} mb-12 last:mb-4`}>
                  <span className={`text-[11px] font-black mb-3 px-2 uppercase flex items-center gap-2 ${isMe ? "text-purple-400" : "text-zinc-600"}`}>
                    {!isMe && <Terminal className="w-4 h-4 text-purple-500" />} {msg.nickname}
                  </span>
                  
                  <div className={`group relative max-w-[85%] md:max-w-[70%] ${isMe ? "flex-row-reverse" : ""}`}>
                    <button 
                      onClick={() => setReplyingTo(msg)}
                      className={`absolute top-1/2 -translate-y-1/2 p-2.5 rounded-xl bg-zinc-900 border border-purple-500/20 text-zinc-500 opacity-0 group-hover:opacity-100 transition-all z-10 ${isMe ? "right-full mr-4" : "left-full ml-4"}`}
                    >
                      <Reply className="w-5 h-5" />
                    </button>

                    <div className={`px-8 py-5 rounded-[2.5rem] text-lg shadow-2xl ${
                      isMe 
                      ? "bg-purple-600 text-white rounded-tr-none shadow-purple-900/20" 
                      : "bg-zinc-900 border border-purple-500/10 text-zinc-200 rounded-tl-none"
                    }`}>
                      {msg.reply_metadata && (
                        <div className="mb-4 p-4 rounded-[1.5rem] bg-black/20 border-l-4 border-white/20 text-sm opacity-70 italic truncate">
                          <span className="font-black not-italic text-white/50 uppercase block text-[10px] tracking-widest mb-1">@{msg.reply_metadata.nickname}</span>
                          {msg.reply_metadata.content}
                        </div>
                      )}
                      
                      {isAudioUrl(msg.content) ? (
                        <audio controls className="h-12 w-64 md:w-80 brightness-90 contrast-125 invert opacity-80">
                          <source src={msg.content} type="audio/ogg" />
                        </audio>
                      ) : (
                        <div className="leading-relaxed">{msg.content}</div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          <div ref={scrollRef} className="h-4" />
        </div>
      </div>

      <div className="p-8 md:p-12 bg-zinc-950/80 backdrop-blur-xl border-t border-purple-500/10 shrink-0 z-50">
        <div className="max-w-5xl mx-auto">
          <AnimatePresence>
            {replyingTo && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 15 }} className="bg-zinc-900 border border-purple-500/20 border-b-0 rounded-t-[2rem] p-5 flex items-center justify-between">
                <div className="flex items-center gap-4 overflow-hidden">
                  <CornerDownRight className="w-5 h-5 text-purple-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-black text-purple-500 uppercase tracking-widest text-[10px]">Replying to {replyingTo.nickname}</p>
                    <p className="text-sm text-zinc-400 truncate italic">"{replyingTo.content}"</p>
                  </div>
                </div>
                <button onClick={() => setReplyingTo(null)} className="p-2 hover:bg-zinc-800 rounded-xl"><X className="w-5 h-5 text-zinc-500" /></button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className={`flex items-end gap-4 bg-zinc-900/50 border border-purple-500/10 p-3 transition-all duration-300 ${replyingTo ? "rounded-b-[2.5rem]" : "rounded-[2.5rem] shadow-inner focus-within:border-purple-500/40"}`}>
            <textarea
              ref={textareaRef}
              rows={1}
              autoFocus
              disabled={!partnerNickname}
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                if (channelRef.current) channelRef.current.track({ isTyping: e.target.value.length > 0, fp: myFingerprint });
              }}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder={partnerNickname ? "Relay message..." : "Syncing node..."}
              className="flex-1 bg-transparent border-none outline-none text-lg px-6 py-4 resize-none max-h-52 scrollbar-none placeholder:text-zinc-800"
            />
            
            <div className="flex items-center gap-3 pr-2 pb-2">
              <VoiceRecorder onUploadComplete={async (url) => {
                if (!roomid || !partnerNickname) return;
                const messageData = {
                  room_id: roomid,
                  nickname: nickname,
                  content: url,
                  reply_metadata: replyingTo ? { nickname: replyingTo.nickname, content: replyingTo.content } : null
                };
                setReplyingTo(null);
                await supabase.from("messages").insert([messageData]);
              }} />

              {/* Send Button: Visible at all times, style changes when disabled/enabled */}
              <button 
                onClick={sendMessage} 
                disabled={!partnerNickname || !newMessage.trim()} 
                className={`p-5 rounded-[1.5rem] transition-all duration-300 shadow-xl active:scale-95 ${
                  !partnerNickname || !newMessage.trim() 
                  ? "bg-zinc-800 text-zinc-600 opacity-50 cursor-not-allowed" 
                  : "bg-white text-black hover:bg-purple-500 hover:text-white"
                }`}
              >
                <Send className="w-6 h-6" />
              </button>
            </div>
          </div>
          <div className="flex justify-between items-center mt-5 px-4">
            <span className="text-[10px] text-zinc-800 font-black uppercase tracking-[0.4em]">Node-to-Node Secure</span>
            {isPartnerTyping && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-purple-500 font-black uppercase animate-pulse tracking-widest">Signal incoming...</motion.span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RandomChat() {
  return (
    <Suspense fallback={<div className="h-[100dvh] bg-zinc-950 flex items-center justify-center"><Loader2 className="animate-spin text-purple-600 w-10 h-10" /></div>}>
      <ChatContent />
    </Suspense>
  );
}
