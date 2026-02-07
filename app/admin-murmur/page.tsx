"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldAlert, RefreshCw, Gavel, X, Activity, 
  Database, ShieldCheck, Eraser, Trash2, Radio, Terminal, Wind
} from "lucide-react";
import { cn } from "@/lib/utils";

const OWNER_FINGERPRINT = "43587864f504264348dc559c88870fb2";

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
      const [repRes, banRes, matchRes] = await Promise.all([
        supabase.from("reports").select("*").order("created_at", { ascending: false }),
        supabase.from("banned_fingerprints").select("*").order("created_at", { ascending: false }),
        supabase.from("matchmaking").select("*").order("created_at", { ascending: false })
      ]);

      const grouped = repRes.data?.reduce((acc: any, curr: any) => {
        const fp = curr.fingerprint || "unknown";
        if (!acc[fp]) {
          acc[fp] = { ...curr, count: 0, all_logs: [] };
        }
        acc[fp].count += 1;
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
    const interval = setInterval(() => fetchData(true), 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleExecuteBan = async () => {
    if (!targetFp) return;
    const { error: banError } = await supabase.from("banned_fingerprints").insert([
      { fingerprint: targetFp.trim(), reason: banReason || "Protocol Violation" }
    ]);
    if (!banError) {
      await supabase.rpc('master_clear_logs', { admin_fp: OWNER_FINGERPRINT, target_fp: targetFp });
      setShowBanModal(false);
      setBanReason("");
      fetchData();
    } else {
        alert(`Ban Failed: ${banError.message}`);
    }
  };

  const pardonUser = async (fp: string) => {
    const { error } = await supabase.rpc('master_pardon', { 
        admin_fp: OWNER_FINGERPRINT, 
        target_fp: fp 
    });
    if (!error) fetchData(true);
    else alert(`Pardon Failed: ${error.message}`);
  };

  const clearLogsOnly = async (fp: string) => {
    const { error } = await supabase.rpc('master_clear_logs', { 
        admin_fp: OWNER_FINGERPRINT, 
        target_fp: fp 
    });
    if (!error) fetchData(true);
    else alert(`Wipe Failed: ${error.message}`);
  };

  const deleteNode = async (id: any) => {
    await supabase.from("matchmaking").delete().eq("id", id);
    fetchData(true);
  };

  if (loading) return <div className="h-screen bg-black flex flex-col items-center justify-center gap-4 text-red-500 font-black uppercase tracking-[0.8em] text-[10px] animate-pulse italic">Establishing Secure Uplink...</div>;

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
                  <p className="text-zinc-500 uppercase">UID: <span className="text-white">{targetFp}</span></p>
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
      <header className="px-8 py-6 border-b border-white/5 bg-zinc-950/80 backdrop-blur-xl flex items-center justify-between shrink-0">
          <div className="flex items-center gap-6">
              <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/20"><ShieldAlert className="text-red-500 w-6 h-6 animate-pulse" /></div>
              <div>
                <h1 className="text-2xl font-black italic tracking-tighter uppercase leading-none">Command Center</h1>
                <div className="flex items-center gap-3 mt-1 text-[8px] font-black uppercase text-zinc-600">
                  <Activity className="w-2 h-2 text-green-500" /> System Online | Admin: {OWNER_FINGERPRINT.slice(0,8)}
                </div>
              </div>
          </div>

          <nav className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5">
            {[
              { id: "reports", label: "Inbox", count: reports.filter(r => r.count < 3).length },
              { id: "pending", label: "Threats", count: reports.filter(r => r.count >= 3).length },
              { id: "nodes", label: "Nodes", count: liveNodes.length },
              { id: "bans", label: "Exiled", count: bannedUsers.length }
            ].map((tab) => (
              <button key={tab.id} onClick={() => setView(tab.id as any)} className={cn("px-5 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all flex items-center gap-2", view === tab.id ? "bg-white text-black" : "text-zinc-500 hover:text-white")}>
                {tab.label} <span className={cn("px-1.5 py-0.5 rounded-md text-[8px]", view === tab.id ? "bg-black text-white" : "bg-zinc-800 text-zinc-400")}>{tab.count}</span>
              </button>
            ))}
          </nav>

          <button onClick={() => fetchData()} className="p-3 rounded-xl bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white">
            <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
          </button>
      </header>

      {/* DATA STREAM */}
      <main className="flex-1 overflow-y-auto p-8 no-scrollbar bg-[radial-gradient(circle_at_top,_#111_0%,_transparent_100%)]">
        <div className="max-w-7xl mx-auto">
          <AnimatePresence mode="popLayout">
            
            {view === "nodes" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {liveNodes.map((node) => (
                  <motion.div layout key={node.id} className="bg-zinc-900/40 border border-white/5 p-5 rounded-3xl flex justify-between items-center group">
                    <div>
                        <h3 className="text-[10px] font-black uppercase text-white tracking-widest">{node.nickname}</h3>
                        <p className="text-[8px] text-zinc-500 uppercase mt-1">Status: {node.partner_found ? "Matched" : "Waiting"}</p>
                    </div>
                    <button onClick={() => deleteNode(node.id)} className="opacity-0 group-hover:opacity-100 p-2 text-zinc-500 hover:text-red-500 transition-all"><Trash2 className="w-4 h-4" /></button>
                  </motion.div>
                ))}
              </div>
            )}

            {(view === "reports" || view === "pending") && (view === "reports" ? reports.filter(r => r.count < 3) : reports.filter(r => r.count >= 3)).map((item) => (
              <motion.div layout key={item.fingerprint} className="bg-zinc-900/30 border border-white/5 rounded-[2.5rem] p-8 mb-6 border-l-4 border-l-red-500/30">
                <div className="flex flex-col gap-6">
                   <div className="flex justify-between items-center">
                      <code className="text-[10px] text-zinc-600 uppercase tracking-widest">{item.fingerprint}</code>
                      <div className="flex gap-2">
                        <button onClick={() => clearLogsOnly(item.fingerprint)} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-400 px-5 py-3 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2"><Eraser className="w-3 h-3" /> Wipe</button>
                        <button onClick={() => { setTargetFp(item.fingerprint); setTargetName(item.reported_user); setShowBanModal(true); }} className="bg-white hover:bg-red-600 hover:text-white text-black px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl">Terminate</button>
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

            {view === "bans" && (
              <div className="space-y-3">
                {bannedUsers.map((item) => (
                  <motion.div layout key={item.fingerprint} className="bg-zinc-900/20 border border-white/5 rounded-3xl p-6 flex items-center justify-between group">
                    <div className="flex items-center gap-6">
                      <div className="p-3 bg-white/5 rounded-2xl group-hover:bg-red-500/10 transition-colors"><ShieldCheck className="w-5 h-5 text-zinc-500 group-hover:text-red-500" /></div>
                      <div>
                        <code className="text-[10px] text-zinc-500 font-mono block mb-1">{item.fingerprint}</code>
                        <p className="text-[9px] text-white font-black uppercase tracking-widest">Exiled for: {item.reason}</p>
                      </div>
                    </div>
                    <button onClick={() => pardonUser(item.fingerprint)} className="px-6 py-3 bg-white/5 hover:bg-white hover:text-black text-white rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all">Pardon</button>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>

          {(view === "bans" ? bannedUsers : view === "nodes" ? liveNodes : reports).length === 0 && (
            <div className="py-40 text-center opacity-10">
              <Terminal className="w-20 h-20 mx-auto mb-6" />
              <p className="font-black uppercase tracking-[0.5em] text-sm">System Quiet</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
