"use client";

import { motion } from "framer-motion";
import { Mail, Users } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function ContactPage() {
  return (
    <div className="relative min-h-screen bg-zinc-950 text-white overflow-y-auto">
      <Navbar />

      <main className="max-w-2xl mx-auto pt-32 px-6 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-12"
        >
          {/* HEADER */}
          <header className="space-y-3">
            <h1 className="text-4xl font-black tracking-tight">
              Contact
            </h1>
            <p className="text-zinc-400 text-sm leading-relaxed max-w-md">
              For business inquiries, partnerships, reports, or appeals, use the
              channels below.
            </p>
          </header>

          {/* CONTACT CARDS */}
          <section className="grid gap-6">
            {/* EMAIL */}
            <div className="p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800">
              <div className="flex items-center gap-3 mb-3 text-indigo-400">
                <Mail className="w-5 h-5" />
                <h2 className="font-bold tracking-tight">Business & Promotions</h2>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                For brand promotions, partnerships, or formal inquiries, contact
                us directly by email.
              </p>
              <a
                href="mailto:singwithnoobs@gmail.com"
                className="text-sm font-semibold text-white hover:underline"
              >
                singwithnoobs@gmail.com
              </a>
            </div>

            {/* DISCORD */}
            <div className="p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800">
              <div className="flex items-center gap-3 mb-3 text-purple-400">
                <Users className="w-5 h-5" />
                <h2 className="font-bold tracking-tight">Support & Appeals</h2>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                Join our Discord for unban appeals, bug reports, safety reports,
                or any other platform-related issues.
              </p>
              <a
                href="https://discord.gg/your-discord-link"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-sm font-semibold text-white hover:underline"
              >
                Join our Discord Server →
              </a>
            </div>
          </section>

          {/* FOOTNOTE */}
          <footer className="pt-8 border-t border-zinc-900">
            <p className="text-zinc-500 text-xs leading-relaxed max-w-md">
              Please do not send illegal content or abuse reports by email.
              Use the in-app report tools or Discord for moderation-related
              matters.
            </p>
          </footer>
        </motion.div>
      </main>
    </div>
  );
}
