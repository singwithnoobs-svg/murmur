"use client";

import { motion } from "framer-motion";
import { Mail, Terminal, Send } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Navbar />
      <main className="max-w-2xl mx-auto pt-32 px-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
          <div className="bg-zinc-800/50 p-6 flex items-center gap-3 border-b border-zinc-800">
            <Terminal className="w-4 h-4 text-purple-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Secure Transmission Channel</span>
          </div>
          
          <form className="p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-zinc-500 uppercase ml-2">Return Address (Email)</label>
              <input type="email" placeholder="anon@ghost.net" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 outline-none focus:ring-1 focus:ring-purple-500 transition-all text-sm" />
            </div>
            
            <div className="space-y-2">
              <label className="text-[9px] font-black text-zinc-500 uppercase ml-2">Frequency Message</label>
              <textarea rows={4} placeholder="Type your message..." className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 outline-none focus:ring-1 focus:ring-purple-500 transition-all text-sm resize-none" />
            </div>

            <button type="button" className="w-full py-5 bg-white text-black font-black uppercase text-[10px] tracking-widest rounded-2xl flex items-center justify-center gap-3 hover:bg-zinc-200 transition-all">
              Submit Signal <Send className="w-4 h-4" />
            </button>
          </form>
        </motion.div>
      </main>
    </div>
  );
}