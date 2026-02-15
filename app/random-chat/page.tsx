"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Send, LogOut, RefreshCw, Loader2, Flag, X, UserX, Reply, CornerDownRight, Terminal, Hash } from "lucide-react";
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { VoiceRecorder } from "@/components/VoiceRecorder"; 

function ChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = searchParams.get("id") || searchParams.get("roomId") || "";
  
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
  const [isDbReady, setIsDbReady] = useState(false);
  
  const isAudioUrl = (url: string) => url?.match(/\.(ogg|wav|mp3|webm)/) != null || url?.includes("supabase.co/storage");
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const myFpRef = useRef<string | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isPartnerTyping]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [newMessage]);

  useEffect(() => {
    const savedName = sessionStorage.getItem("murmur_nickname");
    if (!savedName || !roomId) {
      router.replace("/");
      return;
    }
    setNickname(savedName);
  }, [roomId, router]);

  useEffect(() => {
    if (!roomId || !nickname) return;

    const setupChat = async () => {
      const fpLoad = await FingerprintJS.load();
      const result = await fpLoad.get();
      myFpRef.current = result.visitorId;
      setMyFingerprint(result.visitorId);

      await supabase.from("rooms").upsert({ id: roomId }, { onConflict: 'id' });
      setIsDbReady(true);

      const channel = supabase.channel(`room_${roomId}`, {
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
          setHasPartnerLeft(true);
        })
        .on("postgres_changes", { 
          event: "INSERT", 
          schema: "public", 
          table: "messages", 
          filter: `room_id=eq.${roomId}` 
        }, (payload: any) => {
          setMessages((prev) => {
            if (prev.find(m => m.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
        })
        .subscribe(async (status: string) => {
          if (status === "SUBSCRIBED") {
            await channel.track({ isTyping: false, fp: result.visitorId, online_at: new Date().toISOString() });
          }
        });
    };

    setupChat();
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current); };
  }, [roomId, nickname]);

  const sendMessage = async (contentOverride?: string) => {
    const textToSend = contentOverride || newMessage;
    if (!textToSend.trim() || !roomId || !isDbReady) return;
    
    const messageData = {
      id: crypto.randomUUID(),
      room_id: roomId,
      nickname: nickname,
      content: textToSend,
      sender_fp: myFingerprint,
      reply_metadata: replyingTo ? { nickname: replyingTo.nickname, content: replyingTo.content } : null
    };

    setMessages((prev) => [...prev, messageData]);
    if (!contentOverride) setNewMessage("");
    setReplyingTo(null);
    
    if (channelRef.current) channelRef.current.track({ isTyping: false, fp: myFingerprint });
    await supabase.from("messages").insert([messageData]);
  };

  const handleSkip = async () => {
    if (!roomId) return;
    if (channelRef.current) await channelRef.current.send({ type: "broadcast", event: "PARTNER_EXITED" });
    router.replace("/matching"); 
  };

  const submitReportAndSkip = async () => {
    if (partnerFingerprint) {
      const chatContext = messages.slice(-10).map(m => `${m.nickname}: ${m.content}`);
      await supabase.from("reports").insert([{
        fingerprint: partnerFingerprint,
        reported_user: partnerNickname || "Unknown",
        reason: reportReason || "Violation",
        chat_log: chatContext
      }]);
    }
    setShowReportModal(false);
    handleSkip();
  };

  const handleExit = async () => {
    if (roomId && channelRef.current) {
      await channelRef.current.send({ type: "broadcast", event: "PARTNER_EXITED" });
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
              <LogOut className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-2xl font-black mb-2 uppercase italic tracking-tighter text-white">Terminate?</h3>
              <div className="flex gap-4 mt-8">
                <button onClick={handleExit} className="flex-1 bg-red-600 py-5 rounded-2xl font-black text-xs uppercase text-white">Exit</button>
                <button onClick={() => setShowExitConfirm(false)} className="flex-1 bg-zinc-800 py-5 rounded-2xl font-black text-xs uppercase text-zinc-300">Stay</button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showReportModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-zinc-900 border border-purple-500/20 p-10 rounded-[3rem] w-full max-w-md shadow-2xl">
              <h3 className="text-2xl font-black mb-8 text-red-500 uppercase tracking-tighter italic">Report Peer</h3>
              <div className="grid gap-3 mb-6">
                {["Harassment", "Spam", "Nudity", "Toxic"].map((r) => (
                  <button key={r} onClick={() => setReportReason(r)} className={`w-full p-5 rounded-2xl border text-xs font-black transition-all uppercase ${reportReason === r ? "bg-red-600 border-red-500 text-white" : "bg-black border-zinc-800 text-zinc-400"}`}>{r}</button>
                ))}
              </div>
              <div className="flex gap-4">
                <button onClick={submitReportAndSkip} className="flex-1 bg-white text-black py-5 rounded-2xl font-black text-xs uppercase">Confirm & Skip</button>
                <button onClick={() => setShowReportModal(false)} className="px-8 bg-zinc-800 rounded-2xl"><X className="w-6 h-6 text-white" /></button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {hasPartnerLeft && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/95 backdrop-blur-2xl">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-zinc-900 border border-purple-500/20 p-10 rounded-[3rem] w-full max-w-md text-center shadow-2xl">
              <UserX className="w-16 h-16 text-purple-500 mx-auto mb-6" />
              <h3 className="text-2xl font-black uppercase tracking-tighter mb-10 italic text-white">Signal Lost</h3>
              <button onClick={handleSkip} className="w-full bg-white text-black py-5 rounded-3xl font-black text-sm uppercase">Next Sync</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="h-24 shrink-0 border-b border-purple-500/10 bg-zinc-950/80 backdrop-blur-xl flex items-center justify-between px-6 md:px-12 z-50">
        <div className="flex items-center gap-5">
          <Hash className="w-6 h-6 text-purple-400" />
          <div>
            <h2 className="font-black text-lg uppercase italic tracking-tight text-white">{partnerNickname || "Connecting..."}</h2>
            <span className="text-[10px] text-green-500 font-black uppercase flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> Live Node
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => setShowReportModal(true)} className="h-12 w-12 flex items-center justify-center rounded-2xl border border-white/5 text-zinc-600 hover:text-red-500 transition-all"><Flag className="w-5 h-5" /></button>
          <button onClick={handleSkip} className="flex items-center gap-3 h-12 px-6 rounded-2xl bg-white text-black font-black text-xs uppercase active:scale-95 transition-all"><RefreshCw className="w-4 h-4" /> SKIP</button>
          <button onClick={() => setShowExitConfirm(true)} className="h-12 w-12 flex items-center justify-center rounded-2xl border border-white/5 text-zinc-500 hover:bg-zinc-900 transition-all"><LogOut className="w-5 h-5" /></button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar scroll-smooth">
        <div className="max-w-5xl mx-auto space-y-2">
          {messages.map((msg, i) => {
            const isMe = msg.nickname === nickname;
            return (
              <motion.div key={msg.id || i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex flex-col ${isMe ? "items-end" : "items-start"} mb-1`}>
                <span className={`text-[8px] font-black mb-0.5 px-2 uppercase text-zinc-500 ${isMe ? "text-purple-400" : ""}`}>{msg.nickname}</span>
                <div className={`group relative max-w-[85%] md:max-w-[75%] ${isMe ? "flex-row-reverse" : ""}`}>
                  {!isMe && <button onClick={() => setReplyingTo(msg)} className="absolute left-full ml-2 p-1 text-zinc-600 opacity-0 group-hover:opacity-100 transition-all"><Reply className="w-4 h-4" /></button>}
                  <div className={`px-4 py-2 rounded-[1.2rem] text-sm shadow-xl ${isMe ? "bg-purple-600 text-white rounded-tr-none" : "bg-zinc-900 border border-purple-500/10 text-zinc-200 rounded-tl-none"}`}>
                    {msg.reply_metadata && (
                      <div className="mb-1 p-2 rounded-lg bg-black/20 border-l-2 border-white/20 text-[10px] opacity-70 italic truncate">
                        @{msg.reply_metadata.nickname}: {msg.reply_metadata.content}
                      </div>
                    )}
                    {isAudioUrl(msg.content) ? (
                      <audio controls className="h-8 w-48 brightness-90 invert opacity-80"><source src={msg.content} type="audio/ogg" /></audio>
                    ) : (
                      <div className="leading-normal">{msg.content}</div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
          <div ref={scrollRef} className="h-2" />
        </div>
      </div>

      <div className="p-4 md:p-6 bg-zinc-950/80 backdrop-blur-xl border-t border-purple-500/10 shrink-0 z-50">
        <div className="max-w-5xl mx-auto">
          {replyingTo && (
            <div className="bg-zinc-900 border border-purple-500/20 border-b-0 rounded-t-[1.5rem] p-3 flex items-center justify-between">
              <div className="flex items-center gap-3 truncate">
                <CornerDownRight className="w-4 h-4 text-purple-500 shrink-0" />
                <p className="text-xs text-zinc-400 truncate italic">Replying to {replyingTo.nickname}</p>
              </div>
              <X className="w-4 h-4 text-zinc-500 cursor-pointer" onClick={() => setReplyingTo(null)} />
            </div>
          )}

          <div className={`flex items-end gap-3 bg-zinc-900/50 border border-purple-500/10 p-2 ${replyingTo ? "rounded-b-[1.5rem]" : "rounded-[1.5rem]"}`}>
            <textarea
              ref={textareaRef}
              rows={1}
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                if (channelRef.current) channelRef.current.track({ isTyping: e.target.value.length > 0, fp: myFingerprint });
              }}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Message..."
              className="flex-1 bg-transparent border-none outline-none text-sm px-4 py-3 resize-none max-h-32 text-white placeholder:text-zinc-800"
            />
            
            <div className="flex items-center gap-2 pr-1 pb-1">
              <VoiceRecorder onUploadComplete={(url) => sendMessage(url)} />
              <button 
                onClick={() => sendMessage()} 
                disabled={!newMessage.trim()} 
                className={`p-3.5 rounded-2xl transition-all active:scale-95 ${!newMessage.trim() ? "bg-zinc-800 text-zinc-600 opacity-50" : "bg-white text-black"}`}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="mt-2 flex justify-between items-center px-4 h-4">
             {isPartnerTyping && <span className="text-[9px] text-purple-500 font-black uppercase animate-pulse">Typing...</span>}
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
