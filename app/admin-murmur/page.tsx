"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldAlert, Trash2, MessageSquare, Clock, Unlock, 
  ShieldCheck, Zap, Gavel, X, AlertOctagon, CheckCircle2 
} from "lucide-react";

export default function AdminDashboard() {
  const [reports, setReports] = useState<any[]>([]);
  const [bannedUsers, setBannedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"reports" | "pending" | "bans">("reports");

  // Modal State
  const [showBanModal, setShowBanModal] = useState(false);
  const [targetFp, setTargetFp] = useState("");
  const [banReason, setBanReason] = useState("");
  const [banDays, setBanDays] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: rep } = await supabase.from("reports").select("*").order("created_at", { ascending: false });
    const { data: ban } = await supabase.from("banned_fingerprints").select("*").order("created_at", { ascending: false });
    
    // Group reports by fingerprint
    const grouped = rep?.reduce((acc: any, curr: any) => {
      if (!acc[curr.fingerprint]) {
        acc[curr.fingerprint] = { 
          ...curr, 
          count: 0, 
          all_logs: [], 
          reportIds: [] // Store all IDs for bulk deletion of one user
        };
      }
      acc[curr.fingerprint].count += 1;
      acc[curr.fingerprint].reportIds.push(curr.id);
      acc[curr.fingerprint].all_logs.push(...(curr.chat_log || []));
      return acc;
    }, {});

    setReports(Object.values(grouped || {}));
    setBannedUsers(ban || []);
    setLoading(false);
  };

  const handleExecuteBan = async () => {
    if (!targetFp) return;
    const expires_at = banDays ? new Date(Date.now() + banDays * 24 * 60 * 60 * 1000).toISOString() : null;
    
    const { error } = await supabase.from("banned_fingerprints").insert([
      { fingerprint: targetFp.trim(), reason: banReason || "Violation of Terms", expires_at }
    ]);

    if (!error) {
      // Auto-clear reports for this user once banned
      await supabase.from("reports").delete().eq("fingerprint", targetFp);
      setShowBanModal(false);
      fetchData();
      alert("Subject Blacklisted.");
    } else {
      alert("Error: User already banned or database disconnect.");
    }
  };

  const deleteTarget = async (item: any) => {
    if (view === "bans") {
      // Delete from banned_fingerprints
      await supabase.from("banned_fingerprints").delete().eq("id", item.id);
    } else {
      // Delete all report instances for this grouped fingerprint
      const { error } = await supabase.from("reports").delete().in("id", item.reportIds);
      if (error) console.error(error);
    }
    fetchData();
  };

  const bulkPurgeAll = async () => {
    if (!confirm("DANGER: This will wipe all incident reports. Continue?")) return;
    await supabase.from("reports").delete().neq("id", 0);
    fetchData();
  };

  if (loading) return (
    <div className="h-screen bg-zinc-950 flex flex-col items-center justify-center space-y-4">
      <Zap className="w-8 h-8 text-purple-500 animate-pulse" />
      <div className="text-white tracking-[0.5em] font-black italic text-xs uppercase">Establishing Secure Link...</div>
    </div>
  );

  const pendingUsers = reports.filter(r => r.count >= 5);
  const receivedReports = reports.filter(r => r.count < 5);

  return (
    <div className="h-screen w-full bg-zinc-950 text-zinc-100 flex flex-col font-sans overflow-hidden selection:bg-purple-500/30">
      
      {/* BAN SENTENCING MODAL */}
      <AnimatePresence>
        {showBanModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2.5rem] max-w-sm w-full shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent" />
              
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-2">
                  <Gavel className="text-purple-500 w-5 h-5" /> Sentence
                </h3>
                <button onClick={() => setShowBanModal(false)} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
                  <X className="text-zinc-500 w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-black/50 p-4 rounded-2xl border border-zinc-800">
                  <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-2">Subject Fingerprint</label>
                  <div className="text-[10px] font-mono text-purple-400 break-all leading-relaxed">{targetFp}</div>
                </div>

                <input 
                  value={banReason} 
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Reason for exclusion..."
                  className="w-full bg-black border border-zinc-800 p-4 rounded-2xl text-sm outline-none focus:border-purple-500 transition-all"
                />

                <div className="grid grid-cols-3 gap-2">
                  {[1, 7, null].map((d) => (
                    <button 
                      key={String(d)} 
                      onClick={() => setBanDays(d)}
                      className={`py-3 rounded-xl text-[10px] font-black uppercase border transition-all ${banDays === d ? "bg-purple-600 border-purple-500 text-white" : "bg-zinc-800 border-zinc-700 text-zinc-500 hover:text-zinc-300"}`}
                    >
                      {d ? `${d} Days` : "Permanent"}
                    </button>
                  ))}
                </div>

                <button onClick={handleExecuteBan} className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] mt-4 active:scale-95 transition-all shadow-lg shadow-white/5">
                  Confirm Sentence
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER */}
      <header className="p-6 border-b border-zinc-800/50 bg-zinc-900/20 backdrop-blur-xl flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center border border-red-500/20">
            <ShieldAlert className="text-red-500 w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black italic tracking-tighter uppercase">Command Center</h1>
        </div>
        
        <nav className="flex bg-black/40 p-1.5 rounded-[1.25rem] border border-zinc-800">
          {[
            { id: 'reports', label: 'Received', count: receivedReports.length, color: 'text-white' },
            { id: 'pending', label: 'Pending', count: pendingUsers.length, color: 'text-amber-500' },
            { id: 'bans', label: 'Blacklist', count: bannedUsers.length, color: 'text-purple-400' }
          ].map((tab) => (
            <button 
              key={tab.id} 
              onClick={() => setView(tab.id as any)} 
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black transition-all flex items-center gap-2 uppercase tracking-tight ${view === tab.id ? 'bg-zinc-800 shadow-inner' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <span className={view === tab.id ? tab.color : ''}>{tab.label}</span>
              <span className="opacity-40 text-[9px]">{tab.count}</span>
            </button>
          ))}
        </nav>

        <button onClick={bulkPurgeAll} className="px-4 py-2 text-[9px] font-black text-zinc-500 hover:text-red-500 border border-zinc-800 rounded-xl uppercase tracking-widest transition-all hover:border-red-500/30 flex items-center gap-2">
          <Trash2 className="w-3.5 h-3.5" /> Purge Logs
        </button>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 gap-4">
            <AnimatePresence mode="popLayout">
              {(view === "reports" ? receivedReports : view === "pending" ? pendingUsers : bannedUsers).map((item) => (
                <motion.div 
                  layout key={item.fingerprint || item.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-zinc-900/40 border border-zinc-800 rounded-[2rem] p-6 hover:border-zinc-700 transition-all group relative overflow-hidden"
                >
                  <div className="flex flex-col md:flex-row justify-between gap-6 relative z-10">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        {view === "pending" && <AlertOctagon className="w-4 h-4 text-amber-500 animate-pulse" />}
                        <span className={`text-[9px] font-black px-3 py-1 rounded-full border uppercase tracking-tighter ${
                          view === 'bans' ? 'text-purple-400 border-purple-400/20 bg-purple-400/5' : 
                          view === 'pending' ? 'text-amber-500 border-amber-500/20 bg-amber-500/5' : 
                          'text-zinc-400 border-zinc-800 bg-zinc-800/30'
                        }`}>
                          {item.count ? `${item.count} Flags Detected` : "Exclusion Active"}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-600 truncate opacity-50">{item.fingerprint}</span>
                      </div>
                      
                      <h3 className="text-xl font-bold italic uppercase tracking-tight mb-4">
                        {item.reported_user || item.nickname || "Unknown Subject"}
                      </h3>

                      {item.all_logs && (
                        <div className="bg-black/60 rounded-2xl p-5 border border-zinc-800/50 max-h-48 overflow-y-auto text-xs space-y-3 custom-scrollbar">
                          {item.all_logs.slice(-20).map((msg: any, i: number) => (
                            <div key={i} className="flex gap-3 items-start border-l border-zinc-800 pl-3">
                              <span className="font-black text-zinc-500 shrink-0 uppercase text-[9px] mt-0.5">{msg.nickname}:</span>
                              <span className="text-zinc-300 leading-relaxed">{msg.content}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex md:flex-col justify-end gap-2 shrink-0">
                      {view !== "bans" ? (
                        <button 
                          onClick={() => { setTargetFp(item.fingerprint); setBanReason(item.reason); setShowBanModal(true); }}
                          className="bg-red-600 hover:bg-red-500 text-white h-12 px-6 rounded-2xl font-black uppercase text-[10px] tracking-[0.1em] flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-red-900/20"
                        >
                          <Gavel className="w-4 h-4" /> Sentence
                        </button>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <div className="bg-zinc-800/50 rounded-xl p-3 border border-zinc-700/30 text-center">
                             <div className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">Status</div>
                             <div className="text-[10px] font-bold text-purple-400 uppercase">Blacklisted</div>
                          </div>
                          <button 
                            onClick={() => { supabase.from("banned_fingerprints").delete().eq("id", item.id).then(() => fetchData()); }}
                            className="bg-green-600/10 hover:bg-green-600/20 text-green-500 h-10 px-4 rounded-xl font-black uppercase text-[9px] tracking-widest flex items-center justify-center gap-2 transition-all border border-green-600/20"
                          >
                            <Unlock className="w-3.5 h-3.5" /> Pardon
                          </button>
                        </div>
                      )}
                      <button 
                        onClick={() => deleteTarget(item)}
                        className="bg-zinc-800/50 h-12 w-12 flex items-center justify-center rounded-2xl text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {(view === "reports" ? receivedReports : view === "pending" ? pendingUsers : bannedUsers).length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-32 border-2 border-dashed border-zinc-900 rounded-[3rem]">
              <CheckCircle2 className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
              <p className="text-zinc-600 font-black uppercase tracking-[0.3em] text-[10px] italic">No active threats detected in this sector.</p>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
