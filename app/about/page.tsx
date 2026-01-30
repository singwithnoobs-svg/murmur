"use client";

import { motion } from "framer-motion";
import { Info, Shield, Zap, EyeOff } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Navbar />
      <main className="max-w-3xl mx-auto pt-32 px-6 pb-20">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
          <div className="space-y-4 text-center lg:text-left">
            <h1 className="text-5xl font-black tracking-tighter italic uppercase">Protocol: About</h1>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.4em]">The Ghost Philosophy</p>
          </div>

          <div className="grid gap-6">
            <FeatureCard 
              icon={<Shield className="text-purple-500" />}
              title="Identity-Less"
              desc="We don't want your email, phone number, or name. Your identity is generated randomly every time you visit."
            />
            <FeatureCard 
              icon={<EyeOff className="text-purple-500" />}
              title="Zero Archive"
              desc="Messages exist only in RAM. Once a frequency is closed or the timer hits zero, the data is shredded."
            />
            <FeatureCard 
              icon={<Zap className="text-purple-500" />}
              title="Peer-to-Peer Focus"
              desc="Built for high-speed, low-latency communication with absolute cryptographic focus."
            />
          </div>
        </motion.div>
      </main>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800 hover:border-purple-500/30 transition-colors group">
      <div className="mb-4">{icon}</div>
      <h3 className="text-lg font-black uppercase italic mb-2 tracking-tight group-hover:text-purple-400 transition-colors">{title}</h3>
      <p className="text-zinc-400 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}