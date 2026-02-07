"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldAlert, Trash2, Unlock, RefreshCw, Terminal, 
  Gavel, X, CheckCircle2, Wind, Activity, Radio, 
  Database, ShieldCheck, Eraser
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminDashboard() {
  const [reports, setReports] = useState<any[]>([]);
  const [bannedUsers, setBannedUsers] = useState<any[]>([]);
  const [liveNodes, setLiveNodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"reports" | "pending" | "bans" | "nodes">("reports");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal State
  const [showBanModal, setShowBanModal] = useState(false);
  const [targetFp, setTargetFp] = useState("");
  const [targetName, setTargetName] = useState(""); 
  const [banReason, setBanReason] = useState("");

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setIsRefreshing(true);
    
    try {
      await supabase.rpc('purge_inactive_rooms');

      const [repRes, banRes, matchRes] = await Promise.all([
        supabase.from("reports").select("*").order("created_at", { ascending: false }),
        supabase.from("banned_fingerprints").select("*").order("created_at", { ascending: false }),
        supabase.from("matchmaking").select("*").order("created_at", { ascending: false })
      ]);

      const grouped = repRes.data?.reduce((acc: any, curr: any) => {
        const fp = curr.fingerprint || "unknown";
        if (!acc[fp]) {
          acc[fp] = { ...curr, count: 0, all_logs: [], reportIds: [] };
        }
        acc[fp].count += 1;
        acc[fp].reportIds.push(curr.id);
        if (curr.chat_log) acc[fp].all_logs.push(...curr.chat_log);
        return acc;
      }, {});

      setReports(Object.values(grouped || {}));
      setBannedUsers(banRes.data || []);
      setLiveNodes(matchRes.data || []);
    } catch (err) {
      console.error("System Failure:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const nuclearFlush = async () => {
    setIsRefreshing(true);
    await supabase.from("matchmaking").delete().neq("id", 0);
    await supabase.rpc('purge_inactive_rooms');
    fetchData();
  };

  const handleExecuteBan = async () => {
    if (!targetFp) return;
    const { error } = await supabase.from("banned_fingerprints").insert([
      { fingerprint: targetFp.trim(), reason: banReason || "Protocol Violation" }
    ]);
    if (!error) {
      // This delete triggers the SQL handle_user_cleanup (wiping messages)
      await supabase.from("reports").delete().eq("fingerprint", targetFp);
      setShowBanModal(false);
      setBanReason("");
      fetchData();
    }
  };

  const pardonUser = async (id: string) => {
    // This delete triggers the SQL handle_user_cleanup (wiping any residual messages)
    await supabase.from("banned_fingerprints").delete().eq("id", id);
    fetchData(true);
  };

  const clearLogsOnly = async (fingerprint: string) => {
    const { error } = await supabase.from("messages").delete().eq("fingerprint", fingerprint);
    if (!error) {
      await supabase.from("reports").delete().eq("fingerprint", fingerprint);
      fetchData(true);
    }
  };

  const deleteNode = async (id: any) => {
    await supabase.from("matchmaking").delete().eq("id", id);
    fetchData(true);
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="h-[100dvh] w-full bg-[#050505] text-zinc-100 flex flex-col font-sans overflow-hidden">
      
      {/* BAN MODAL */}
      <AnimatePresence>
        {showBanModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
             <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-zinc-950 border border-red-500/20 p-8 rounded-[2rem] max-w-md w-full shadow-2xl">
              <h3 className="text-xl font-black uppercase italic text-red-500 mb-6 flex items-center gap-2">
                <Gavel className="w-5 h-5" /> Terminate Node
              </h3>
              <div className="space-y-4">
                <div className="bg-black p-4 rounded-xl border border-white/5 font-mono text-[10px]">
                  <p className="text-zinc-500 uppercase mb-1">Target Name: <span className="text-white">{targetName}</span></p>
                  <p className="text-zinc-500 uppercase">UID: <span className="text-purple-500">{targetFp}</span></p>
                </div>
                <input 
                  value={banReason} onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Violation details..."
                  className="w-full bg-black border border-zinc-800 p-4 rounded-xl text-xs outline-none focus:border-red-500 transition-colors"
                />
                <div className="flex gap-3">
                   <button onClick={handleExecuteBan} className="flex-1 bg-red-600 hover:bg-red-500 text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all">Confirm Exile</button>
                   <button onClick={() => setShowBanModal(false)} className="px-6 bg-zinc-900 rounded-xl hover:bg-zinc-800 transition-colors"><X className="w-5 h-5" /></button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER */}
      <header className="px-8 py-6 border-b border-white/5 bg-zinc-950/80 backdrop-blur-xl flex items-center justify-between shrink-0 relative overflow-hidden">
          <div className="flex items-center gap-6">
              <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/20"><ShieldAlert className="text-red-500 w-6 h-6 animate-pulse" /></div>
              <div>
                <h1 className="text-2xl font-black italic tracking-tighter uppercase leading-none">Command Center</h1>
                <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1 text-[8px] font-black text-green-500 uppercase tracking-widest"><Activity className="w-2 h-2" /> System Live</span>
                  <span className="text-[8px] text-zinc-600 uppercase font-black tracking-widest flex items-center gap-1"><Database className="w-2 h-2" /> Sync: 10s</span>
                </div>
              </div>
          </div>

          <nav className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5">
            {[
              { id: "reports", label: "Inbox", count: reports.filter(r => r.count < 3).length },
              { id: "pending", label: "Threats", count: reports.filter(r => r.count >= 3).length },
              { id: "nodes", label: "Nodes", count: liveNodes.length, icon: Radio },
              { id: "bans", label: "Exiled", count: bannedUsers.length }
            ].map((tab) => (
              <button key={tab.id} onClick={() => setView(tab.id as any)} className={cn("px-5 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all flex items-center gap-2", view === tab.id ? "bg-white text-black" : "text-zinc-500 hover:text-white")}>
                {tab.label} <span className={cn("px-1.5 py-0.5 rounded-md text-[8px]", view === tab.id ? "bg-black text-white" : "bg-zinc-800 text-zinc-400")}>{tab.count}</span>
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
              <button onClick={nuclearFlush} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-amber-500/20 text-amber-500 hover:bg-amber-500 transition-all text-[9px] font-black uppercase tracking-widest">
                <Wind className="w-3 h-3" /> Flush System
              </button>
              <button onClick={() => fetchData()} className="p-3 rounded-xl bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white">
                <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
              </button>
          </div>
      </header>

      {/* MAIN DATA STREAM */}
      <main className="flex-1 overflow-y-auto p-8 custom-scrollbar relative">
        <div className="max-w-7xl mx-auto">
          <AnimatePresence mode="popLayout">
            
            {/* VIEW: LIVE NODES */}
            {view === "nodes" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {liveNodes.map((node) => (
                  <motion.div layout key={node.id} className="bg-zinc-900/40 border border-white/5 p-5 rounded-3xl group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        <h3 className="text-xs font-black uppercase text-white tracking-widest">{node.nickname}</h3>
                      </div>
                      <button onClick={() => deleteNode(node.id)} className="opacity-0 group-hover:opacity-100 p-2 text-zinc-500 hover:text-red-500 transition-all"><Trash2 className="w-4 h-4" /></button>
                    </div>
                    <div className="space-y-2 font-mono text-[9px]">
                      <p className="text-zinc-500 uppercase">Status: <span className="text-blue-400">{node.partner_found ? "Handshake" : "Broadcasting"}</span></p>
                      <p className="text-zinc-500 uppercase italic">Created: {new Date(node.created_at).toLocaleTimeString()}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* VIEW: REPORTS & THREATS */}
            {(view === "reports" || view === "pending") && (view === "reports" ? reports.filter(r => r.count < 3) : reports.filter(r => r.count >= 3)).map((item) => (
              <motion.div layout key={item.fingerprint} className="bg-zinc-900/30 border border-white/5 rounded-[2.5rem] p-8 mb-6 border-l-4 border-l-red-500/30">
                <div className="flex flex-col gap-6">
                   <div className="flex justify-between items-center">
                      <span className="text-[10px] font-mono text-zinc-500">{item.fingerprint}</span>
                      <div className="flex gap-3">
                        <button onClick={() => clearLogsOnly(item.fingerprint)} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-5 py-3 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 transition-all">
                          <Eraser className="w-3 h-3" /> Clear Logs
                        </button>
                        <button onClick={() => { setTargetFp(item.fingerprint); setTargetName(item.reported_user); setShowBanModal(true); }} className="bg-white hover:bg-red-600 hover:text-white text-black px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Exile Node</button>
                      </div>
                   </div>
                   <div className="bg-black/50 p-6 rounded-3xl space-y-3 border border-white/5">
                      {item.all_logs?.map((log: any, i: number) => (
                        <div key={i} className="text-[11px] font-mono flex gap-4 border-b border-white/5 pb-2 last:border-0">
                          <span className="text-red-500 font-bold w-24 shrink-0 uppercase tracking-tighter">[{log.nickname}]</span>
                          <span className="text-zinc-300">{log.content}</span>
                        </div>
                      ))}
                   </div>
                </div>
              </motion.div>
            ))}

            {/* VIEW: BANS */}
            {view === "bans" && (
              <div className="space-y-3">
                {bannedUsers.map((item) => (
                  <motion.div layout key={item.id} className="bg-purple-900/5 border border-purple-500/20 rounded-3xl p-6 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="p-3 bg-purple-500/10 rounded-2xl"><ShieldCheck className="w-5 h-5 text-purple-500" /></div>
                      <div>
                        <code className="text-[10px] text-zinc-400 font-mono block mb-1">{item.fingerprint}</code>
                        <p className="text-[9px] text-purple-400 font-black uppercase tracking-widest">Reason: {item.reason}</p>
                      </div>
                    </div>
                    <button onClick={() => pardonUser(item.id)} className="px-6 py-3 bg-white/5 hover:bg-white hover:text-black text-white rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all">Authorize Re-Entry</button>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>

          {/* EMPTY STATE */}
          {(view === "bans" ? bannedUsers : view === "nodes" ? liveNodes : reports).length === 0 && (
            <div className="py-40 text-center opacity-10">
              <Terminal className="w-20 h-20 mx-auto mb-6" />
              <p className="font-black uppercase tracking-[0.5em] text-sm">Frequency Clear</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function LoadingScreen() {
    return <div className="h-screen bg-black flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
      <div className="text-red-500 font-black uppercase tracking-[0.8em] text-[10px] animate-pulse">Establishing Secure Uplink...</div>
    </div>;
}
