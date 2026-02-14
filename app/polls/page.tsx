"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, BarChart3, Clock, Flame, 
  TrendingUp, CheckCircle2,
  MessageSquare, Heart, Radio, Send,
  Plus, MoreHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function PollsPage() {
  const router = useRouter();
  const [polls, setPolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userFp, setUserFp] = useState<string>("");
  const [scrolled, setScrolled] = useState(false);

  // Comment Modal State
  const [activePollForComments, setActivePollForComments] = useState<any>(null);
  const [newComment, setNewComment] = useState("");
  const [isPostingComment, setIsPostingComment] = useState(false);

  const [broadcastType, setBroadcastType] = useState<"poll" | "post">("poll");

  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [duration, setDuration] = useState("24");

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    let fp = localStorage.getItem("user_fingerprint");
    if (!fp) {
      fp = "fp_" + Math.random().toString(36).substring(2, 15);
      localStorage.setItem("user_fingerprint", fp);
    }
    setUserFp(fp);
  }, []);

  const fetchPolls = useCallback(async () => {
    const { data, error } = await supabase
      .from("polls")
      .select(`
        *,
        poll_options (*),
        poll_votes (option_id, fingerprint),
        poll_comments (*)
      `)
      .gt("expires_at", new Date().toISOString())
      .order('created_at', { ascending: false });

    if (!error && data) {
      setPolls(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPolls();
    const interval = setInterval(fetchPolls, 10000);
    return () => clearInterval(interval);
  }, [fetchPolls]);

  const handleLike = async (pollId: string) => {
    setPolls(prev => prev.map(p => 
      p.id === pollId ? { ...p, likes: (p.likes || 0) + 1 } : p
    ));
    
    const { error } = await supabase.rpc('increment_likes', { row_id: pollId });
    
    if (error) {
      console.error("Like failed:", error);
      fetchPolls();
    }
  };

  const submitComment = async () => {
    if (!newComment.trim() || !activePollForComments) return;
    setIsPostingComment(true);
    
    const { data, error } = await supabase
      .from("poll_comments")
      .insert([{
        poll_id: activePollForComments.id,
        fingerprint: userFp,
        comment_text: newComment.trim()
      }])
      .select();

    if (error) {
      console.error("Comment Error:", error);
      alert("Failed to transmit comment.");
    } else {
      const freshComment = data[0];
      
      setActivePollForComments((prev: any) => ({
        ...prev,
        poll_comments: [freshComment, ...(prev.poll_comments || [])]
      }));
      
      setNewComment("");
      fetchPolls();
    }
    setIsPostingComment(false);
  };

  const createPoll = async () => {
    if (!question.trim()) return alert("Content required");
    setIsSubmitting(true);
    try {
      const expiry = new Date(); 
      expiry.setHours(expiry.getHours() + parseInt(duration));

      const { data: poll, error: pErr } = await supabase.from("polls")
        .insert([{ 
            question: question.trim(), 
            expires_at: expiry.toISOString(),
            creator_fingerprint: userFp,
            type: broadcastType 
        }])
        .select().single();

      if (poll && broadcastType === "poll") {
        const optPayload = options.filter(o => o.trim()).map(text => ({ poll_id: poll.id, option_text: text.trim() }));
        await supabase.from("poll_options").insert(optPayload);
      }
      setShowCreate(false); setQuestion(""); fetchPolls();
    } catch (err: any) { alert(err.message); } finally { setIsSubmitting(false); }
  };

  const handleVote = async (pollId: string, optionId: string) => {
    const { error } = await supabase.rpc('cast_poll_vote', { p_poll_id: pollId, p_option_id: optionId, p_fp: userFp });
    if (!error) fetchPolls();
  };

  const getRemainingTime = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    return diff <= 0 ? "Expired" : `${Math.floor(diff / 1000 / 3600)}h left`;
  };

  return (
    <div className="min-h-screen w-full bg-[#030303] text-zinc-100 selection:bg-purple-500/30 font-sans">
      
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-900/10 blur-[120px] pointer-events-none" />

      <header className={cn(
        "fixed top-0 left-0 right-0 z-[50] transition-all duration-500 px-6 py-4 flex justify-between items-center",
        scrolled ? "bg-black/60 backdrop-blur-xl border-b border-white/5 py-3" : "bg-transparent"
      )}>
        <div onClick={() => router.push("/")} className="flex items-center gap-3 cursor-pointer group">
          <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(147,51,234,0.4)] group-hover:scale-110 transition-transform">
            <Radio className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-black italic tracking-tighter uppercase text-white">Murmurz</h1>
        </div>
        <button 
          onClick={() => setShowCreate(true)} 
          className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2.5 rounded-full font-black uppercase text-[10px] tracking-widest shadow-[0_0_20px_rgba(147,51,234,0.3)] transition-all active:scale-95"
        >
          New Broadcast
        </button>
      </header>

      <main className="max-w-3xl mx-auto px-6 pt-32 pb-32 relative z-10">
        <div className="flex flex-col gap-8">
          {polls.map((poll) => (
            <motion.div 
              key={poll.id} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-zinc-900/30 border border-white/5 backdrop-blur-md rounded-[2.5rem] p-8 hover:border-purple-500/20 transition-all group"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                    <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest">
                      {poll.type === "poll" ? "Protocol: Poll" : "Protocol: Transmission"}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-zinc-100 leading-tight group-hover:text-white transition-colors">
                    {poll.question}
                  </h2>
                </div>
                <span className="text-[9px] font-black text-zinc-600 uppercase bg-black/40 px-3 py-1.5 rounded-full border border-white/5">
                  {getRemainingTime(poll.expires_at)}
                </span>
              </div>

              {poll.type === "poll" ? (
                <div className="space-y-3 mb-6">
                  {poll.poll_options.map((opt: any) => {
                    const votes = poll.poll_votes?.filter((v: any) => v.option_id === opt.id).length || 0;
                    const percent = poll.poll_votes?.length > 0 ? (votes / poll.poll_votes.length) * 100 : 0;
                    const isSelected = poll.poll_votes?.some((v: any) => v.fingerprint === userFp && v.option_id === opt.id);

                    return (
                      <button 
                        key={opt.id} 
                        onClick={() => handleVote(poll.id, opt.id)} 
                        className={cn(
                          "w-full relative h-14 bg-black/40 rounded-2xl border transition-all overflow-hidden",
                          isSelected ? "border-purple-500/50" : "border-white/5 hover:border-white/10"
                        )}
                      >
                        <motion.div 
                          initial={{ width: 0 }} 
                          animate={{ width: `${percent}%` }} 
                          className={cn("absolute inset-0", isSelected ? "bg-purple-600/20" : "bg-zinc-800/20")} 
                        />
                        <div className="absolute inset-0 px-5 flex justify-between items-center text-[11px] font-black uppercase">
                          <span className={isSelected ? "text-purple-400" : "text-zinc-400"}>{opt.option_text}</span>
                          <span className="text-zinc-500">{percent.toFixed(0)}%</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent mb-6" />
              )}

              <div className="flex items-center gap-3">
                <button 
                    onClick={() => handleLike(poll.id)} 
                    className="flex items-center gap-2 px-5 py-2.5 bg-purple-600/5 rounded-2xl border border-purple-500/10 text-purple-400 hover:bg-purple-600 hover:text-white transition-all"
                >
                  <Heart className={cn("w-4 h-4", poll.likes > 0 && "fill-current")} />
                  <span className="text-[11px] font-black">{poll.likes || 0}</span>
                </button>
                <button 
                    onClick={() => setActivePollForComments(poll)} 
                    className="flex items-center gap-2 px-5 py-2.5 bg-white/5 rounded-2xl border border-white/5 text-zinc-400 hover:bg-white/10 hover:text-white transition-all"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-[11px] font-black">{poll.poll_comments?.length || 0}</span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      <AnimatePresence>
        {activePollForComments && (
          <motion.div 
            initial={{ y: "100%" }} 
            animate={{ y: 0 }} 
            exit={{ y: "100%" }} 
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[110] bg-[#030303] flex flex-col pt-20"
          >
            <div className="max-w-3xl mx-auto w-full flex flex-col h-full bg-zinc-950 border-x border-white/5 shadow-2xl">
                <div className="p-6 flex justify-between items-center border-b border-white/5">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-500">Frequency Discussion</h3>
                    <button onClick={() => setActivePollForComments(null)} className="p-2 bg-white/5 rounded-full text-zinc-400 hover:text-white"><X className="w-5 h-5"/></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
                    <div className="pb-8 border-b border-white/5">
                        <h2 className="text-2xl font-bold text-white mb-2">{activePollForComments.question}</h2>
                        <span className="text-[10px] text-zinc-500 font-black uppercase">Transmission ID: {activePollForComments.id.slice(0,8)}</span>
                    </div>

                    <div className="space-y-4">
                        {activePollForComments.poll_comments?.length > 0 ? (
                            activePollForComments.poll_comments.map((c: any, i: number) => (
                                <motion.div 
                                    initial={{ opacity: 0, x: -10 }} 
                                    animate={{ opacity: 1, x: 0 }} 
                                    key={i} 
                                    className="bg-white/[0.02] border border-white/5 p-5 rounded-3xl"
                                >
                                    <p className="text-[13px] text-zinc-300 leading-relaxed">{c.comment_text}</p>
                                    <span className="text-[8px] text-zinc-600 font-bold uppercase mt-3 block">Anonymous Node</span>
                                </motion.div>
                            ))
                        ) : (
                            <div className="text-center py-20">
                                <MessageSquare className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
                                <p className="text-zinc-600 text-xs font-black uppercase tracking-widest">No transmissions yet</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 bg-black border-t border-white/5">
                    <div className="flex gap-3 bg-zinc-900/50 border border-white/10 p-2 rounded-[2rem] focus-within:border-purple-500/40 transition-all">
                        <input 
                            value={newComment} 
                            onChange={e => setNewComment(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && submitComment()}
                            placeholder="Type a response..." 
                            className="flex-1 bg-transparent px-4 py-2 text-sm outline-none placeholder:text-zinc-700"
                        />
                        <button onClick={submitComment} disabled={isPostingComment} className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white hover:bg-purple-500 transition-all disabled:opacity-50">
                            {isPostingComment ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4">
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                className="bg-zinc-950 border border-purple-500/20 p-8 rounded-[3rem] w-full max-w-lg shadow-[0_0_80px_rgba(147,51,234,0.15)]"
            >
               <div className="flex justify-between items-center mb-8">
                  <div className="flex gap-4 p-1 bg-black rounded-2xl border border-white/5">
                    <button onClick={() => setBroadcastType("poll")} className={cn("px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", broadcastType === "poll" ? "bg-purple-600 text-white shadow-lg" : "text-zinc-500 hover:text-white")}>Poll</button>
                    <button onClick={() => setBroadcastType("post")} className={cn("px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", broadcastType === "post" ? "bg-purple-600 text-white shadow-lg" : "text-zinc-500 hover:text-white")}>Post</button>
                  </div>
                  <button onClick={() => setShowCreate(false)} className="p-2 bg-white/5 rounded-full text-zinc-500 hover:text-white"><X className="w-5 h-5"/></button>
               </div>

               <div className="space-y-6">
                   <div className="space-y-2">
                       <label className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-2">Broadcast Content</label>
                       <textarea 
                        value={question} 
                        onChange={e => setQuestion(e.target.value)} 
                        placeholder="What's the frequency?..." 
                        className="w-full bg-black border border-white/5 p-6 rounded-[2rem] text-sm text-white focus:border-purple-500/40 outline-none h-32 resize-none transition-all" 
                       />
                   </div>

                   {broadcastType === 'poll' && (
                       <div className="space-y-3">
                            <label className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-2">Node Options</label>
                            {options.map((opt, i) => (
                                <input 
                                    key={i}
                                    value={opt} 
                                    onChange={e => {
                                        const n = [...options]; n[i] = e.target.value; setOptions(n);
                                    }}
                                    placeholder={`Option ${i+1}`}
                                    className="w-full bg-black border border-white/5 px-5 py-3.5 rounded-2xl text-[12px] focus:border-purple-500/20 outline-none"
                                />
                            ))}
                       </div>
                   )}

                   <div className="w-full">
                        <button 
                            onClick={createPoll} 
                            disabled={isSubmitting || !question.trim()} 
                            className="w-full py-5 bg-purple-600 rounded-[1.5rem] text-white font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95 disabled:opacity-30"
                        >
                            {isSubmitting ? "Transmitting..." : "Transmit"}
                        </button>
                   </div>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #27272a; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #7c3aed; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
