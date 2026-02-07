"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldAlert, Trash2, MessageSquare, Clock, Unlock, 
  ShieldCheck, Zap, Gavel, X, AlertOctagon, CheckCircle2,
  RefreshCw, Terminal, Eye, Filter, UserMinus
} from "lucide-react";

export default function AdminDashboard() {
  const [reports, setReports] = useState<any[]>([]);
  const [bannedUsers, setBannedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"reports" | "pending" | "bans">("reports");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal State
  const [showBanModal, setShowBanModal] = useState(false);
  const [targetFp, setTargetFp] = useState("");
  const [banReason, setBanReason] = useState("");
  const [banDays, setBanDays] = useState<number | null>(null);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setIsRefreshing(true);
    
    try {
      const { data: rep } = await supabase.from("reports").select("*").order("created_at", { ascending: false });
      const { data: ban } = await supabase.from("banned_fingerprints").select("*").order("created_at", { ascending: false });
      
      const grouped = rep?.reduce((acc: any, curr: any) => {
        const fp = curr.fingerprint || "unknown";
        if (!acc[fp]) {
          acc[fp] = { 
            ...curr, 
            count: 0, 
            all_logs: [], 
            reportIds: [],
            latest_report: curr.created_at
          };
        }
        acc[fp].count += 1;
        acc[fp].reportIds.push(curr.id);
        
        // Merge chat logs if they exist
        if (curr.chat_log && Array.isArray(curr.chat_log)) {
          // Add logs but avoid massive duplicates
          const newLogs = curr.chat_log.filter((log: any) => 
            !acc[fp].all_logs.some((existing: any) => existing.content === log.content && existing.nickname === log.nickname)
          );
          acc[fp].all_logs.push(...newLogs);
        }
        return acc;
      }, {});

      setReports(Object.values(grouped || {}));
      setBannedUsers(ban || []);
    } catch (err) {
      console.error("Critical System Error:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 30000); // Auto-refresh every 30s
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleExecuteBan = async () => {
    if (!targetFp) return;
    const expires_at = banDays ? new Date(Date.now() + banDays * 24 * 60 * 60 * 1000).toISOString() : null;
    
    const { error } = await supabase.from("banned_fingerprints").insert([
      { fingerprint: targetFp.trim(), reason: banReason || "Violation of Protocol", expires_at }
    ]);

    if (!error) {
      await supabase.from("reports").delete().eq("fingerprint", targetFp);
      setShowBanModal(false);
      setBanReason("");
      fetchData();
    }
  };

  const deleteTarget = async (item: any) => {
    if (view === "bans") {
      await supabase.from("banned_fingerprints").delete().eq("id", item.id);
    } else {
      await supabase.from("reports").delete().in("id", item.reportIds);
    }
    fetchData(true);
  };

  if (loading) return (
    <div className="h-screen bg-black flex flex-col items-center justify-center">
      <div className="relative">
        <Zap className="w-12 h-12 text-purple-500 animate-pulse" />
        <div className="absolute inset-0 blur-xl bg-purple-500/20 animate-pulse" />
      </div>
      <div className="mt-6 text-purple-500 tracking-[0.6em] font-black text-[10px] uppercase">Booting Security Terminal</div>
    </div>
  );

  const pendingUsers = reports.filter(r => r.count >= 3); // Lowered threshold to 3 for "Pending"
  const receivedReports = reports.filter(r => r.count < 3);

  return (
    <div className="h-[100dvh] w-full bg-[#050505] text-zinc-100 flex flex-col font-sans overflow-hidden">
      
      {/* BAN MODAL */}
      <AnimatePresence>
        {showBanModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2rem] max-w-md w-full shadow-[0_0_50px_rgba(168,85,247,0.15)]">
              <h3 className="text-xl font-black uppercase tracking-tighter mb-6 flex items-center gap-3">
                <Gavel className="text-purple-500" /> Issue Exclusion
              </h3>
              <div className="space-y-5">
                <div className="bg-black p-4 rounded-xl border border-zinc-800/50">
                  <p className="text-[8px] font-black text-zinc-600 uppercase mb-1">Fingerprint</p>
                  <code className="text-[10px] text-purple-400 break-all">{targetFp}</code>
                </div>
                <input 
                  value={banReason} onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Violation Reason..."
                  className="w-full bg-black border border-zinc-800 p-4 rounded-xl text-sm outline-none focus:border-purple-500 transition-all"
                />
                <div className="grid grid-cols-3 gap-2">
                  {[1, 7, null].map((d) => (
                    <button key={String(d)} onClick={() => setBanDays(d)} className={`py-3 rounded-xl text-[9px] font-black uppercase border transition-all ${banDays === d ? "bg-purple-600 border-purple-500" : "bg-zinc-800 border-zinc-700 text-zinc-500"}`}>
                      {d ? `${d}D` : "Permanent"}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3 pt-4">
                   <button onClick={handleExecuteBan} className="flex-1 bg-white text-black py-4 rounded-xl font-black uppercase text-xs">Execute Ban</button>
                   <button onClick={() => setShowBanModal(false)} className="px-6 bg-zinc-800 rounded-xl"><X className="w-5 h-5" /></button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOP NAVBAR */}
      <header className="px-6 py-4 border-b border-white/5 bg-zinc-950/50 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-4">
          <div className="relative">
            <ShieldAlert className="text-red-500 w-8 h-8" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
          </div>
          <div>
            <h1 className="text-xl font-black italic tracking-tighter uppercase leading-none">Command Center</h1>
            <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-[0.2em] mt-1">Status: Fully Operational</p>
          </div>
        </div>
        
        <nav className="flex bg-black/50 p-1 rounded-2xl border border-zinc-800/50">
          {[
            { id: 'reports', label: 'Inbox', count: receivedReports.length, icon: MessageSquare },
            { id: 'pending', label: 'Threats', count: pendingUsers.length, icon: AlertOctagon },
            { id: 'bans', label: 'Exiled', count: bannedUsers.length, icon: UserMinus }
          ].map((tab) => (
            <button key={tab.id} onClick={() => setView(tab.id as any)} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all flex items-center gap-2 uppercase ${view === tab.id ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}>
              <tab.icon className={`w-3.5 h-3.5 ${view === tab.id ? 'text-purple-500' : ''}`} />
              {tab.label}
              <span className="ml-1 opacity-50 bg-black px-1.5 py-0.5 rounded text-[8px]">{tab.count}</span>
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button onClick={() => fetchData()} className={`p-2.5 rounded-xl border border-zinc-800 text-zinc-500 hover:text-white transition-all ${isRefreshing ? 'animate-spin' : ''}`}>
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => { if(confirm("Purge all?")) supabase.from("reports").delete().neq("id",0).then(()=>fetchData()) }} className="px-4 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-[9px] font-black text-red-500 uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">
            Purge Logs
          </button>
        </div>
      </header>

      {/* LIST CONTENT */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-4">
          <AnimatePresence mode="popLayout">
            {(view === "reports" ? receivedReports : view === "pending" ? pendingUsers : bannedUsers).map((item) => (
              <motion.div layout key={item.fingerprint || item.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#0c0c0c] border border-white/5 rounded-[1.5rem] p-5 hover:border-purple-500/30 transition-all group"
              >
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Subject Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                        view === 'bans' ? 'border-purple-500/30 bg-purple-500/5 text-purple-400' :
                        item.count >= 5 ? 'border-red-500/30 bg-red-500/5 text-red-500' :
                        'border-amber-500/30 bg-amber-500/5 text-amber-500'
                      }`}>
                        {item.count ? `Threat Level ${item.count}` : "Blacklisted"}
                      </div>
                      <span className="text-[10px] font-mono text-zinc-600 truncate">{item.fingerprint}</span>
                    </div>

                    <h3 className="text-xl font-black uppercase tracking-tight text-zinc-200 mb-4 flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-purple-500" />
                      {item.reported_user || item.nickname || "Unknown_Entity"}
                    </h3>

                    {/* Chat Log Terminal */}
                    {item.all_logs && item.all_logs.length > 0 && (
                      <div className="bg-black/80 rounded-xl border border-white/5 p-4 max-h-40 overflow-y-auto custom-scrollbar font-mono text-[11px] space-y-2">
                        {item.all_logs.map((log: any, i: number) => (
                          <div key={i} className="flex gap-2">
                            <span className="text-purple-600 shrink-0">[{log.nickname}]:</span>
                            <span className="text-zinc-400 leading-relaxed">{log.content}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex lg:flex-col justify-end gap-2 shrink-0">
                    {view !== "bans" ? (
                      <button onClick={() => { setTargetFp(item.fingerprint); setBanReason(item.reason); setShowBanModal(true); }}
                        className="bg-white text-black px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:bg-purple-500 hover:text-white transition-all"
                      >
                        <Gavel className="w-4 h-4" /> Exile
                      </button>
                    ) : (
                      <button onClick={() => deleteTarget(item)}
                        className="bg-green-500/10 text-green-500 border border-green-500/20 px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:bg-green-500 hover:text-white transition-all"
                      >
                        <Unlock className="w-4 h-4" /> Pardon
                      </button>
                    )}
                    <button onClick={() => deleteTarget(item)} className="p-3 bg-zinc-900 text-zinc-500 rounded-xl hover:text-red-500 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {(view === "reports" ? receivedReports : view === "pending" ? pendingUsers : bannedUsers).length === 0 && (
            <div className="py-20 text-center border-2 border-dashed border-zinc-900 rounded-[2rem]">
              <CheckCircle2 className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
              <p className="text-zinc-600 font-black uppercase tracking-widest text-[10px]">Frequency Clear. No violations found.</p>
            </div>
          )}
        </div>
      </main>

      {/* FOOTER STATUS */}
      <footer className="px-6 py-3 bg-black border-t border-white/5 flex justify-between items-center text-[9px] font-black text-zinc-600 uppercase tracking-widest">
        <div className="flex gap-6">
          <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> DB Link Active</span>
          <span className="flex items-center gap-2"><Clock className="w-3 h-3" /> Last Scan: {new Date().toLocaleTimeString()}</span>
        </div>
        <div className="text-purple-900">Alpha Protocol v2.0.4</div>
      </footer>
    </div>
  );
}
