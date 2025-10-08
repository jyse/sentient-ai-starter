// **********
// CLAUDe
// **********

"use client";

import { useEffect, useState } from "react";
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

  // Progress tracking
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<string>("Initializing...");
  const [preparing, setPreparing] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Error handling
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    prepareEverything();
  }, [entryId]);

  const prepareEverything = async () => {
    try {
      // ✅ Step 1: Fetch entry data
      setCurrentStep("Fetching your emotional state...");
      setProgress(10);

      if (!entryId) {
        router.push("/check-in");
        return;
      }

      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: entryData, error: entryError } = await supabase
        .from("mood_entries")
        .select("id, checked_in_mood, destination_mood, note")
        .eq("id", entryId)
        .single();

      if (entryError || !entryData) {
        router.push("/check-in");
        return;
      }

      if (!entryData.destination_mood) {
        router.push(`/meditation/destination?entry_id=${entryId}`);
        return;
      }

      setEntry(entryData);
      setProgress(20);

      // ✅ Step 2: Generate meditation with AI
      setCurrentStep("Generating your personalized meditation...");
      setProgress(30);

      const generateResponse = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checked_in_mood: entryData.checked_in_mood,
          destination_mood: entryData.destination_mood,
          note: entryData.note
        })
      });

      if (!generateResponse.ok) {
        throw new Error("Failed to generate meditation");
      }

      const meditationJson: MeditationPhase[] = await generateResponse.json();

      if (!Array.isArray(meditationJson) || meditationJson.length !== 6) {
        throw new Error("Invalid meditation format");
      }

      setMeditation(meditationJson);
      setProgress(50);

      // ✅ Step 3: Preload ALL TTS audio files
      setCurrentStep("Preparing voice narration...");

      const ttsCache: Record<number, { url: string; duration: number }> = {};

      for (let i = 0; i < meditationJson.length; i++) {
        const phase = meditationJson[i];

        try {
          const ttsResponse = await fetch("/api/tts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: phase.text })
          });

          if (!ttsResponse.ok) throw new Error(`TTS failed for phase ${i}`);

          const blob = await ttsResponse.blob();
          const url = URL.createObjectURL(blob);

          // Measure audio duration
          const audio = new Audio(url);
          await new Promise<void>((resolve) => {
            audio.onloadedmetadata = () => {
              ttsCache[i] = { url, duration: audio.duration * 1000 };
              resolve();
            };
          });

          // Update progress incrementally (50% to 85%)
          const progressIncrement = 35 / meditationJson.length;
          setProgress(50 + (i + 1) * progressIncrement);
        } catch (err) {
          console.error(`Failed to preload TTS for phase ${i}`, err);
          // Continue even if one phase fails
        }
      }

      setProgress(85);

      // ✅ Step 4: Preload background music
      setCurrentStep("Loading ambient music...");

      const musicFile = MUSIC_MAP[entryData.destination_mood];
      if (musicFile) {
        const musicAudio = new Audio(`/music/${musicFile}`);
        await new Promise<void>((resolve) => {
          musicAudio.oncanplaythrough = () => resolve();
          musicAudio.onerror = () => resolve(); // Continue even if music fails
        });
      }

      setProgress(100);
      setCurrentStep("Ready!");

      // ✅ Step 5: Save everything to localStorage
      localStorage.setItem("currentMeditation", JSON.stringify(meditationJson));
      localStorage.setItem("ttsCache", JSON.stringify(ttsCache));

      // ✅ Step 6: Start countdown
      await new Promise((resolve) => setTimeout(resolve, 500));
      setPreparing(false);
      setCountdown(3);
    } catch (err) {
      console.error("Preparation error:", err);
      setError(
        "Something went wrong preparing your meditation. Please try again."
      );
      setTimeout(
        () => router.push(`/meditation/destination?entry_id=${entryId}`),
        2000
      );
    }
  };

  // Countdown timer
  useEffect(() => {
    if (countdown === null) return;

    if (countdown === 0) {
      router.push(`/meditation/session?entry_id=${entryId}`);
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, entryId, router]);

  // Error state
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
          // ✅ Countdown view (only shown when 100% ready)
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
          // ✅ Loading view with REAL progress
          <div className="space-y-6">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
            <h2 className="text-2xl font-semibold">
              Preparing Your Experience
            </h2>

            {/* Real progress bar */}
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

            {/* Show phase count when meditation is generated */}
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
