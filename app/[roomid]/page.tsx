"use client";

import { useEffect, useState, useRef, memo } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Hash, Send, Trash2, AlertTriangle, LogOut, Copy, Check, Flag, X, Zap, Youtube } from "lucide-react";
import FingerprintJS from '@fingerprintjs/fingerprintjs';

/* AD COMPONENT: memoized for Lobby/Private Rooms */
const AdsterraBanner = memo(() => {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (adRef.current && !adRef.current.firstChild) {
      console.log("[ADSTERRA] Initializing ad container (Room)...");

      const configScript = document.createElement("script");
      configScript.innerHTML = `
        atOptions = {
          'key' : 'fa3453ae0f13be3b5ba238031d224e99',
          'format' : 'iframe',
          'height' : 250,
          'width' : 300,
          'params' : {}
        };
      `;
      
      const adScript = document.createElement("script");
      adScript.type = "text/javascript";
      adScript.src = "https://www.highperformanceformat.com/fa3453ae0f13be3b5ba238031d224e99/invoke.js";

      adScript.onload = () => {
        setTimeout(() => {
          const hasIframe = adRef.current?.querySelector('iframe');
          if (hasIframe) console.log("[ADSTERRA] SUCCESS: Room Ad active.");
          else console.warn("[ADSTERRA] WARNING: Showing Fallback.");
        }, 3000);
      };

      adRef.current.appendChild(configScript);
      adRef.current.appendChild(adScript);
    }
  }, []);

  return (
    <div className="flex flex-col items-center my-8 py-4 border-y border-zinc-900/50 bg-zinc-950/30">
      <span className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.4em] mb-4">
        — Sponsored Transmission —
      </span>
      <div className="relative rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900 shadow-2xl min-h-[250px] min-w-[300px] flex items-center justify-center group">
        <div ref={adRef} className="z-20 relative" />
        <a 
          href="https://youtube.com/@cgvanish" // REPLACE WITH YOUR LINK
          target="_blank" 
          rel="noopener noreferrer"
          className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center space-y-4 bg-zinc-900 hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 group-hover:scale-110 transition-transform duration-500">
            <Youtube className="w-7 h-7 text-red-500" />
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Signal Interrupted</p>
            <p className="text-xs text-white font-black uppercase tracking-widest bg-red-600 px-4 py-2 rounded-lg shadow-lg">SUBSCRIBE TO CHANNEL</p>
            <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-tighter">Bypass encryption to join the source</p>
          </div>
        </a>
      </div>
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
  
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [customReason, setCustomReason] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);

  const handlePurgeAndExit = async () => {
    if (!roomid || !nickname) return;
    await supabase.from("messages").delete().eq("room_id", roomid).eq("nickname", nickname);
    if (onlineCount <= 1) {
      await supabase.from("rooms").delete().eq("id", roomid);
    }
    router.push("/lobby");
  };

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
        })
        .on("postgres_changes" as any, { 
          event: "*", schema: "public", table: "messages", filter: `room_id=eq.${roomid}` 
        }, (event: any) => {
          if (event.eventType === "INSERT") setMessages((prev) => [...prev, event.new]);
          if (event.eventType === "DELETE") setMessages((prev) => prev.filter(m => m.id !== event.old.id));
        })
        .subscribe(async (status: string) => {
          if (status === "SUBSCRIBED") {
            await channel.track({ online_at: new Date().toISOString(), fp: result.visitorId });
          }
        });
    };

    setupChat();
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current); };
  }, [roomid, nickname]);

  const submitReport = async () => {
    const finalReason = reportReason === "Other" ? customReason : reportReason;
    if (!finalReason) return alert("Select a reason.");

    const presence = channelRef.current?.presenceState();
    const logsWithFp = messages.slice(-30).map(msg => ({
      nickname: msg.nickname,
      content: msg.content,
      fp: presence[msg.nickname]?.[0]?.fp || "Unknown"
    }));

    const lastOtherMessage = [...messages].reverse().find(m => m.nickname !== nickname);
    const targetFp = lastOtherMessage ? (presence[lastOtherMessage.nickname]?.[0]?.fp || "Unknown") : "Unknown";

    await supabase.from("reports").insert([{
      reported_by: nickname,
      reported_user: lastOtherMessage?.nickname || "Unknown",
      fingerprint: targetFp,
      room_id: roomid,
      chat_log: logsWithFp,
      reason: finalReason
    }]);

    alert("Reported. Admin will review the encrypted logs.");
    setShowReportModal(false);
  };

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

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-[100dvh] bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
      
      {/* REPORT MODAL */}
      <AnimatePresence>
        {showReportModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl w-full max-w-sm shadow-2xl">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-red-500"><Flag className="w-5 h-5"/> Report Incident</h3>
              <div className="space-y-3 mb-6">
                {["Harassment", "Spamming", "NSFW Content", "Other"].map((r) => (
                  <button key={r} onClick={() => setReportReason(r)} className={`w-full p-3 rounded-xl border text-xs font-bold transition-all uppercase tracking-widest ${reportReason === r ? "bg-red-600 border-red-500 text-white" : "bg-zinc-800 border-zinc-700 text-zinc-400"}`}>
                    {r}
                  </button>
                ))}
                {reportReason === "Other" && (
                  <textarea value={customReason} onChange={(e) => setCustomReason(e.target.value)} placeholder="Details..." className="w-full bg-black border border-zinc-700 rounded-xl p-3 text-sm text-white" />
                )}
              </div>
              <div className="flex gap-3">
                <button onClick={submitReport} className="flex-1 bg-white text-black py-3 rounded-xl font-black text-xs uppercase tracking-widest">SUBMIT</button>
                <button onClick={() => setShowReportModal(false)} className="px-5 bg-zinc-800 py-3 rounded-xl font-bold text-zinc-400 border border-zinc-700 hover:bg-zinc-700 transition-all"><X className="w-4 h-4" /></button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl max-w-xs w-full text-center shadow-2xl">
              <div className="w-14 h-14 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-500/20"><AlertTriangle className="w-7 h-7" /></div>
              <h3 className="text-xl font-bold mb-2 uppercase italic tracking-tighter">End Session?</h3>
              <p className="text-zinc-400 text-xs mb-6 px-4 font-bold uppercase tracking-widest leading-relaxed">Your logs will be purged from this frequency.</p>
              <div className="flex flex-col gap-3">
                <button onClick={handlePurgeAndExit} className="w-full bg-red-600 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-500 transition-all">Confirm <LogOut className="w-4 h-4" /></button>
                <button onClick={() => setShowConfirm(false)} className="w-full bg-zinc-800 py-4 rounded-2xl text-zinc-400 font-bold text-xs uppercase tracking-widest border border-zinc-700">Stay</button>
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
            <h2 className="font-bold text-sm md:text-lg truncate tracking-tighter uppercase italic">{roomid}</h2>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{onlineCount} Active</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button onClick={() => setShowReportModal(true)} className="h-10 w-10 flex items-center justify-center rounded-xl border border-zinc-800 text-zinc-600 hover:text-red-500 transition-all">
            <Flag className="w-4 h-4" />
          </button>
          <button onClick={copyInvite} className="h-10 px-3 md:px-5 rounded-xl border border-zinc-800 bg-zinc-900/50 flex items-center gap-2 text-[10px] md:text-sm font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all text-zinc-300">
            {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />} 
            <span className="hidden sm:inline">{copied ? "Copied" : "Invite"}</span>
          </button>
          <button onClick={() => setShowConfirm(true)} className="h-10 w-10 flex items-center justify-center rounded-xl border border-zinc-800 text-zinc-500 hover:text-red-400 active:scale-95 transition-all"><Trash2 className="w-4 h-4" /></button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 no-scrollbar overscroll-none">
        {messages.map((msg, i) => (
          <div key={msg.id || i}>
            {msg.isSystem ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center my-4">
                <span className="text-[9px] bg-zinc-900/50 border border-zinc-800/30 px-4 py-1.5 rounded-full text-zinc-500 font-bold uppercase tracking-widest">
                  {msg.content}
                </span>
              </motion.div>
            ) : (
              <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
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
            )}

            {/* ADSTERRA INJECTION EVERY 10 MESSAGES */}
            {(i + 1) % 10 === 0 && <AdsterraBanner />}
          </div>
        ))}
        <div ref={scrollRef} className="h-4" />
      </div>

      <div className="p-4 md:p-8 bg-zinc-950/50 backdrop-blur-md border-t border-zinc-900/80 safe-bottom shrink-0">
        <form onSubmit={sendMessage} className="max-w-5xl mx-auto relative flex items-center gap-2">
          <input 
            type="text" 
            value={newMessage} 
            onChange={(e) => setNewMessage(e.target.value)} 
            placeholder="Whisper into the void..." 
            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-4 pr-14 py-4 outline-none text-[16px] text-white focus:border-purple-500/50 transition-all shadow-inner" 
          />
          <button type="submit" disabled={!newMessage.trim()} className="absolute right-2 p-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl active:scale-90 transition-all disabled:opacity-0 shadow-lg">
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
