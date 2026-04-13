"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Zap, Hash, Key, Loader2,
  Plus, Users, ShieldCheck, Copy, Dice5
} from "lucide-react";
import Navbar from "@/components/Navbar";
import FingerprintJS from "@fingerprintjs/fingerprintjs";

/* ---------------- PAGE ---------------- */

export default function LobbyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mode, setMode] = useState<"join" | "create">("join");
  const [roomId, setRoomId] = useState("");
  const [password, setPassword] = useState("");
  const [statusError, setStatusError] = useState("");

  const [recentRooms, setRecentRooms] = useState<string[]>([]);

  const [isVerifying, setIsVerifying] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  /* ---------------- SECURITY ---------------- */

  useEffect(() => {
    const runSecurityCheck = async () => {
      const invitedId = searchParams.get("id");
      const savedNickname = sessionStorage.getItem("murmur_nickname");

      if (!savedNickname) {
        router.push("/");
        return;
      }

      try {
        const fp = await FingerprintJS.load();
        const result = await fp.get();

        const { data } = await supabase
          .from("banned_fingerprints")
          .select("*")
          .eq("fingerprint", result.visitorId)
          .maybeSingle();

        if (data) {
          alert("You are blocked.");
          router.push("/");
          return;
        }

        if (invitedId) setRoomId(invitedId);

      } catch (err) {
        console.error(err);
      } finally {
        setIsVerifying(false);
      }
    };

    const saved = JSON.parse(localStorage.getItem("recent_rooms") || "[]");
    setRecentRooms(saved);

    runSecurityCheck();
  }, []);

  /* ---------------- HELPERS ---------------- */

  const cleanId = (id: string) =>
    id.trim().toLowerCase().replace(/\s+/g, "-");

  const generateRoom = () => {
    const r = Math.random().toString(36).substring(2, 8);
    setRoomId(r);
  };

  const saveRecent = (id: string) => {
    const updated = [id, ...recentRooms.filter(r => r !== id)].slice(0, 5);
    setRecentRooms(updated);
    localStorage.setItem("recent_rooms", JSON.stringify(updated));
  };

  const copyInvite = () => {
    if (!roomId) return;
    navigator.clipboard.writeText(`${window.location.origin}/lobby?id=${roomId}`);
  };

  /* ---------------- ACTION ---------------- */

  const handleEntry = async () => {
    if (!roomId.trim()) return;

    setIsProcessing(true);
    setStatusError("");

    const id = cleanId(roomId);

    const { data: room } = await supabase
      .from("rooms")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (mode === "join") {
      if (!room) {
        setStatusError("Room not found.");
        setIsProcessing(false);
        return;
      }

      if (room.is_private && room.password !== password) {
        setStatusError("Wrong password.");
        setIsProcessing(false);
        return;
      }
    } else {
      if (room) {
        setStatusError("Room already exists.");
        setIsProcessing(false);
        return;
      }

      await supabase.from("rooms").insert({
        id,
        is_private: !!password,
        password: password || null,
      });
    }

    saveRecent(id);
    router.push(`/${id}`);
  };

  /* ---------------- LOADING ---------------- */

  if (isVerifying) return <LoadingScreen />;

  /* ---------------- UI ---------------- */

  return (
    <div className="min-h-screen bg-[#05010a] text-white relative">

      <Navbar />

      <main className="max-w-5xl mx-auto px-6 py-20">

        {/* HEADER */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-black">
            Enter a Channel
          </h1>
          <p className="text-zinc-400 mt-2">
            Join existing rooms or create your own private space.
          </p>
        </div>

        {/* MAIN GRID */}
        <div className="grid md:grid-cols-2 gap-8">

          {/* LEFT PANEL */}
          <div className="space-y-6">

            {/* MODE SWITCH */}
            <div className="flex gap-2">
              <button
                onClick={() => setMode("join")}
                className={`flex-1 py-3 rounded-xl ${mode === "join" ? "bg-purple-600" : "bg-white/5"}`}
              >
                Join
              </button>
              <button
                onClick={() => setMode("create")}
                className={`flex-1 py-3 rounded-xl ${mode === "create" ? "bg-purple-600" : "bg-white/5"}`}
              >
                Create
              </button>
            </div>

            {/* INPUTS */}
            <div className="space-y-4">

              <div className="relative">
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  placeholder="room-id"
                  onKeyDown={(e) => e.key === "Enter" && handleEntry()}
                  className="w-full pl-12 pr-4 py-4 bg-black/40 border border-white/10 rounded-xl"
                />
              </div>

              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="password (optional)"
                  className="w-full pl-12 pr-4 py-4 bg-black/40 border border-white/10 rounded-xl"
                />
              </div>

              {/* ACTION ROW */}
              <div className="flex gap-2">
                <button onClick={generateRoom} className="p-3 bg-white/5 rounded-xl">
                  <Dice5 />
                </button>
                <button onClick={copyInvite} className="p-3 bg-white/5 rounded-xl">
                  <Copy />
                </button>
              </div>

              {/* ERROR */}
              {statusError && (
                <div className="text-red-400 text-sm">
                  {statusError}
                </div>
              )}

              {/* MAIN BUTTON */}
              <button
                onClick={handleEntry}
                disabled={isProcessing}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600"
              >
                {isProcessing ? <Loader2 className="animate-spin mx-auto" /> : "Continue"}
              </button>

            </div>
          </div>

          {/* RIGHT PANEL */}
          <div>

            <h3 className="text-sm text-zinc-400 mb-3">Recent Rooms</h3>

            <div className="space-y-2">
              {recentRooms.length === 0 && (
                <p className="text-xs text-zinc-500">No recent rooms</p>
              )}

              {recentRooms.map((r) => (
                <button
                  key={r}
                  onClick={() => setRoomId(r)}
                  className="w-full text-left px-4 py-3 bg-white/5 rounded-xl hover:bg-white/10"
                >
                  #{r}
                </button>
              ))}
            </div>

          </div>

        </div>

        {/* FOOTER */}
        <div className="text-center mt-16 text-xs text-zinc-500 flex justify-center gap-6">
          <span>🔒 Anonymous</span>
          <span>⚡ Real-time</span>
          <span>🌍 Global</span>
        </div>

      </main>
    </div>
  );
}

/* ---------------- LOADING ---------------- */

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center text-white">
      <Loader2 className="animate-spin" />
    </div>
  );
}
