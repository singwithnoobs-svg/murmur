"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, X, Scale, EyeOff } from "lucide-react";

export default function TermsModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl"
          >
            <div className="p-8 md:p-10 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center border border-purple-500/20">
                  <ShieldAlert className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight italic uppercase">Terms of Ghost</h2>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Protocol v1.0.4</p>
                </div>
              </div>

              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 no-scrollbar text-zinc-400 text-sm leading-relaxed">
                <section>
                  <div className="flex items-center gap-2 text-zinc-200 font-bold mb-1">
                    <EyeOff className="w-4 h-4" /> 01. Privacy & Logs
                  </div>
                  <p>Murmur does not store permanent logs. All messages are ephemeral and are purged from our database when a chat session is terminated or the frequency is closed.</p>
                </section>

                <section>
                  <div className="flex items-center gap-2 text-zinc-200 font-bold mb-1">
                    <Scale className="w-4 h-4" /> 02. Content Viewing
                  </div>
                  <p>Chats are never viewed by staff **unless a formal Report is filed.** When you report a user, a snapshot of the current chat history is saved for 48 hours for moderation review to prevent harassment and illegal content.</p>
                </section>

                <section>
                  <div className="flex items-center gap-2 text-zinc-200 font-bold mb-1">
                    <ShieldAlert className="w-4 h-4" /> 03. Prohibited Use
                  </div>
                  <p>Usage for illegal activities, automated bot spamming, or severe harassment will result in a hardware/fingerprint ban from the network.</p>
                </section>
              </div>

              <button 
                onClick={onClose}
                className="w-full bg-white text-black font-black py-5 rounded-2xl hover:bg-zinc-200 transition-all uppercase text-xs tracking-widest active:scale-95"
              >
                I Accept the Terms
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}