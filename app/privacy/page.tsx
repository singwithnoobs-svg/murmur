"use client";

import { motion } from "framer-motion";
import {
  Fingerprint,
  Trash2,
  ShieldAlert,
  EyeOff,
  Scale,
  Database,
} from "lucide-react";
import Navbar from "@/components/Navbar";

export default function PrivacyPage() {
  const revokeAccess = () => {
    localStorage.removeItem("murmur_consent_v3.2");
    window.location.href = "/";
  };

  return (
    // 👇 THIS enables scrolling properly
    <div className="relative min-h-screen bg-zinc-950 text-white overflow-y-auto">
      <Navbar />

      <main className="relative max-w-3xl mx-auto pt-32 px-6 pb-32">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-14"
        >
          {/* HEADER */}
          <header className="space-y-2">
            <h1 className="text-4xl font-black uppercase italic tracking-tighter">
              Privacy Protocol
            </h1>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
              Effective: January 2026
            </p>
          </header>

          {/* SECTION: ANONYMITY */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-indigo-400">
              <EyeOff className="w-5 h-5" />
              <h2 className="font-bold uppercase tracking-tight">
                Anonymity & Identity
              </h2>
            </div>
            <p className="text-zinc-400 text-sm leading-relaxed bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800">
              This platform is designed for anonymous communication. We do not
              require names, emails, phone numbers, or account registration.
              Users are identified only through temporary session identifiers.
            </p>
          </section>

          {/* SECTION: DEVICE FINGERPRINTING */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-purple-400">
              <Fingerprint className="w-5 h-5" />
              <h2 className="font-bold uppercase tracking-tight">
                Device Fingerprinting
              </h2>
            </div>
            <p className="text-zinc-400 text-sm leading-relaxed bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800">
              We use device and browser fingerprinting technologies (including
              FingerprintJS) solely for abuse prevention, rate limiting, and
              enforcement of bans. These identifiers are not used for tracking,
              advertising, or profiling.
            </p>
          </section>

          {/* SECTION: DATA RETENTION */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <Database className="w-5 h-5" />
              <h2 className="font-bold uppercase tracking-tight">
                Data Retention
              </h2>
            </div>
            <p className="text-zinc-400 text-sm leading-relaxed border-l-2 border-zinc-800 pl-6">
              Conversations are ephemeral by design. We do not store messages by
              default. Message content is retained only if a user submits a
              report, and only for the purpose of manual moderation, abuse
              investigation, or legal compliance. Unreported conversations are
              automatically purged.
            </p>
          </section>

          {/* SECTION: LEGAL BASIS */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-emerald-400">
              <Scale className="w-5 h-5" />
              <h2 className="font-bold uppercase tracking-tight">
                Legal Basis & Compliance
              </h2>
            </div>
            <p className="text-zinc-400 text-sm leading-relaxed bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800">
              Data processing is performed under legitimate interest for
              platform security, abuse prevention, and compliance with
              applicable laws. We do not sell personal data and do not engage in
              targeted advertising.
            </p>
          </section>

          {/* DANGER ZONE */}
          <section className="pt-16 border-t border-zinc-900">
            <div className="bg-red-500/5 border border-red-500/20 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
              <div>
                <h3 className="text-red-500 font-black uppercase text-xs mb-1">
                  Revoke Authorization
                </h3>
                <p className="text-zinc-500 text-[10px] font-bold uppercase">
                  Wipe local consent & terminate this session
                </p>
              </div>

              <button
                onClick={revokeAccess}
                className="px-8 py-4 bg-red-600 hover:bg-red-500 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all active:scale-95 flex items-center gap-2"
              >
                <ShieldAlert className="w-4 h-4" />
                Self-Destruct
              </button>
            </div>
          </section>
        </motion.div>
      </main>
    </div>
  );
}
