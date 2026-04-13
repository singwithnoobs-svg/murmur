"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  RefreshCw, ShieldCheck, Zap, Megaphone, Users, Key
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";

/* ---------------- NAME GENERATOR ---------------- */

const prefixes = ["Neo", "Vox", "Zen", "Lux", "Nyx", "Sol"];
const cores = ["Bit", "Vex", "Max", "Dot", "Ace", "Hub"];
const suffixes = ["1", "X", "0", "Z", "V"];

export default function LandingPage() {
  const [name, setName] = useState("");
  const [userCount, setUserCount] = useState<number>(0);

  const router = useRouter();
  const searchParams = useSearchParams();

  /* ---------------- GENERATE NAME ---------------- */

  const generateIdentity = () => {
    const identity =
      prefixes[Math.floor(Math.random() * prefixes.length)] +
      cores[Math.floor(Math.random() * cores.length)] +
      suffixes[Math.floor(Math.random() * suffixes.length)];

    setName(identity);
    sessionStorage.setItem("murmur_nickname", identity);
    return identity;
  };

  /* ---------------- FETCH USER COUNT ---------------- */

  useEffect(() => {
  const fetchCount = async () => {
    console.log("📡 Fetching user count...");

    const { data, error } = await supabase
      .from("stats")
      .select("total_users")
      .eq("id", 1)
      .single();

    if (error) {
      console.error("❌ Fetch error:", error);
      return;
    }

    console.log("✅ Fetched count:", data);

    if (data) setUserCount(data.total_users);
  };

  fetchCount();
}, []);

  /* ---------------- INIT ---------------- */

  useEffect(() => {
    const id = generateIdentity();
    const inviteId = searchParams.get("id");

    if (inviteId) {
      sessionStorage.setItem("murmur_nickname", id);
      router.push(`/lobby?id=${inviteId}`);
    }
  }, []);

  /* ---------------- INCREMENT COUNT ---------------- */

  const incrementUserCount = async () => {
  console.log("🚀 Increment triggered");

  if (sessionStorage.getItem("counted")) {
    console.log("⚠️ Already counted in this session");
    return;
  }

  const { data, error } = await supabase
    .from("stats")
    .select("total_users")
    .eq("id", 1)
    .single();

  if (error) {
    console.error("❌ Fetch before increment failed:", error);
    return;
  }

  console.log("📊 Current count:", data.total_users);

  const newCount = data.total_users + 1;

  const { error: updateError } = await supabase
    .from("stats")
    .update({ total_users: newCount })
    .eq("id", 1);

  if (updateError) {
    console.error("❌ Update failed:", updateError);
    return;
  }

  console.log("✅ Updated count to:", newCount);

  setUserCount(newCount);
  sessionStorage.setItem("counted", "true");
};

  /* ---------------- START CHAT ---------------- */

 const startChat = async () => {
  console.log("🟢 Start Chat clicked");

  await incrementUserCount();

  sessionStorage.setItem("murmur_nickname", name);
  const inviteId = searchParams.get("id");

  console.log("➡️ Redirecting...");

  router.push(inviteId ? `/lobby?id=${inviteId}` : "/lobby");
};

  /* ---------------- UI ---------------- */

  return (
    <div className="min-h-screen bg-[#05010a] text-white relative overflow-hidden">

      {/* 🌌 BACKGROUND */}
      <div className="absolute inset-0">
        <div className="absolute w-[600px] h-[600px] bg-purple-600/20 blur-[140px] top-[-200px] left-[-200px]" />
        <div className="absolute w-[500px] h-[500px] bg-fuchsia-500/20 blur-[140px] bottom-[-200px] right-[-200px]" />
      </div>

      <Navbar />

      <main className="relative z-10 px-6 py-20 max-w-5xl mx-auto text-center">

        {/* HERO */}
        <div className="space-y-6">
          <h1 className="text-6xl font-black tracking-tight">
            Murmurz
          </h1>

          <p className="text-zinc-400 max-w-md mx-auto">
            Chat anonymously with strangers or friends.
            No accounts. No tracking. Just instant communication.
          </p>

          {/* TRUST BAR */}
          <div className="flex justify-center gap-6 text-xs text-zinc-500 mt-4">
            <span>🔒 No Login</span>
            <span>⚡ Instant</span>
            <span>🌍 Global</span>
          </div>

          {/* USER COUNT */}
          <div className="mt-6 text-sm text-zinc-400">
            Trusted by{" "}
            <span className="text-purple-400 font-bold text-lg">
              {userCount.toLocaleString()}
            </span>{" "}
            users
          </div>
        </div>

        {/* IDENTITY CARD */}
        <div className="mt-16 max-w-md mx-auto p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl">

          <div className="flex items-center justify-between">
            <div className="text-left">
              <h2 className="text-2xl font-black">{name}</h2>
              <p className="text-xs text-purple-400 uppercase tracking-widest">
                Temporary Identity
              </p>
            </div>

            <button
              onClick={generateIdentity}
              className="p-3 rounded-xl bg-white/5 hover:bg-purple-500/20 transition"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* CTA */}
        <button
          onClick={startChat}
          className="mt-8 px-10 py-5 rounded-2xl font-bold text-lg
          bg-gradient-to-r from-purple-600 to-fuchsia-600
          hover:scale-105 transition-all"
        >
          <span className="flex items-center gap-2 justify-center">
            <Zap className="w-5 h-5" />
            Start Chatting
          </span>
        </button>

        {/* FEATURES */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20">

          <Feature icon={<ShieldCheck />} title="Anonymous" desc="No identity needed" />
          <Feature icon={<Users />} title="Public Rooms" desc="Chat globally" />
          <Feature icon={<Key />} title="Private Chat" desc="Password rooms" />
          <Feature icon={<Zap />} title="Instant" desc="Real-time messages" />

        </div>

        {/* SUPPORT */}
        <button
          onClick={() => router.push("/promotions")}
          className="mt-16 text-xs text-zinc-500 hover:text-purple-400 flex items-center gap-2 mx-auto"
        >
          <Megaphone className="w-3 h-3" />
          Support Murmurz
        </button>

      </main>
    </div>
  );
}

/* ---------------- FEATURE CARD ---------------- */

function Feature({ icon, title, desc }: any) {
  return (
    <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
      <div className="text-purple-400 mb-2 flex justify-center">{icon}</div>
      <h3 className="text-sm font-bold">{title}</h3>
      <p className="text-xs text-zinc-400">{desc}</p>
    </div>
  );
}
