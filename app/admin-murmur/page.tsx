"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Shield, Trash2, UserX, MessageSquare, Clock, Fingerprint } from "lucide-react";

export default function AdminDashboard() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setReports(data || []);
    setLoading(false);
  };

  const handleBan = async (report: any) => {
    const reason = prompt("Enter ban reason:", "Misconduct in chat");
    if (!reason) return;

    try {
      // 1. Add to banned_users table
      const { error } = await supabase.from("banned_users").insert([{
        nickname: report.reported_user,
        fingerprint: report.fingerprint,
        reason: reason
      }]);

      if (error) throw error;

      alert(`User ${report.reported_user} has been HARD BANNED.`);
      // 2. Optional: Delete report after handling
      await handleDeleteReport(report.id);
    } catch (err: any) {
      alert("Error banning user: " + err.message);
    }
  };

  const handleDeleteReport = async (id: string) => {
    await supabase.from("reports").delete().eq("id", id);
    setReports(reports.filter(r => r.id !== id));
  };

  if (loading) return <div className="p-20 text-center text-zinc-500">Loading Evidence...</div>;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
      <header className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-4xl font-black tracking-tighter flex items-center gap-3">
            <Shield className="text-red-500 w-10 h-10" /> MURMUR MODERATION
          </h1>
          <p className="text-zinc-500 uppercase text-xs font-bold tracking-widest mt-2">
            Reviewing {reports.length} reported incidents
          </p>
        </div>
      </header>

      <div className="grid gap-6">
        {reports.map((report) => (
          <div key={report.id} className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
            {/* Header of Report Card */}
            <div className="p-6 border-b border-zinc-800 bg-zinc-900/50 flex justify-between items-start">
              <div className="space-y-1">
                <div className="flex items-center gap-4">
                  <span className="text-red-400 font-bold">Reported: {report.reported_user}</span>
                  <span className="text-zinc-600">|</span>
                  <span className="text-zinc-400 text-sm font-medium">By: {report.reported_by}</span>
                </div>
                <div className="flex items-center gap-4 text-[10px] text-zinc-500 font-mono uppercase">
                  <span className="flex items-center gap-1"><Fingerprint className="w-3 h-3" /> {report.fingerprint || "NO-FP"}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(report.created_at).toLocaleString()}</span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => handleBan(report)}
                  className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all"
                >
                  <UserX className="w-4 h-4" /> BAN DEVICE
                </button>
                <button 
                  onClick={() => handleDeleteReport(report.id)}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-400 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all"
                >
                  <Trash2 className="w-4 h-4" /> DISMISS
                </button>
              </div>
            </div>

            {/* Chat Log Viewer */}
            <div className="p-6 bg-black/20 max-h-60 overflow-y-auto">
              <h3 className="text-[10px] font-black text-zinc-600 uppercase mb-4 flex items-center gap-2">
                <MessageSquare className="w-3 h-3" /> Chat Transcript
              </h3>
              <div className="space-y-3">
                {report.chat_log?.map((msg: any, idx: number) => (
                  <div key={idx} className="text-sm">
                    <span className={`font-bold mr-2 ${msg.nickname === report.reported_user ? 'text-red-400' : 'text-blue-400'}`}>
                      {msg.nickname}:
                    </span>
                    <span className="text-zinc-300">{msg.content}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        {reports.length === 0 && (
          <div className="text-center py-20 border-2 border-dashed border-zinc-900 rounded-3xl">
            <p className="text-zinc-600 font-bold uppercase tracking-widest text-sm">No pending reports. System clean.</p>
          </div>
        )}
      </div>
    </div>
  );
}