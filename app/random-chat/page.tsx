"use client";

import { useEffect, useState, useRef, Suspense, memo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Send, LogOut, RefreshCw, Zap, Loader2, Flag, X, UserX, Reply, CornerDownRight, Terminal } from "lucide-react";
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { VoiceRecorder } from "@/components/VoiceRecorder"; // Ensure path is correct

const AdsterraBanner = memo(() => {
  const adRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (adRef.current && !initialized.current) {
      initialized.current = true;
      const container = adRef.current;
      const config = document.createElement("script");
      config.type = "text/javascript";
      config.innerHTML = `atOptions = { 'key' : 'd5b7d02c3eed6fede79ae09ea0e30660', 'format' : 'iframe', 'height' : 250, 'width' : 300, 'params' : {} };`;
      const invoke = document.createElement("script");
      invoke.type = "text/javascript";
      invoke.src = "//www.highperformanceformat.com/d5b7d02c3eed6fede79ae09ea0e30660/invoke.js";
      container.appendChild(config);
      container.appendChild(invoke);
    }
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="flex flex-col items-center my-10 py-8 border-y border-white/5 bg-zinc-950/40 relative w-full"
    >
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#050505] px-4 py-1 border border-white/10 rounded-full flex items-center gap-2 z-10">
        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse" />
        <span className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.3em]">System Decryption: Sponsor</span>
      </div>
      
      <div ref={adRef} className="rounded-2xl overflow-hidden border border-zinc-800 bg-black min-h-[250px] min-w-[300px] flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.5)] transition-all hover:border-purple-500/30" />
      
      <span className="mt-4 text-[7px] font-bold text-zinc-800 uppercase tracking-widest">Authorized Transmission Layer</span>
    </motion.div>
  );
});
AdsterraBanner.displayName = "AdsterraBanner";

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
      textareaRef.current.style.height = "0px";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + "px";
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
    <div className="flex flex-col h-[100dvh] bg-[#050505] text-zinc-100 overflow-hidden font-sans">
      
      <AnimatePresence>
        {showExitConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-zinc-950 border border-white/10 p-8 rounded-[2rem] w-full max-w-sm shadow-[0_0_50px_rgba(0,0,0,0.5)] text-center">
              <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                <LogOut className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-black mb-2 uppercase italic tracking-tighter">Terminate?</h3>
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-8">Frequency will be purged</p>
              <div className="flex gap-3">
                <button onClick={handleExit} className="flex-1 bg-red-600 py-4 rounded-xl font-black text-[10px] uppercase transition-all">Exit</button>
                <button onClick={() => setShowExitConfirm(false)} className="flex-1 bg-zinc-800 py-4 rounded-xl font-black text-[10px] uppercase transition-all">Stay</button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showReportModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-zinc-900 border border-zinc-800 p-6 rounded-[2rem] w-full max-w-sm shadow-2xl">
              <h3 className="text-xl font-black mb-4 flex items-center gap-2 text-red-500 uppercase tracking-tighter"><Flag className="w-5 h-5"/> Report Peer</h3>
              <div className="grid gap-2 mb-6">
                {["Harassment", "Spam", "Inappropriate", "Nudity"].map((r) => (
                  <button key={r} onClick={() => setReportReason(r)} className={`w-full p-3 rounded-xl border text-[10px] font-black transition-all uppercase tracking-widest ${reportReason === r ? "bg-red-600 border-red-500 text-white" : "bg-zinc-800 border-zinc-700 text-zinc-400"}`}>{r}</button>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={submitReportAndSkip} className="flex-1 bg-white text-black py-4 rounded-xl font-black text-[10px] uppercase tracking-widest">Confirm & Skip</button>
                <button onClick={() => setShowReportModal(false)} className="px-6 bg-zinc-800 rounded-xl"><X className="w-4 h-4 text-white" /></button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {hasPartnerLeft && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/90 backdrop-blur-2xl">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2.5rem] w-full max-w-sm text-center shadow-[0_0_50px_rgba(0,0,0,0.4)]">
              <UserX className="w-12 h-12 text-purple-500 mx-auto mb-6" />
              <h3 className="text-xl font-black uppercase tracking-tighter mb-2">Signal Lost</h3>
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-8 leading-relaxed">Partner disconnected.</p>
              <div className="space-y-3">
                <button onClick={handleSkip} className="w-full bg-white text-black py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em]">Next Sync</button>
                <button onClick={handleExit} className="w-full bg-zinc-800 text-zinc-400 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em]">Exit</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="h-20 shrink-0 border-b border-white/5 bg-zinc-950/80 backdrop-blur-xl flex items-center justify-between px-4 md:px-8 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-600/10 rounded-xl flex items-center justify-center border border-purple-500/20">
            <Zap className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <h2 className="font-black text-sm uppercase italic tracking-tight truncate max-w-[100px] md:max-w-none">{partnerNickname || "Connecting..."}</h2>
            <span className="text-[9px] text-green-500 font-black uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Live Node
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setShowReportModal(true)} className="p-3 rounded-xl border border-white/5 text-zinc-600 hover:text-red-500 transition-all">
            <Flag className="w-4 h-4" />
          </button>
          <button onClick={handleSkip} className="flex items-center gap-2 h-10 px-4 rounded-xl bg-white text-black font-black text-[10px] uppercase active:scale-95 transition-all">
            <RefreshCw className="w-4 h-4" /> SKIP
          </button>
          <button onClick={() => setShowExitConfirm(true)} className="p-3 rounded-xl border border-white/5 text-zinc-500 hover:bg-zinc-900 transition-all">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar scroll-smooth">
        <div className="max-w-4xl mx-auto space-y-10">
          <AdsterraBanner />

          <AnimatePresence mode="popLayout">
            {messages.map((msg, i) => {
              const isMe = msg.nickname === nickname;
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex flex-col ${isMe ? "items-end" : "items-start"} mb-10 last:mb-4`}>
                  <span className="text-[9px] font-black text-zinc-600 mb-2 px-1 uppercase flex items-center gap-2">
                    {!isMe && <Terminal className="w-3 h-3 text-purple-500" />} {msg.nickname}
                  </span>
                  
                  <div className="group relative max-w-[85%] md:max-w-[70%]">
                    <button 
                      onClick={() => setReplyingTo(msg)}
                      className={`absolute top-1/2 -translate-y-1/2 p-2 rounded-lg bg-zinc-900 border border-white/10 text-zinc-500 opacity-0 group-hover:opacity-100 transition-all z-10 ${isMe ? "right-full mr-3" : "left-full ml-3"}`}
                    >
                      <Reply className="w-4 h-4" />
                    </button>

                    <div className={`px-5 py-3.5 rounded-2xl text-[15px] shadow-2xl ${
                      isMe 
                      ? "bg-purple-600 text-white rounded-tr-none" 
                      : "bg-zinc-900 border border-white/5 text-zinc-200 rounded-tl-none"
                    }`}>
                      {msg.reply_metadata && (
                        <div className="mb-2 p-2 rounded-xl bg-black/20 border-l-2 border-white/20 text-[11px] opacity-70 italic truncate">
                          <span className="font-black not-italic text-white/50 uppercase block text-[9px]">@{msg.reply_metadata.nickname}</span>
                          {msg.reply_metadata.content}
                        </div>
                      )}
                      
                      {isAudioUrl(msg.content) ? (
                        <audio controls className="h-10 w-48 md:w-64 brightness-90 contrast-125 invert opacity-80">
                          <source src={msg.content} type="audio/ogg" />
                        </audio>
                      ) : (
                        msg.content
                      )}
                    </div>
                  </div>
                  {(i + 1) % 10 === 0 && <AdsterraBanner />}
                </motion.div>
              );
            })}
          </AnimatePresence>
          <div ref={scrollRef} className="h-4" />
        </div>
      </div>

      <div className="p-4 md:p-8 bg-zinc-950/80 backdrop-blur-xl border-t border-white/5 shrink-0 z-50">
        <div className="max-w-4xl mx-auto">
          <AnimatePresence>
            {replyingTo && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="bg-zinc-900 border border-white/10 border-b-0 rounded-t-2xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-3 overflow-hidden">
                  <CornerDownRight className="w-4 h-4 text-purple-500 shrink-0" />
                  <div className="min-w-0 text-xs">
                    <p className="font-black text-purple-500 uppercase tracking-widest text-[9px]">Replying to {replyingTo.nickname}</p>
                    <p className="text-zinc-400 truncate italic">"{replyingTo.content}"</p>
                  </div>
                </div>
                <button onClick={() => setReplyingTo(null)} className="p-1.5 hover:bg-zinc-800 rounded-lg"><X className="w-4 h-4" /></button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className={`flex items-end gap-2 bg-zinc-900/50 border border-white/10 p-2 ${replyingTo ? "rounded-b-2xl" : "rounded-3xl shadow-inner focus-within:border-purple-500/40"}`}>
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
              className="flex-1 bg-transparent border-none outline-none text-[15px] px-4 py-3 resize-none max-h-40 scrollbar-none placeholder:text-zinc-700"
            />
            
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

            <button onClick={sendMessage} disabled={!partnerNickname || !newMessage.trim()} className="p-3.5 bg-white text-black rounded-2xl active:scale-90 disabled:opacity-0 transition-all shadow-xl">
              <Send className="w-5 h-5" />
            </button>
          </div>
          <div className="flex justify-between items-center mt-3 px-2">
            <span className="text-[8px] text-zinc-800 font-black uppercase tracking-[0.3em]">Peer-to-Peer encrypted</span>
            {isPartnerTyping && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[9px] text-purple-500 font-black uppercase animate-pulse tracking-widest">Signal incoming...</motion.span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RandomChat() {
  return (
    <Suspense fallback={<div className="h-[100dvh] bg-zinc-950 flex items-center justify-center"><Loader2 className="animate-spin text-purple-600" /></div>}>
      <ChatContent />
    </Suspense>
  );
}
