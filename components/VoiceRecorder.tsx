"use client";
import { useState, useRef } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export function VoiceRecorder({ onUploadComplete }: { onUploadComplete: (url: string) => void }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder.current = new MediaRecorder(stream);
    mediaRecorder.current.ondataavailable = (e) => chunks.current.push(e.data);
    mediaRecorder.current.onstop = async () => {
      const blob = new Blob(chunks.current, { type: "audio/ogg; codecs=opus" });
      uploadVoice(blob);
      chunks.current = [];
    };
    mediaRecorder.current.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    mediaRecorder.current?.stop();
    setIsRecording(false);
  };

  const uploadVoice = async (blob: Blob) => {
    setIsUploading(true);
    const fileName = `${Math.random()}.ogg`;
    const { data, error } = await supabase.storage
      .from("voice-messages")
      .upload(fileName, blob);

    if (data) {
      const { data: { publicUrl } } = supabase.storage.from("voice-messages").getPublicUrl(fileName);
      onUploadComplete(publicUrl);
    }
    setIsUploading(false);
  };

  return (
    <button 
      onClick={isRecording ? stopRecording : startRecording}
      disabled={isUploading}
      className={`p-3 rounded-2xl transition-all ${isRecording ? "bg-red-500 animate-pulse" : "bg-zinc-800 hover:bg-zinc-700"}`}
    >
      {isUploading ? <Loader2 className="animate-spin w-5 h-5" /> : isRecording ? <Square className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
    </button>
  );
}