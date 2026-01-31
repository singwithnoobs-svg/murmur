"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Gavel,
  Fingerprint,
  EyeOff,
  AlertTriangle,
} from "lucide-react";

export default function TermsModal({
  children,
}: {
  children: React.ReactNode;
}) {
  const [hasAgreed, setHasAgreed] = useState<boolean | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("murmur_consent_v3.2");
    setHasAgreed(!!consent);
  }, []);

  const handleConfirm = async () => {
    if (!agreed) return;
    setIsInitializing(true);
    await new Promise((r) => setTimeout(r, 900));
    localStorage.setItem("murmur_consent_v3.2", "true");
    setIsInitializing(false);
    setHasAgreed(true);
  };

  if (hasAgreed === null) {
    return <div className="h-screen bg-black" />;
  }

  if (hasAgreed) {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl rounded-[2.5rem] border border-zinc-800 bg-zinc-950 p-8 shadow-2xl"
      >
        {/* HEADER */}
        <div className="mb-6 flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-white" />
          <h2 className="text-xl font-black uppercase tracking-wide">
            Entry Protocol
          </h2>
        </div>

        {/* TERMS */}
        <div className="space-y-4 text-[11px] leading-relaxed text-zinc-400 max-h-[55vh] overflow-y-auto pr-2">
          <p>
            <strong>1. Age Restriction</strong><br />
            This platform is strictly for individuals aged <strong>18 years or older</strong>.
            By accessing or using this service, you confirm that you meet this requirement.
          </p>

          <p>
            <strong>2. User-Generated Content</strong><br />
            All messages and interactions are generated solely by users.
            We do not create, endorse, monitor, or verify real-time conversations.
            Responsibility for content lies entirely with the user who submits it.
          </p>

          <p>
            <strong>3. Prohibited Conduct</strong><br />
            You agree not to engage in illegal activity, including but not limited to:
            exploitation of minors, harassment, threats, fraud, hate speech,
            or distribution of unlawful material.
          </p>

          <p>
            <strong>4. Ephemeral Messaging</strong><br />
            Conversations are designed to be temporary and are not routinely stored.
            Message data may be retained <strong>only if a conversation is reported</strong>,
            and solely for moderation, safety enforcement, or legal compliance.
          </p>

          <p>
            <strong>5. Reporting & Manual Review</strong><br />
            Reported users and conversations are reviewed manually.
            Following review, accounts or devices may be restricted,
            suspended temporarily, or banned permanently at our discretion.
          </p>

          <p>
            <strong>6. Enforcement & Account Actions</strong><br />
            We reserve the unrestricted right to delete messages,
            remove content, suspend access, or terminate accounts or devices
            at any time, with or without notice.
          </p>

          <p>
            <strong>7. Device Fingerprinting</strong><br />
            We use device and browser fingerprinting techniques to detect abuse,
            enforce bans, and prevent repeat violations.
            Attempts to evade enforcement may result in permanent exclusion.
          </p>

          <p>
            <strong>8. Exposure Disclaimer</strong><br />
            Anonymous interactions may expose you to offensive,
            explicit, or disturbing content. You acknowledge and accept this risk.
          </p>

          <p>
            <strong>9. No Warranties</strong><br />
            This service is provided “AS IS” and “AS AVAILABLE”.
            We make no guarantees regarding availability, safety,
            or user behavior.
          </p>

          <p>
            <strong>10. Limitation of Liability</strong><br />
            To the maximum extent permitted by law,
            we are not liable for damages resulting from user interactions,
            content, or misuse of the platform.
          </p>

          <p>
            <strong>11. Law Enforcement Cooperation</strong><br />
            We may cooperate with lawful requests from authorities
            when legally required. Anonymity is not guaranteed
            against valid legal processes.
          </p>

          <p>
            <strong>12. Acceptance</strong><br />
            By continuing, you confirm that you have read,
            understood, and agreed to these Terms and Conditions.
          </p>
        </div>

        {/* CONSENT */}
        <label className="mt-6 flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-800 bg-black/40 p-4">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="h-5 w-5 rounded border-zinc-700 bg-black"
          />
          <span className="text-[11px] text-zinc-300">
            I confirm I am 18+ and accept all Terms & Conditions
          </span>
        </label>

        {/* ACTIONS */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => (window.location.href = "https://google.com")}
            className="flex-1 rounded-2xl bg-zinc-800 py-3 text-[10px] font-bold uppercase text-zinc-400 hover:bg-zinc-700"
          >
            Exit
          </button>

          <button
            onClick={handleConfirm}
            disabled={!agreed}
            className="flex-[2] rounded-2xl bg-white py-3 text-[10px] font-black uppercase text-black disabled:opacity-30"
          >
            {isInitializing ? "Initializing…" : "Initialize Session"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
