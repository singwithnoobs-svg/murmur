"use client";

import { useEffect, useState, useRef, memo } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Hash, Send, AlertTriangle, LogOut, Copy, Check, Flag, X, Terminal } from "lucide-react";
import FingerprintJS from '@fingerprintjs/fingerprintjs';

/* AD COMPONENT: Persistent & Optimized */
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

  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [nickname, setNickname] = useState("");
  const [myFingerprint, setMyFingerprint] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [copied, setCopied] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [extraReason, setExtraReason] = useState(""); // NEW: Extra reason state
  const [isReporting, setIsReporting] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);

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

      const channel = supabase.channel(`room-${roomid}`, {
        config: { presence: { key: nickname } }
      });
      channelRef.current = channel;

      channel
        .on("presence", { event: "sync" }, () => {
          const state = channel.presenceState();
          setOnlineCount(Object.keys(state).length);
          const typing = Object.entries(state)
            .filter(([key, info]: [string, any]) => key !== nickname && info[0]?.isTyping)
            .map(([key]) => key);
          setTypingUsers(typing);
        })
        .on("postgres_changes" as any, { 
          event: "*", schema: "public", table: "messages", filter: `room_id=eq.${roomid}` 
        }, (event: any) => {
          if (event.eventType === "INSERT") setMessages((prev) => [...prev, event.new]);
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

  // FIXED: Logic to include FP in logs so Admin Dashboard can click them
  const submitReport = async () => {
    if (!reportReason || isReporting) return;
    setIsReporting(true);

    try {
      const presence = channelRef.current?.presenceState() || {};
      const lastOtherMessage = [...messages].reverse().find(m => m.nickname !== nickname);
      const targetNickname = lastOtherMessage?.nickname || "Unknown";
      const targetFp = presence[targetNickname]?.[0]?.fp || "Fingerprint_Not_Captured";

      // IMPORTANT: Map FP to EACH log entry so Admin can click ANY name in the log
      const logs = messages.slice(-30).map(msg => ({
        nickname: msg.nickname,
        content: msg.content,
        fp: presence[msg.nickname]?.[0]?.fp || null // This allows Admin to "Target" anyone in history
      }));

      const finalReason = extraReason.trim() 
        ? `${reportReason}: ${extraReason}` 
        : reportReason;

      const { error } = await supabase.from("reports").insert([{
        reported_user: targetNickname,
        fingerprint: targetFp,
        reason: finalReason,
        chat_log: logs,
        room_id: roomid
      }]);

      if (!error) {
        setShowReportModal(false);
        setReportReason("");
        setExtraReason("");
        alert("Sector violation logged. Command Center notified.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsReporting(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomid || !newMessage.trim()) return;
    const content = newMessage;
    setNewMessage(""); 
    if (channelRef.current) channelRef.current.track({ isTyping: false, fp: myFingerprint });
    await supabase.from("messages").insert([{ room_id: roomid, nickname, content }]);
  };

  const handleInputChange = (val: string) => {
    setNewMessage(val);
    if (channelRef.current) {
      channelRef.current.track({ isTyping: val.length > 0, fp: myFingerprint });
    }
  };

  const copyInvite = () => {
    const inviteUrl = `${window.location.origin}/?id=${roomid}`; 
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  return (
    <div className="flex flex-col h-[100dvh] bg-[#050505] text-zinc-100 overflow-hidden font-sans">
      
      {/* IMPROVED REPORT MODAL */}
      <AnimatePresence>
        {showReportModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-zinc-900 border border-white/5 p-8 rounded-[2.5rem] w-full max-w-sm shadow-2xl">
              <h3 className="text-xl font-black mb-6 flex items-center gap-3 text-red-500 uppercase tracking-tighter italic">
                <Flag className="w-5 h-5" /> Report Sector
              </h3>
              
              <div className="grid grid-cols-2 gap-2 mb-4">
                {["Harassment", "Spam", "NSFW", "Toxic"].map((r) => (
                  <button key={r} onClick={() => setReportReason(r)} className={`p-3 rounded-xl border text-[9px] font-black transition-all uppercase tracking-widest ${reportReason === r ? "bg-red-600 border-red-500 text-white" : "bg-black border-zinc-800 text-zinc-600"}`}>
                    {r}
                  </button>
                ))}
              </div>

              {/* NEW: EXTRA REASON INPUT */}
              <div className="mb-8">
                <p className="text-[8px] font-black text-zinc-600 uppercase mb-2 ml-1">Additional Evidence / Notes</p>
                <textarea 
                  value={extraReason}
                  onChange={(e) => setExtraReason(e.target.value)}
                  placeholder="Explain the violation..."
                  className="w-full bg-black border border-zinc-800 rounded-2xl p-4 text-xs outline-none focus:border-red-500/50 transition-all min-h-[80px] resize-none text-zinc-300"
                />
              </div>

              <div className="flex gap-3">
                <button onClick={submitReport} disabled={!reportReason || isReporting} className="flex-1 bg-white text-black py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 disabled:opacity-50">
                  {isReporting ? "Syncing..." : "Transmit Report"}
                </button>
                <button onClick={() => setShowReportModal(false)} className="px-6 bg-zinc-800 rounded-2xl border border-zinc-700 hover:bg-zinc-700 transition-all"><X className="w-4 h-4 text-zinc-400" /></button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ... Rest of your component (Header, Chat Area, Input Bar) exactly as it was ... */}
      {/* Make sure to keep your existing Header, Messages mapping, and Input Bar code here */}
      
      {/* HEADER */}
      <header className="h-20 border-b border-white/5 bg-zinc-950/50 backdrop-blur-xl flex items-center justify-between px-4 md:px-8 shrink-0 z-50">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-10 h-10 bg-purple-600/10 rounded-xl flex items-center justify-center border border-purple-500/20 shrink-0 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
            <Hash className="w-5 h-5 text-purple-400" />
          </div>
          <div className="min-w-0">
            <h2 className="font-black text-sm md:text-lg truncate tracking-tighter uppercase italic">{roomid}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="flex items-center gap-1.5 text-[9px] text-green-500 font-black uppercase tracking-widest">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> 
                {onlineCount} Nodes Active
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button onClick={() => setShowReportModal(true)} className="h-11 w-11 flex items-center justify-center rounded-xl border border-white/5 text-zinc-600 hover:text-red-500 hover:bg-red-500/5 transition-all">
            <Flag className="w-4 h-4" />
          </button>
          <button onClick={copyInvite} className="h-11 px-4 md:px-6 rounded-xl border border-white/5 bg-black/40 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] hover:border-purple-500/30 transition-all text-zinc-400">
            {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />} 
            <span className="hidden sm:inline">{copied ? "Copied" : "Invite"}</span>
          </button>
          <button onClick={() => setShowConfirm(true)} className="h-11 w-11 flex items-center justify-center rounded-xl border border-white/5 text-zinc-500 hover:bg-zinc-900 transition-all"><LogOut className="w-4 h-4" /></button>
        </div>
      </header>

      {/* CHAT AREA */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 no-scrollbar">
        <div className="max-w-5xl mx-auto space-y-8">
          {messages.map((msg, i) => {
            const isMe = msg.nickname === nickname;
            return (
              <div key={msg.id || i}>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                  <span className="text-[9px] font-black text-zinc-600 mb-2 px-1 tracking-[0.2em] uppercase flex items-center gap-2">
                    {!isMe && <Terminal className="w-3 h-3 text-purple-500/50" />} {msg.nickname}
                  </span>
                  <div className={`px-5 py-3.5 rounded-2xl text-[15px] leading-relaxed max-w-[85%] md:max-w-[70%] shadow-2xl transition-all ${
                    isMe 
                    ? "bg-purple-600 text-white rounded-tr-none shadow-purple-900/20" 
                    : "bg-zinc-900/60 border border-white/5 backdrop-blur-md rounded-tl-none text-zinc-200"
                  }`}>
                    {msg.content}
                  </div>
                </motion.div>
                {(i + 1) % 10 === 0 && <AdsterraBanner />}
              </div>
            );
          })}
          <div ref={scrollRef} className="h-4" />
        </div>
      </div>

      {/* INPUT BAR */}
      <div className="p-4 md:p-8 bg-gradient-to-t from-black via-black/80 to-transparent shrink-0">
        <form onSubmit={sendMessage} className="max-w-4xl mx-auto relative group">
          <input 
            type="text" 
            value={newMessage} 
            onChange={(e) => handleInputChange(e.target.value)} 
            placeholder="Relay message to sector..." 
            className="w-full bg-black/60 border border-white/10 rounded-2xl pl-6 pr-16 py-5 outline-none text-[15px] text-white focus:border-purple-500/40 focus:ring-4 focus:ring-purple-500/5 transition-all shadow-2xl placeholder:text-zinc-700" 
          />
          <button type="submit" disabled={!newMessage.trim()} className="absolute right-3 top-1/2 -translate-y-1/2 p-3.5 bg-white text-black rounded-xl active:scale-90 transition-all disabled:opacity-0 shadow-xl group-focus-within:bg-purple-500 group-focus-within:text-white">
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
