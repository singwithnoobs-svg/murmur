"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Gavel, Fingerprint, EyeOff, XCircle, Zap } from "lucide-react";

export default function TermsModal({ children }: { children: React.ReactNode }) {
  const [hasAgreed, setHasAgreed] = useState<boolean | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("murmur_consent_v3.1");
    setHasAgreed(!!consent);
  }, []);

  const handleConfirm = async () => {
    if (agreed) {
      setIsInitializing(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      localStorage.setItem("murmur_consent_v3.1", "true");
      setIsInitializing(false);
      setHasAgreed(true);
    }
  };

  if (hasAgreed === null) return <div className="h-screen bg-black" />;

  // IF AGREED: Return the website (LandingPage, Lobby, etc.)
  if (hasAgreed) return <>{children}</>;

  // IF NOT AGREED: Return the Full Screen Lock
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-zinc-900 border border-zinc-800 w-full max-w-xl rounded-[3rem] overflow-hidden p-10">
        <h2 className="text-2xl font-black uppercase italic mb-6">Entry Protocol</h2>
        <div className="space-y-4 text-zinc-400 text-xs mb-8">
            <p>1. You are entering a ghost conduit.</p>
            <p>2. Hardware fingerprinting is active for safety.</p>
            <p>3. All messages are ephemeral.</p>
        </div>
        <label className="flex items-center gap-4 mb-8 cursor-pointer">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="w-6 h-6 rounded bg-black border-zinc-800" />
          <span className="text-xs text-zinc-300">Accept Terms of Ghost</span>
        </label>
        <div className="flex gap-3">
          <button onClick={() => window.location.href="https://google.com"} className="flex-1 bg-zinc-800 py-4 rounded-2xl text-[10px] font-bold text-zinc-500 uppercase">Exit</button>
          <button onClick={handleConfirm} disabled={!agreed} className="flex-[2] bg-white text-black py-4 rounded-2xl text-[10px] font-black uppercase disabled:opacity-20">
            {isInitializing ? "Initializing..." : "Initialize Session"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
