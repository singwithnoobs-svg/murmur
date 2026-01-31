"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck,
} from "lucide-react";

export default function TermsModal({
  children,
}: {
  children: React.ReactNode;
}) {
  const [hasAgreed, setHasAgreed] = useState<boolean | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  // 🔹 Check consent once on mount
  useEffect(() => {
    const consent = localStorage.getItem("murmur_consent_v3.2");
    setHasAgreed(!!consent);
  }, []);

  // 🔒 Lock scroll ONLY while modal is mounted
  useEffect(() => {
    if (hasAgreed === false) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "auto";
      };
    }
  }, [hasAgreed]);

  const handleConfirm = async () => {
    if (!agreed) return;

    setIsInitializing(true);
    await new Promise((r) => setTimeout(r, 900));

    localStorage.setItem("murmur_consent_v3.2", "true");
    setHasAgreed(true); // 🔑 unmounts modal completely
    setIsInitializing(false);
  };

  // ⏳ Prevent flash / hydration issues
  if (hasAgreed === null) {
    return <div className="h-screen bg-black" />;
  }

  // ✅ Once agreed → modal DOES NOT EXIST AT ALL
  if (hasAgreed) {
    return <>{children}</>;
  }

  // 🧱 Modal exists ONLY here
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl rounded-[2.5rem] border border-zinc-800 bg-zinc-950 p-8 shadow-2xl"
      >
        {/* HEADER */}
        <div className="mb-6 flex items-center gap-3">
          <ShieldCheck className="h-6 w-6 text-white" />
          <h2 className="text-xl font-black uppercase tracking-wide">
            Entry Protocol
          </h2>
        </div>

        {/* TERMS */}
        <div className="max-h-[55vh] space-y-4 overflow-y-auto pr-2 text-[11px] leading-relaxed text-zinc-400">
          <p><strong>1. Age Restriction</strong><br />18+ only.</p>

          <p><strong>2. User-Generated Content</strong><br />
            All content is created by users. We do not monitor real-time chats.
          </p>

          <p><strong>3. Prohibited Conduct</strong><br />
            Illegal activity, harassment, hate speech, or exploitation is forbidden.
          </p>

          <p><strong>4. Ephemeral Messaging</strong><br />
            Messages are not stored unless reported.
          </p>

          <p><strong>5. Reporting & Manual Review</strong><br />
            Reported users are manually reviewed and may be temporarily or permanently banned.
          </p>

          <p><strong>6. Enforcement</strong><br />
            We reserve the right to delete content, restrict access, or ban accounts/devices.
          </p>

          <p><strong>7. Device Fingerprinting</strong><br />
            Used solely for abuse prevention and ban enforcement.
          </p>

          <p><strong>8. Exposure Disclaimer</strong><br />
            Anonymous chats may contain offensive content.
          </p>

          <p><strong>9. No Warranties</strong><br />
            Service provided “AS IS”.
          </p>

          <p><strong>10. Limitation of Liability</strong><br />
            We are not liable for user-generated content.
          </p>

          <p><strong>11. Law Enforcement</strong><br />
            We comply with valid legal requests.
          </p>

          <p><strong>12. Acceptance</strong><br />
            Continuing confirms acceptance of all terms.
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
