"use client";

import { motion } from "framer-motion";
import { Fingerprint, Trash2, ShieldAlert } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function PrivacyPage() {
  const revokeAccess = () => {
    localStorage.removeItem("murmur_consent_v3.1");
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Navbar />
      <main className="max-w-3xl mx-auto pt-32 px-6 pb-20">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
          <div className="space-y-2">
            <h1 className="text-4xl font-black uppercase italic tracking-tighter">Privacy Protocol</h1>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Effective: Jan 2026</p>
          </div>

          <section className="space-y-4">
            <div className="flex items-center gap-3 text-purple-400">
              <Fingerprint className="w-5 h-5" />
              <h2 className="font-bold uppercase tracking-tight">Hardware Identifiers</h2>
            </div>
            <p className="text-zinc-400 text-sm leading-relaxed bg-zinc-900/30 p-6 rounded-2xl border border-zinc-800/50">
              We utilize device fingerprinting via FingerprintJS to assign temporary node identities and enforce community safety. If you are reported for violations, this fingerprint is used to exclude your device from the network.
            </p>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <Trash2 className="w-5 h-5" />
              <h2 className="font-bold uppercase tracking-tight">Data Retention</h2>
            </div>
            <p className="text-zinc-400 text-sm leading-relaxed border-l-2 border-zinc-800 pl-6">
              Messages are stored in ephemeral database tables. We do not maintain backups. Once a chat room is inactive for 24 hours, all associated data is purged via automated cryptographic shredding.
            </p>
          </section>

          {/* DANGER ZONE */}
          <div className="pt-10 border-t border-zinc-900">
            <div className="bg-red-500/5 border border-red-500/20 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
              <div>
                <h3 className="text-red-500 font-black uppercase text-xs mb-1">Revoke Authorization</h3>
                <p className="text-zinc-500 text-[10px] font-bold uppercase">Wipe local consent and disconnect session</p>
              </div>
              <button 
                onClick={revokeAccess}
                className="px-8 py-4 bg-red-600 hover:bg-red-500 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all active:scale-95 flex items-center gap-2"
              >
                <ShieldAlert className="w-4 h-4" /> Self-Destruct
              </button>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}