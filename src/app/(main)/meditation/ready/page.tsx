// /app/(main)/meditation/ready/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import PlanetBackground from "@/components/visuals/PlanetBackground";

type MoodEntry = {
  id: string;
  checked_in_mood: string;
  destination_mood: string | null;
  note: string | null;
};

export type MeditationTheme = {
  duration?: number;
  color?: string;
  [key: string]: string | number | undefined;
};

export type MeditationPhase = {
  phase: string;
  text: string;
  theme?: MeditationTheme;
};

const MUSIC_MAP: Record<string, string> = {
  accepting: "accepting.mp3",
  calm: "calm.mp3",
  peaceful: "peaceful.mp3",
  grateful: "grateful.mp3",
  content: "content.mp3",
  grounded: "grounded.mp3",
  connected: "connected.mp3",
  patient: "patient.mp3",
  hopeful: "hopeful.mp3",
  joyful: "joyful.mp3",
  energized: "energized.mp3",
  rested: "rested.mp3",
  understanding: "understanding.mp3",
  focused: "focused.mp3",
  relaxed: "calm.mp3",
  clear: "focused.mp3"
};

export default function MeditationReadyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const entryId = searchParams.get("entry_id");

  const [entry, setEntry] = useState<MoodEntry | null>(null);
  const [meditation, setMeditation] = useState<MeditationPhase[] | null>(null);

  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<string>("Initializing...");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Strict Mode double-run guard
  const hasRunRef = useRef(false);

  useEffect(() => {
    if (hasRunRef.current) return;
    hasRunRef.current = true;
    void prepareEverything();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryId]);

  const prepareEverything = async () => {
    try {
      setCurrentStep("Fetching your emotional state...");
      setProgress(10);

      if (!entryId) return router.push("/check-in");

      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) return router.push("/login");

      const { data: entryData, error: entryError } = await supabase
        .from("mood_entries")
        .select("id, checked_in_mood, destination_mood, note")
        .eq("id", entryId)
        .single();

      if (entryError || !entryData) return router.push("/check-in");
      if (!entryData.destination_mood)
        return router.push(`/meditation/destination?entry_id=${entryId}`);

      setEntry(entryData);
      setProgress(20);

      // 2) Generate phases
      setCurrentStep("Generating your personalized meditation...");
      setProgress(30);

      const genRes = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checked_in_mood: entryData.checked_in_mood,
          destination_mood: entryData.destination_mood,
          note: entryData.note
        })
      });
      if (!genRes.ok) throw new Error("Failed to generate meditation");
      const phases: MeditationPhase[] = await genRes.json();
      if (!Array.isArray(phases) || phases.length !== 6)
        throw new Error("Invalid meditation format (need 6 phases)");

      setMeditation(phases);
      setProgress(50);

      // 3) TTS batch upload → signed URLs
      setCurrentStep("Preparing voice narration...");
      const batch = await fetch("/api/tts-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entryId,
          phases: phases.map((p) => ({ text: p.text }))
        })
      });
      if (!batch.ok) throw new Error("Failed to synthesize narration");
      const { urls }: { urls: string[] } = await batch.json();
      if (!urls || urls.length !== phases.length)
        throw new Error("Narration not fully prepared");

      setProgress(85);

      // 4) Preload ambient music (best-effort)
      setCurrentStep("Loading ambient music...");
      const musicFile =
        MUSIC_MAP[entryData.destination_mood] ?? MUSIC_MAP["calm"];
      if (musicFile) {
        await new Promise<void>((resolve) => {
          const audio = new Audio(`/music/${musicFile}`);
          audio.oncanplaythrough = () => resolve();
          audio.onerror = () => resolve();
        });
      }

      setProgress(100);
      setCurrentStep("Ready!");

      // 5) Handoff with sessionStorage
      sessionStorage.setItem("entryId", entryId);
      sessionStorage.setItem("meditation", JSON.stringify(phases));
      sessionStorage.setItem("ttsUrls", JSON.stringify(urls));

      await new Promise((r) => setTimeout(r, 400));
      setCountdown(3);
    } catch (err) {
      console.error("Preparation error:", err);
      setError(
        "Something went wrong preparing your meditation. Please try again."
      );
      setTimeout(
        () => router.push(`/meditation/destination?entry_id=${entryId ?? ""}`),
        1600
      );
    }
  };

  // Countdown → redirect
  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      router.push(`/meditation/session?entry_id=${entryId}`);
      return;
    }
    const t = setTimeout(() => setCountdown((c) => (c ?? 1) - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, entryId, router]);

  if (error) {
    return (
      <div className="min-h-screen bg-brand text-white relative overflow-hidden flex items-center justify-center">
        <PlanetBackground />
        <div className="relative z-10 text-center max-w-md">
          <p className="text-red-300 mb-4">{error}</p>
          <p className="text-sm text-gray-400">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand text-white relative overflow-hidden flex flex-col items-center justify-center p-8">
      <PlanetBackground />
      <div className="relative z-10 text-center max-w-lg">
        {countdown !== null ? (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold">Your Journey Awaits</h1>
            {entry && (
              <p className="text-gray-300">
                You are feeling{" "}
                <span className="font-semibold text-purple-200">
                  {entry.checked_in_mood}
                </span>
                <br />
                Let&apos;s guide you toward{" "}
                <span className="font-semibold text-orange-200">
                  {entry.destination_mood}
                </span>
              </p>
            )}
            {entry?.note && (
              <p className="text-sm text-purple-200 italic max-w-md mx-auto">
                &quot;{entry.note}&quot;
              </p>
            )}
            <div className="text-6xl font-bold mt-8">{countdown}</div>
            <p className="text-sm text-gray-400">Starting meditation...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
            <h2 className="text-2xl font-semibold">
              Preparing Your Experience
            </h2>

            <div className="w-full max-w-md mx-auto">
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-gray-400 mt-2">{currentStep}</p>
              <p className="text-xs text-gray-500 mt-1">
                {Math.round(progress)}%
              </p>
            </div>

            {meditation && (
              <p className="text-sm text-purple-300 mt-4">
                ✨ {meditation.length} phases crafted for your journey
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
