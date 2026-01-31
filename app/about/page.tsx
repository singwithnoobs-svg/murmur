"use client";

import { motion } from "framer-motion";
import { Shield, EyeOff, Zap, Users } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function AboutPage() {
  return (
    <div className="relative min-h-screen bg-zinc-950 text-white overflow-y-auto">
      <Navbar />

      <main className="max-w-3xl mx-auto pt-32 px-6 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-16"
        >
          {/* HEADER */}
          <header className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">
              About This Platform
            </h1>
            <p className="text-zinc-400 text-sm leading-relaxed max-w-xl">
              This platform is built for anonymous, real-time conversations
              without accounts, profiles, or social graphs. The focus is simple:
              connect people, reduce friction, and respect privacy by design.
            </p>
          </header>

          {/* FEATURES */}
          <section className="grid gap-6">
            <FeatureCard
              icon={<Shield className="text-indigo-400" />}
              title="Privacy by Default"
              desc="We do not require registration, emails, phone numbers, or usernames. Sessions are temporary and designed to minimize data exposure."
            />

            <FeatureCard
              icon={<EyeOff className="text-purple-400" />}
              title="Ephemeral Conversations"
              desc="Messages are not archived by default. Conversations are intended to exist only for their active duration unless reported for safety review."
            />

            <FeatureCard
              icon={<Zap className="text-yellow-400" />}
              title="Fast & Lightweight"
              desc="Built for low-latency communication with minimal overhead, allowing instant connections without unnecessary complexity."
            />

            <FeatureCard
              icon={<Users className="text-emerald-400" />}
              title="Community Safety"
              desc="While chats are anonymous, abuse is not tolerated. Report tools and enforcement systems are in place to reduce misuse and protect users."
            />
          </section>

          {/* FOOTNOTE */}
          <footer className="pt-10 border-t border-zinc-900">
            <p className="text-zinc-500 text-xs leading-relaxed max-w-xl">
              This service is intended for users aged 18 and above. Anonymous
              communication may expose you to unfiltered user content. Use at
              your own discretion.
            </p>
          </footer>
        </motion.div>
      </main>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-colors">
      <div className="mb-4">{icon}</div>
      <h3 className="text-lg font-bold mb-2 tracking-tight">{title}</h3>
      <p className="text-zinc-400 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}
