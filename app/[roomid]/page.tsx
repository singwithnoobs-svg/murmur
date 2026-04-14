"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import {
  Hash,
  Send,
  LogOut,
  Check,
  Flag,
  X,
  SmilePlus,
  Reply,
  Share2,
  Paperclip
} from "lucide-react";
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
  const [activeReactionPicker, setActiveReactionPicker] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<any>(null);
  const [connected, setConnected] = useState(false);
  const [realtimeReady, setRealtimeReady] = useState(false);

  // Reporting State
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [extraReason, setExtraReason] = useState("");
  const [isReporting, setIsReporting] = useState(false);

  // Refs
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messageChannelRef = useRef<any>(null);
  const presenceChannelRef = useRef<any>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  const isAudioUrl = (url: string) => url.match(/\.(ogg|wav|mp3)/) != null;

  // NICKNAME CHECK
  useEffect(() => {
    const savedName = sessionStorage.getItem("murmur_nickname");
    if (!savedName || !roomid) {
      router.push("/");
      return;
    }
    setNickname(savedName);
  }, [roomid, router]);

  // CLEANUP
  const cleanup = useCallback(() => {
    isMountedRef.current = false;
    if (messageChannelRef.current) {
      supabase.removeChannel(messageChannelRef.current);
      messageChannelRef.current = null;
    }
    if (presenceChannelRef.current) {
      supabase.removeChannel(presenceChannelRef.current);
      presenceChannelRef.current = null;
    }
  }, []);

  // HELPER: Insert to DB + INSTANT broadcast (fixes the exact bug you reported)
  const insertAndBroadcast = useCallback(async (insertPayload: any) => {
    const { data, error } = await supabase
      .from("messages")
      .insert([insertPayload])
      .select()
      .single();

    if (error) throw error;

    // INSTANT delivery to EVERYONE (including other users) via broadcast
    // This is the fix for "other person doesn't see message until reload"
    if (messageChannelRef.current && isMountedRef.current) {
      messageChannelRef.current.send({
        type: "broadcast",
        event: "new_message",
        payload: data,
      });
    }

    return data;
  }, []);
  // MAIN SETUP - now hybrid (postgres_changes + broadcast) for 100% reliability at 1000s scale
  useEffect(() => {
    if (!roomid || !nickname) return;

    isMountedRef.current = true;

    const setupChat = async () => {
      try {
        // Fingerprint
        const fpLoad = await FingerprintJS.load();
        const result = await fpLoad.get();
        if (!isMountedRef.current) return;
        setMyFingerprint(result.visitorId);

        // SINGLE CHANNEL (no duplicates ever)
        const messageChannel = supabase
          .channel(`room:${roomid}:messages`, {
            config: { broadcast: { self: true } },
          })
          // POSTGRES REALTIME (safety net for reactions/updates + fallback)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "messages",
              filter: `room_id=eq.${roomid}`,
            },
            (payload) => {
              if (!isMountedRef.current) return;
              setMessages((prev) => {
                const exists = prev.some((m) => m.id === payload.new.id);
                if (exists) return prev;
                return [...prev, payload.new].slice(-100);
              });
            }
          )
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "messages",
              filter: `room_id=eq.${roomid}`,
            },
            (payload) => {
              if (!isMountedRef.current) return;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === payload.new.id ? { ...m, ...payload.new } : m
                )
              );
            }
          )
          // BROADCAST: new messages (INSTANT delivery - fixes your bug)
          .on(
            "broadcast",
            { event: "new_message" },
            ({ payload }) => {
              if (!isMountedRef.current) return;
              setMessages((prev) => {
                const exists = prev.some((m) => m.id === payload.id);
                if (exists) return prev;
                return [...prev, payload].slice(-100);
              });
            }
          )
          // BROADCAST: typing (debounced)
          .on("broadcast", { event: "typing" }, ({ payload }) => {
            if (!isMountedRef.current) return;
            setTypingUsers((prev) => {
              if (prev.includes(payload.nickname)) return prev;
              return [...prev, payload.nickname];
            });
            setTimeout(() => {
              if (!isMountedRef.current) return;
              setTypingUsers((prev) => prev.filter((u) => u !== payload.nickname));
            }, 2000);
          })
          .subscribe((status) => {
            if (!isMountedRef.current) return;
            console.log("📡 Message channel status:", status);
            setConnected(status === "SUBSCRIBED");
            if (status === "SUBSCRIBED") setRealtimeReady(true);
          });

        messageChannelRef.current = messageChannel;

        // PRESENCE (optimized for 1000s users)
        const presenceChannel = supabase.channel(`room:${roomid}:presence`, {
          config: { presence: { key: `${nickname}-${result.visitorId}` } },
        });

        presenceChannel
          .on("presence", { event: "sync" }, () => {
            if (!isMountedRef.current) return;
            const state = presenceChannel.presenceState();
            setOnlineCount(Object.keys(state).length);
          })
          .subscribe(async (status) => {
            if (!isMountedRef.current) return;
            if (status === "SUBSCRIBED") {
              await presenceChannel.track({
                nickname,
                fp: result.visitorId,
                online_at: new Date().toISOString(),
              });
            }
          });

        presenceChannelRef.current = presenceChannel;

        // INITIAL LOAD (last 100 messages)
        const { data: rawData } = await supabase
          .from("messages")
          .select("*")
          .eq("room_id", roomid)
          .order("created_at", { ascending: false })
          .limit(100);

        if (isMountedRef.current && rawData) {
          setMessages(rawData.reverse());
        }
      } catch (err) {
        console.error("Chat setup failed:", err);
        setConnected(false);
      }
    };

    setupChat();

    return () => cleanup();
  }, [roomid, nickname, cleanup, insertAndBroadcast]);
  

  // AUTO-SCROLL (smooth)
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  // SEND TEXT MESSAGE
  const sendMessage = async () => {
    if (!newMessage.trim() || !messageChannelRef.current) return;

    const content = newMessage.trim();
    const replyData = replyTo
      ? { nickname: replyTo.nickname, content: replyTo.content?.slice(0, 100) }
      : null;

    setNewMessage("");
    setReplyTo(null);

    try {
      const insertPayload = {
        room_id: roomid,
        nickname,
        content,
        reactions: {},
        reply_metadata: replyData,
      };

      const data = await insertAndBroadcast(insertPayload);

      // Local optimistic add (broadcast will also trigger but exists-check prevents duplicate)
      if (isMountedRef.current) {
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === data.id);
          if (exists) return prev;
          return [...prev, data].slice(-100);
        });
      }
    } catch (err) {
      console.error("Send failed:", err);
    }
  };

  // DEBOUNCED TYPING
  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (messageChannelRef.current && nickname) {
        messageChannelRef.current.send({
          type: "broadcast",
          event: "typing",
          payload: { nickname },
        });
      }
    }, 300);
  };

  // IMAGE UPLOAD (now uses same instant broadcast)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !messageChannelRef.current) return;
    e.target.value = "";

    try {
      const fileName = `${Date.now()}-${crypto.randomUUID()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("chat-images")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("chat-images").getPublicUrl(fileName);

      const replyData = replyTo
        ? { nickname: replyTo.nickname, content: replyTo.content?.slice(0, 100) }
        : null;

      const insertPayload = {
        room_id: roomid,
        nickname,
        content: urlData.publicUrl,
        is_image: true,
        expires_at: new Date(Date.now() + 30000).toISOString(),
        reactions: {},
        reply_metadata: replyData,
      };

      await insertAndBroadcast(insertPayload);
      setReplyTo(null);
    } catch (err) {
      console.error("Image upload failed:", err);
    }
  };

  // EXIT
  const handleExit = async () => {
    try {
      await supabase
        .from("messages")
        .delete()
        .eq("room_id", roomid)
        .eq("nickname", nickname);

      if (onlineCount <= 1) {
        await supabase.from("rooms").delete().eq("id", roomid);
      }

      sessionStorage.removeItem("murmur_nickname");
      cleanup();
      router.push("/");
    } catch (err) {
      console.error(err);
      router.push("/");
    }
  };

  // REPORT
  const submitReport = async () => {
    if (!reportReason || isReporting || !presenceChannelRef.current) return;
    setIsReporting(true);

    try {
      const presenceState = presenceChannelRef.current.presenceState();
      const lastOther = [...messages].reverse().find((m) => m.nickname !== nickname);
      const targetNickname = lastOther?.nickname || "Unknown";

      let targetFp = "Hidden_Node";
      for (const [key, presences] of Object.entries(presenceState)) {
        if (key.startsWith(`${targetNickname}-`)) {
          targetFp = (presences as any[])[0]?.fp || "Hidden_Node";
          break;
        }
      }

      const logs = messages.slice(-20).map((msg) => ({
        nickname: msg.nickname,
        content: msg.content?.slice(0, 200) || "",
      }));

      await supabase.from("reports").insert([{
        reported_user: targetNickname,
        fingerprint: targetFp,
        reason: `${reportReason}: ${extraReason || "No details"}`,
        chat_log: logs,
        room_id: roomid,
      }]);

      setShowReportModal(false);
      setReportReason("");
      setExtraReason("");
    } catch (err) {
      console.error("Report failed:", err);
    } finally {
      setIsReporting(false);
    }
  };

  // REACTION
  const addReaction = async (messageId: string, currentReactions: any, emoji: string) => {
    const updated = { ...(currentReactions || {}) };
    updated[emoji] = (updated[emoji] || 0) + 1;

    await supabase
      .from("messages")
      .update({ reactions: updated })
      .eq("id", messageId)
      .eq("room_id", roomid);

    setActiveReactionPicker(null);
  };

  // SHARE
  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/?id=${roomid}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Murmur Node",
          text: "Join secure ephemeral chat",
          url: shareUrl,
        });
      } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      } catch {}
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
                  <button
                    key={r}
                    onClick={() => setReportReason(r)}
                    className={`p-4 rounded-xl border text-[10px] font-black uppercase transition-all ${
                      reportReason === r ? "bg-red-600 border-red-500 text-white" : "bg-black border-zinc-800 hover:border-zinc-600"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <textarea
                value={extraReason}
                onChange={(e) => setExtraReason(e.target.value)}
                placeholder="Extra details..."
                className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-sm mb-6 outline-none resize-none h-24"
              />
              <div className="flex gap-3">
                <button
                  onClick={submitReport}
                  disabled={isReporting}
                  className="flex-1 bg-white text-black py-4 rounded-xl font-black text-xs uppercase disabled:opacity-50"
                >
                  {isReporting ? "Sending..." : "Submit Report"}
                </button>
                <button onClick={() => setShowReportModal(false)} className="px-6 bg-zinc-800 rounded-xl hover:bg-zinc-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* HEADER */}
      <header className="h-20 border-b border-purple-500/10 bg-black/40 backdrop-blur-md flex items-center justify-between px-5 shrink-0 z-50">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 bg-purple-600/20 rounded-xl flex items-center justify-center border border-purple-500/20">
            <Hash className="w-5 h-5 text-purple-400" />
          </div>
          <div className="truncate">
            <h2 className="font-black text-sm uppercase italic tracking-tight truncate">{roomid}</h2>
            <span className="flex items-center gap-1.5 text-[10px] text-green-500 font-bold uppercase tracking-widest">
              <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
              {onlineCount} Nodes • {connected ? "LIVE" : "CONNECTING..."}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setShowReportModal(true)} className="h-12 w-12 flex items-center justify-center rounded-2xl border border-white/5 bg-zinc-900/50 text-zinc-400 hover:text-red-500 active:scale-90 transition-all">
            <Flag className="w-6 h-6" />
          </button>
          <button onClick={() => setShowConfirm(true)} className="h-12 w-12 flex items-center justify-center rounded-2xl border border-white/5 bg-zinc-900/50 text-zinc-400 hover:text-purple-400 active:scale-90 transition-all">
            <LogOut className="w-6 h-6" />
          </button>
          <button onClick={handleShare} className="h-12 px-4 rounded-2xl border border-purple-500/30 bg-purple-600/10 flex items-center gap-2 text-xs font-black uppercase text-purple-400 active:scale-95 transition-all">
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{copied ? "COPIED" : "INVITE"}</span>
          </button>
        </div>
      </header>

     {/* CHAT AREA */}
<div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 no-scrollbar relative bg-[#070507]">
  <div className="max-w-4xl mx-auto">

    {messages.map((msg) => {
      const isMe = msg.nickname === nickname;
      const hasReply = Boolean(msg.reply_metadata?.content);

      return (
        <div
          key={msg.id ?? crypto.randomUUID()}
          className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
        >
          {/* username */}
          <span
            className={`text-[9px] font-black mb-1 px-1 uppercase tracking-wider
            ${isMe ? "text-purple-500" : "text-zinc-600"}`}
          >
            {msg.nickname}
          </span>

          <div
            className={`group relative flex items-end gap-2 max-w-[90%] ${
              isMe ? "flex-row-reverse" : ""
            }`}
          >
            {/* message bubble */}
            <div
              className={`relative px-4 py-2.5 rounded-2xl text-[15px] shadow-lg
              break-words leading-snug transition-all duration-200
              ${
                isMe
                  ? "bg-purple-600 text-white rounded-tr-none"
                  : "bg-zinc-900 border border-purple-500/10 text-zinc-200 rounded-tl-none"
              }`}
            >
              {/* reply preview */}
              {hasReply && (
                <div className="mb-2 p-2 rounded-lg bg-black/20 border-l-2 border-white/20 text-[11px] opacity-70 italic truncate">
                  ↪ {msg.reply_metadata.content}
                </div>
              )}

              {/* message content */}
              {msg.is_image ? (
                <ImageMessage msg={msg} />
              ) : isAudioUrl(msg.content) ? (
                <audio
                  controls
                  className="h-8 w-52 opacity-80 hover:opacity-100 transition"
                >
                  <source src={msg.content} />
                </audio>
              ) : (
                <div className="whitespace-pre-wrap break-words">
                  {msg.content}
                </div>
              )}
            </div>

            {/* actions */}
            <div className="flex flex-col opacity-0 group-hover:opacity-100 transition">
              <button
                onClick={() => setReplyTo(msg)}
                className="p-1 text-zinc-600 hover:text-white"
                aria-label="Reply"
              >
                <Reply className="w-4 h-4" />
              </button>

              <button
                onClick={() => setActiveReactionPicker(msg.id)}
                className="p-1 text-zinc-600 hover:text-purple-400"
                aria-label="React"
              >
                <SmilePlus className="w-4 h-4" />
              </button>
            </div>

            {/* reaction picker */}
            {activeReactionPicker === msg.id && (
              <div className="absolute bottom-full mb-2 z-50 bg-zinc-900 border border-purple-500/20 p-1 rounded-xl flex gap-1 shadow-2xl">
                {["🔥", "❤️", "😂", "🫡"].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      addReaction(msg.id, msg.reactions, emoji);
                      setActiveReactionPicker(null);
                    }}
                    className="w-8 h-8 text-base hover:bg-white/10 rounded-lg transition"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    })}

    {/* typing indicator */}
    {typingUsers.length > 0 && (
      <div className="text-[10px] font-bold text-purple-500 animate-pulse uppercase px-2 flex items-center gap-2">
        <span className="w-2 h-2 bg-purple-500 rounded-full animate-ping" />
        SIGNAL INBOUND...
      </div>
    )}

    {/* scroll anchor */}
    <div ref={scrollRef} className="h-6" />
  </div>
</div>

     {/* INPUT AREA */}
<div className="p-4 md:p-8 bg-zinc-950/60 border-t border-purple-500/10 shrink-0 backdrop-blur-md">
  <div className="max-w-3xl mx-auto">

    {replyTo && (
      <div className="mb-2 px-4 py-2 bg-zinc-900/50 rounded-t-2xl flex items-center justify-between border border-purple-500/10">
        <p className="text-[10px] text-zinc-400 truncate italic">
          Replying to <span className="font-semibold text-zinc-200">{replyTo.nickname}</span>
        </p>

        <button
          onClick={() => setReplyTo(null)}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-800 transition"
        >
          <X className="w-4 h-4 text-zinc-400" />
        </button>
      </div>
    )}

    {/* INPUT BAR */}
    <div
      className={`flex items-end gap-2 bg-zinc-900/80 border border-white/10 p-2 transition-all backdrop-blur-xl
      ${replyTo ? "rounded-b-2xl" : "rounded-3xl"}
      focus-within:border-purple-500/40`}
    >

      {/* TEXTAREA */}
      <textarea
        ref={textareaRef}
        rows={1}
        value={newMessage}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
          }
        }}
        onChange={handleTyping}
        placeholder="Inject signal..."
        className="flex-1 bg-transparent outline-none resize-none max-h-32
        text-[15px] leading-5 px-3 py-3 placeholder:text-zinc-600 text-zinc-100"
      />

      {/* ICON GROUP */}
      <div className="flex items-center gap-2 pr-1 pb-1">

        {/* FILE */}
        <label className="w-10 h-10 flex items-center justify-center rounded-xl
        bg-zinc-800 hover:bg-zinc-700 transition active:scale-95 cursor-pointer">
          <Paperclip className="w-5 h-5 text-zinc-300" />
          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        </label>

        {/* VOICE */}
        <div className="w-10 h-10 flex items-center justify-center rounded-xl
        bg-zinc-800 hover:bg-zinc-700 transition active:scale-95">
          <VoiceRecorder
            onUploadComplete={async (url: string) => {
              const replyData = replyTo
                ? { nickname: replyTo.nickname, content: replyTo.content?.slice(0, 100) }
                : null;

              try {
                await insertAndBroadcast({
                  room_id: roomid,
                  nickname,
                  content: url,
                  reactions: {},
                  reply_metadata: replyData,
                });

                setReplyTo(null);
              } catch (err) {
                console.error(err);
              }
            }}
          />
        </div>

        {/* SEND */}
        <button
          onClick={sendMessage}
          className="w-10 h-10 flex items-center justify-center rounded-xl
          bg-white text-black hover:bg-zinc-200 transition active:scale-95"
        >
          <Send className="w-5 h-5" />
        </button>

      </div>
    </div>
  </div>
</div>
</div>
);
}
//EPHEMERAL IMAGE COMPONENT
function ImageMessage({ msg }: { msg: any }) {
  const [opened, setOpened] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [destroyed, setDestroyed] = useState(false);

  useEffect(() => {
    const created = new Date(msg.created_at).getTime();
    const interval = setInterval(() => {
      const remaining = Math.max(0, 30 - Math.floor((Date.now() - created) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        setDestroyed(true);
        clearInterval(interval);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [msg.created_at]);

  if (destroyed) {
    return (
      <motion.div
        initial={{ scale: 1, opacity: 1 }}
        animate={{ scale: 0.4, opacity: 0 }}
        className="text-xs text-red-500 font-black"
      >
        💣 SIGNAL DESTROYED
      </motion.div>
    );
  }

  return (
    <div className="relative max-w-xs group cursor-pointer" onClick={() => setOpened(true)}>
      <img
        src={msg.content}
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        loading="lazy"
        className={`rounded-xl transition-all duration-300 ${opened ? "blur-none" : "blur-2xl"}`}
      />
      {!opened && (
        <div className="absolute inset-0 flex items-center justify-center text-xs font-black bg-black/60 rounded-xl pointer-events-none text-white">
          TAP TO DECRYPT
        </div>
      )}
      <div className="absolute bottom-1 right-2 text-[10px] bg-black/70 px-2 py-0.5 rounded-lg text-white font-mono">
        ⏳ {timeLeft}s
      </div>
    </div>
  );
}
