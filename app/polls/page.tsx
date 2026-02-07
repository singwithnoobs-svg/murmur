"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, X, BarChart3, Clock, Flame, 
  TrendingUp, PlayCircle, CheckCircle2 
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function PollsPage() {
  const [polls, setPolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userFp, setUserFp] = useState<string>("");

  // Ad State
  const [hasWatchedAd, setHasWatchedAd] = useState(false);
  const [adTimer, setAdTimer] = useState(0);
  const AD_LINK = "https://www.effectivegatecpm.com/ynxwndhjsn?key=feccdd147daef403531a53b803a60d17";

  // Form State
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [duration, setDuration] = useState("24");

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
        poll_votes (option_id, fingerprint)
      `)
      .gt("expires_at", new Date().toISOString());

    if (!error && data) {
      const sorted = data.sort((a, b) => {
        const aVotes = a.poll_votes?.length || 0;
        const bVotes = b.poll_votes?.length || 0;
        if (bVotes !== aVotes) return bVotes - aVotes;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      setPolls(sorted);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPolls();
    const interval = setInterval(fetchPolls, 5000);
    return () => clearInterval(interval);
  }, [fetchPolls]);

  // ADSTERRA INTEGRATION
  const triggerAdsterra = () => {
    // 1. Open Adsterra Direct Link
    window.open(AD_LINK, "_blank");

    // 2. Start 15s High-Retention Timer
    setAdTimer(15);
    const interval = setInterval(() => {
      setAdTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setHasWatchedAd(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const addOption = () => { if (options.length < 10) setOptions([...options, ""]); };
  const removeOption = (index: number) => { if (options.length > 2) setOptions(options.filter((_, i) => i !== index)); };

  const createPoll = async () => {
    if (!hasWatchedAd) return alert("Watch a commercial first!");
    if (!question.trim() || options.some(o => !o.trim())) return alert("Fill all fields");

    setIsSubmitting(true);
    try {
      const { data: existing } = await supabase.from("polls")
        .select("id")
        .eq("creator_fingerprint", userFp)
        .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (existing && existing.length > 0) {
        alert("Broadcast Limit: 1 poll per 24 hours.");
        setIsSubmitting(false);
        return;
      }

      const expiry = new Date(); 
      expiry.setHours(expiry.getHours() + parseInt(duration));

      const { data: poll, error: pErr } = await supabase.from("polls")
        .insert([{ 
            question: question.trim(), 
            expires_at: expiry.toISOString(),
            creator_fingerprint: userFp 
        }])
        .select().single();

      if (pErr) throw pErr;

      if (poll) {
        const optPayload = options.map(text => ({ 
            poll_id: poll.id, 
            option_text: text.trim() 
        }));
        await supabase.from("poll_options").insert(optPayload);
        setShowCreate(false); 
        setQuestion(""); 
        setOptions(["", ""]); 
        setHasWatchedAd(false);
        fetchPolls();
      }
    } catch (err: any) {
      alert(`Broadcast Failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

const handleVote = async (pollId: string, optionId: string) => {
  if (!userFp) return;

  const { error } = await supabase.rpc('cast_poll_vote', { 
      p_poll_id: pollId, 
      p_option_id: optionId, 
      p_fp: userFp 
  });

  if (error) {
    // This will now show the "You have already cast your vote" message from the SQL
    alert(error.message); 
  } else {
    fetchPolls(); // Refresh the numbers
  }
};

  const getRemainingTime = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return "Ended";
    const hrs = Math.floor(diff / 1000 / 3600);
    const mins = Math.floor((diff / 1000 / 60) % 60);
    return `${hrs}h ${mins}m`;
  };

  if (loading && polls.length === 0) return <div className="h-screen bg-black flex items-center justify-center text-red-500 font-black animate-pulse uppercase tracking-widest text-xs italic">Syncing Frequencies...</div>;

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 p-6 pb-24 font-sans">
      <div className="max-w-4xl mx-auto flex justify-between items-end mb-12">
        <div>
          <h1 className="text-4xl font-black italic tracking-tighter uppercase flex items-center gap-3">
            <BarChart3 className="text-red-500 w-8 h-8" /> Public Pulse
          </h1>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em] mt-2">Broadcast your frequency</p>
        </div>
        <button 
          onClick={() => setShowCreate(true)}
          className="bg-white text-black px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]"
        >
          Create Poll
        </button>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {polls.map((poll, idx) => {
          const totalVotes = poll.poll_votes?.length || 0;
          const userVote = poll.poll_votes?.find((v: any) => v.fingerprint === userFp);
          const maxVotes = Math.max(...poll.poll_options.map((o: any) => poll.poll_votes?.filter((v: any) => v.option_id === o.id).length || 0));

          return (
            <motion.div key={poll.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className={cn("bg-zinc-900/30 border rounded-[2.5rem] p-8 transition-all", idx === 0 ? "border-red-500/30 shadow-[0_0_40px_rgba(239,68,68,0.05)]" : "border-white/5")}>
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-bold tracking-tight text-white/90 leading-tight pr-10">{poll.question}</h2>
                {idx === 0 && <div className="bg-red-500/10 text-red-500 px-3 py-1 rounded-full text-[8px] font-black uppercase flex items-center gap-1 border border-red-500/20"><Flame className="w-3 h-3" /> Trending</div>}
              </div>
              <div className="space-y-3">
                {poll.poll_options.map((opt: any) => {
                  const optVotes = poll.poll_votes?.filter((v: any) => v.option_id === opt.id).length || 0;
                  const percentage = totalVotes > 0 ? (optVotes / totalVotes) * 100 : 0;
                  const isTop = optVotes === maxVotes && maxVotes > 0;
                  const isUserSelection = userVote?.option_id === opt.id;
                  return (
                    <button key={opt.id} onClick={() => handleVote(poll.id, opt.id)}
                      className={cn("w-full relative h-14 bg-black/40 rounded-2xl border border-white/5 overflow-hidden group transition-all active:scale-[0.98]", isUserSelection ? "border-red-500/50" : "")}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${percentage}%` }} transition={{ duration: 0.5 }} className={cn("absolute inset-0", isUserSelection ? "bg-red-500/20" : "bg-white/5")} />
                      <div className="absolute inset-0 px-6 flex justify-between items-center text-xs font-bold uppercase tracking-widest">
                        <span className={cn(isUserSelection ? "text-red-500" : "text-zinc-400 group-hover:text-white")}>{opt.option_text} {isUserSelection && "✓"}</span>
                        <span className="text-zinc-600 font-mono text-[10px]">{percentage.toFixed(0)}%</span>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="mt-6 pt-6 border-t border-white/5 flex flex-wrap justify-between items-center gap-4 text-[9px] font-black uppercase text-zinc-600">
                <span className="flex items-center gap-1.5"><TrendingUp className="w-3 h-3" /> {totalVotes} Global Votes</span>
                <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> Ends in: {getRemainingTime(poll.expires_at)}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-zinc-950 border border-white/10 p-8 rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh] no-scrollbar">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black italic uppercase text-red-500">New Broadcast</h3>
                <button onClick={() => setShowCreate(false)} className="text-zinc-500 hover:text-white"><X /></button>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase text-zinc-500 mb-2 block">Question</label>
                  <input value={question} onChange={e => setQuestion(e.target.value)} placeholder="Question..." className="w-full bg-black border border-white/5 p-4 rounded-2xl outline-none focus:border-red-500 text-sm" />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-zinc-500 block">Options</label>
                  {options.map((opt, i) => (
                    <div key={i} className="flex gap-2">
                      <input value={opt} onChange={e => { const newOpts = [...options]; newOpts[i] = e.target.value; setOptions(newOpts); }} placeholder={`Option ${i+1}`} className="flex-1 bg-black border border-white/5 p-4 rounded-2xl outline-none text-xs" />
                      {options.length > 2 && <button onClick={() => removeOption(i)} className="px-4 bg-zinc-900 rounded-2xl text-zinc-600 hover:text-red-500 transition-colors"><X className="w-4 h-4" /></button>}
                    </div>
                  ))}
                  {options.length < 10 && <button onClick={addOption} className="w-full py-4 border border-dashed border-white/10 rounded-2xl text-[9px] font-black uppercase text-zinc-500 hover:text-white transition-all">+ Add Option</button>}
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-[10px] font-black uppercase text-zinc-500 mb-2 block">Duration</label>
                    <select value={duration} onChange={e => setDuration(e.target.value)} className="w-full bg-black border border-white/5 p-4 rounded-2xl outline-none text-xs text-white">
                      <option value="1">1 Hour</option><option value="6">6 Hours</option><option value="24">24 Hours</option><option value="48">48 Hours</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] font-black uppercase text-zinc-500 mb-2 block">Authorization</label>
                    <button 
                      type="button"
                      disabled={adTimer > 0 || hasWatchedAd}
                      onClick={triggerAdsterra}
                      className={cn(
                        "w-full p-4 rounded-2xl border flex items-center justify-center gap-2 text-[10px] font-black uppercase transition-all",
                        hasWatchedAd ? "bg-green-500/10 border-green-500/20 text-green-500" : adTimer > 0 ? "bg-red-500/10 border-red-500/20 text-red-500 animate-pulse" : "bg-blue-500/10 border-blue-500/20 text-blue-500"
                      )}
                    >
                      {hasWatchedAd ? <CheckCircle2 className="w-4 h-4" /> : adTimer > 0 ? `${adTimer}s` : "Watch Commercial"}
                    </button>
                  </div>
                </div>
                <button disabled={isSubmitting || !hasWatchedAd} onClick={createPoll} className="w-full bg-white text-black py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest hover:bg-red-500 hover:text-white disabled:opacity-20 transition-all">
                  {isSubmitting ? "Syncing..." : "Initialize Poll"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}