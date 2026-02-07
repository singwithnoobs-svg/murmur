"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, X, BarChart3, Clock, Flame, 
  TrendingUp, PlayCircle, CheckCircle2, ChevronUp 
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function PollsPage() {
  const [polls, setPolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userFp, setUserFp] = useState<string>("");
  const [scrolled, setScrolled] = useState(false);

  // Ad State
  const [hasWatchedAd, setHasWatchedAd] = useState(false);
  const [adTimer, setAdTimer] = useState(0);
  const AD_LINK = "https://www.effectivegatecpm.com/ynxwndhjsn?key=feccdd147daef403531a53b803a60d17";

  // Form State
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [duration, setDuration] = useState("24");

  // Handle Scroll Progress for UI Polish
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
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

  const triggerAdsterra = () => {
    window.open(AD_LINK, "_blank");
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
    if (error) alert(error.message); 
    else fetchPolls();
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
    <div className="min-h-screen w-full bg-[#050505] text-zinc-100 selection:bg-red-500/30 font-sans overflow-x-hidden">
      
      {/* HEADER - Sticky Glass Effect */}
      <header className={cn(
        "fixed top-0 left-0 right-0 z-[50] transition-all duration-300 px-6 py-4 flex justify-between items-center border-b",
        scrolled ? "bg-black/80 backdrop-blur-lg border-white/5 py-3" : "bg-transparent border-transparent"
      )}>
        <div className="flex items-center gap-3">
          <BarChart3 className="text-red-500 w-6 h-6" />
          <h1 className="text-xl font-black italic tracking-tighter uppercase">Pulse</h1>
        </div>
        <button 
          onClick={() => setShowCreate(true)}
          className="bg-white text-black px-5 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-red-500 hover:text-white transition-all active:scale-95 shadow-xl"
        >
          New Broadcast
        </button>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="max-w-4xl mx-auto px-6 pt-24 pb-32">
        <div className="mb-12">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em] mb-1">Global Broadcasts</p>
          <h2 className="text-4xl font-black italic tracking-tighter uppercase text-white/90">Current Frequencies</h2>
        </div>

        <div className="space-y-8">
          {polls.map((poll, idx) => {
            const totalVotes = poll.poll_votes?.length || 0;
            const userVote = poll.poll_votes?.find((v: any) => v.fingerprint === userFp);
            const maxVotes = Math.max(...poll.poll_options.map((o: any) => poll.poll_votes?.filter((v: any) => v.option_id === o.id).length || 0));

            return (
              <motion.div 
                key={poll.id} 
                initial={{ opacity: 0, y: 30 }} 
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className={cn(
                  "bg-zinc-900/20 border rounded-[2rem] p-6 sm:p-8 transition-all hover:bg-zinc-900/40",
                  idx === 0 ? "border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.03)]" : "border-white/5"
                )}
              >
                <div className="flex justify-between items-start mb-8">
                  <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white leading-tight pr-8">{poll.question}</h2>
                  {idx === 0 && <div className="bg-red-500/10 text-red-500 px-3 py-1 rounded-full text-[8px] font-black uppercase flex items-center gap-1 border border-red-500/20"><Flame className="w-3 h-3" /> Trending</div>}
                </div>

                <div className="space-y-4">
                  {poll.poll_options.map((opt: any) => {
                    const optVotes = poll.poll_votes?.filter((v: any) => v.option_id === opt.id).length || 0;
                    const percentage = totalVotes > 0 ? (optVotes / totalVotes) * 100 : 0;
                    const isUserSelection = userVote?.option_id === opt.id;
                    return (
                      <button 
                        key={opt.id} 
                        onClick={() => handleVote(poll.id, opt.id)}
                        className={cn(
                          "w-full relative h-14 bg-black/60 rounded-2xl border border-white/5 overflow-hidden group transition-all active:scale-[0.99] touch-manipulation",
                          isUserSelection ? "border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.1)]" : ""
                        )}
                      >
                        <motion.div 
                          initial={{ width: 0 }} 
                          animate={{ width: `${percentage}%` }} 
                          transition={{ duration: 0.8, ease: "circOut" }} 
                          className={cn("absolute inset-0", isUserSelection ? "bg-red-500/15" : "bg-white/5")} 
                        />
                        <div className="absolute inset-0 px-6 flex justify-between items-center text-[11px] font-bold uppercase tracking-widest">
                          <span className={cn(isUserSelection ? "text-red-500" : "text-zinc-400 group-hover:text-white transition-colors")}>
                            {opt.option_text} {isUserSelection && "✓"}
                          </span>
                          <span className={cn("font-mono text-[10px]", isUserSelection ? "text-red-400" : "text-zinc-600")}>
                            {percentage.toFixed(0)}%
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-8 pt-6 border-t border-white/5 flex flex-wrap justify-between items-center gap-4 text-[9px] font-black uppercase text-zinc-500">
                  <span className="flex items-center gap-1.5"><TrendingUp className="w-3 h-3" /> {totalVotes} Responses</span>
                  <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {getRemainingTime(poll.expires_at)} Remaining</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </main>

      {/* CREATE MODAL */}
      <AnimatePresence>
        {showCreate && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} 
              animate={{ scale: 1, y: 0 }} 
              className="bg-zinc-950 border border-white/10 p-6 sm:p-10 rounded-[2.5rem] w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <h3 className="text-xl font-black italic uppercase text-white">Broadcast Protocol</h3>
                </div>
                <button onClick={() => setShowCreate(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors"><X className="text-zinc-500" /></button>
              </div>

              <div className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-zinc-600 tracking-widest ml-1">Question</label>
                  <input value={question} onChange={e => setQuestion(e.target.value)} placeholder="What's on your mind?" className="w-full bg-black border border-white/5 p-5 rounded-2xl outline-none focus:border-red-500/50 text-sm transition-all text-white placeholder:text-zinc-700" />
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase text-zinc-600 tracking-widest ml-1">Frequencies (Options)</label>
                  {options.map((opt, i) => (
                    <div key={i} className="flex gap-2 group">
                      <input value={opt} onChange={e => { const newOpts = [...options]; newOpts[i] = e.target.value; setOptions(newOpts); }} placeholder={`Option ${i+1}`} className="flex-1 bg-black border border-white/5 p-4 rounded-2xl outline-none text-xs text-white focus:border-white/20 transition-all" />
                      {options.length > 2 && <button onClick={() => removeOption(i)} className="px-4 bg-zinc-900/50 rounded-2xl text-zinc-600 hover:text-red-500 transition-colors"><X className="w-4 h-4" /></button>}
                    </div>
                  ))}
                  {options.length < 10 && <button onClick={addOption} className="w-full py-4 border border-dashed border-white/5 rounded-2xl text-[9px] font-black uppercase text-zinc-500 hover:text-white hover:border-white/20 transition-all">+ Add Option</button>}
                </div>

                <div className="flex gap-4">
                  <div className="flex-1 space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-600 tracking-widest ml-1">Duration</label>
                    <select value={duration} onChange={e => setDuration(e.target.value)} className="w-full bg-black border border-white/5 p-4 rounded-2xl outline-none text-xs text-white appearance-none">
                      <option value="1">1 Hour</option><option value="6">6 Hours</option><option value="24">24 Hours</option><option value="48">48 Hours</option>
                    </select>
                  </div>
                  <div className="flex-1 space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-600 tracking-widest ml-1">Auth</label>
                    <button 
                      type="button"
                      disabled={adTimer > 0 || hasWatchedAd}
                      onClick={triggerAdsterra}
                      className={cn(
                        "w-full p-4 rounded-2xl border flex items-center justify-center gap-2 text-[10px] font-black uppercase transition-all",
                        hasWatchedAd ? "bg-green-500/10 border-green-500/20 text-green-500" : adTimer > 0 ? "bg-red-500/10 border-red-500/20 text-red-500 animate-pulse" : "bg-zinc-900 border-white/5 text-zinc-400 hover:bg-white/5"
                      )}
                    >
                      {hasWatchedAd ? <CheckCircle2 className="w-4 h-4" /> : adTimer > 0 ? `${adTimer}s` : "Watch Ad"}
                    </button>
                  </div>
                </div>

                <button 
                  disabled={isSubmitting || !hasWatchedAd} 
                  onClick={createPoll} 
                  className="w-full bg-white text-black py-5 rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] hover:bg-red-500 hover:text-white disabled:opacity-10 transition-all shadow-2xl active:scale-[0.98]"
                >
                  {isSubmitting ? "Syncing..." : "Initialize Broadcast"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FOOTER SCROLL TO TOP */}
      <AnimatePresence>
        {scrolled && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-8 right-8 p-4 bg-zinc-900 border border-white/10 rounded-full text-white shadow-2xl z-[40] hover:bg-red-500 transition-colors"
          >
            <ChevronUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* CUSTOM GLOBAL STYLES FOR SCROLLBAR */}
      <style jsx global>{`
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #050505; }
        ::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #ef4444; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
