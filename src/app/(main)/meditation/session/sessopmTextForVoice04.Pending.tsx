"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Pause, Play, SkipForward } from "lucide-react";
import PlanetBackground from "@/components/visuals/PlanetBackground";

const EMOTION_COLORS: Record<
  string,
  { hue: number; sat: number; light: number }
> = {
  sad: { hue: 210, sat: 60, light: 40 },
  anxious: { hue: 150, sat: 50, light: 45 },
  angry: { hue: 0, sat: 70, light: 50 },
  frustrated: { hue: 30, sat: 65, light: 48 },
  confused: { hue: 280, sat: 45, light: 50 },
  calm: { hue: 180, sat: 50, light: 55 },
  content: { hue: 45, sat: 70, light: 60 },
  peaceful: { hue: 240, sat: 40, light: 50 },
  grateful: { hue: 270, sat: 55, light: 58 },
  happy: { hue: 50, sat: 80, light: 65 }
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

type MoodEntry = {
  id: string;
  checked_in_mood: string;
  destination_mood: string;
  note: string | null;
};

type MeditationPhase = {
  phase: string;
  text: string;
  theme?: {
    duration?: number;
  };
};

function interpolateColor(
  from: { hue: number; sat: number; light: number },
  to: { hue: number; sat: number; light: number },
  progress: number
) {
  return {
    hue: from.hue + (to.hue - from.hue) * progress,
    sat: from.sat + (to.sat - from.sat) * progress,
    light: from.light + (to.light - from.light) * progress
  };
}

function toHSL(color: { hue: number; sat: number; light: number }) {
  return `hsl(${color.hue}, ${color.sat}%, ${color.light}%)`;
}

export default function MeditationSessionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const entryId = searchParams.get("entry_id");

  const [entry, setEntry] = useState<MoodEntry | null>(null);
  const [meditation, setMeditation] = useState<MeditationPhase[]>([]);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeInPhase, setTimeInPhase] = useState(0);
  const [totalTimeElapsed, setTotalTimeElapsed] = useState(0);
  const [textVisible, setTextVisible] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [initializing, setInitializing] = useState(true);

  const bgAudioRef = useRef<HTMLAudioElement | null>(null);
  const voiceAudioRef = useRef<HTMLAudioElement | null>(null);
  const ttsCacheRef = useRef<
    Record<number, { base64: string; duration: number }>
  >({});
  const blobUrlsRef = useRef<Record<number, string>>({});
  const currentPhaseRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    currentPhaseRef.current = currentPhase;
  }, [currentPhase]);

  const phase = meditation[currentPhase];

  useEffect(() => {
    setTextVisible(false);
    const t = setTimeout(() => setTextVisible(true), 200);
    return () => clearTimeout(t);
  }, [currentPhase]);

  // ✅ Load everything from localStorage
  useEffect(() => {
    const initSession = async () => {
      console.log("🎬 Starting session initialization...");

      if (!entryId) {
        console.log("❌ No entry ID found");
        router.push("/check-in");
        return;
      }

      const storedMeditation = localStorage.getItem("currentMeditation");
      const storedTTSCache = localStorage.getItem("ttsCache");

      console.log("📦 Stored meditation:", storedMeditation?.substring(0, 100));
      console.log("🎤 Stored TTS cache:", storedTTSCache?.substring(0, 100));

      if (!storedMeditation) {
        console.log("❌ No meditation found in localStorage");
        router.push(`/meditation/ready?entry_id=${entryId}`);
        return;
      }

      try {
        const parsedMeditation: MeditationPhase[] =
          JSON.parse(storedMeditation);
        console.log("✅ Parsed meditation:", parsedMeditation.length, "phases");
        setMeditation(parsedMeditation);

        if (storedTTSCache) {
          const parsedCache = JSON.parse(storedTTSCache);
          console.log(
            "✅ Parsed TTS cache:",
            Object.keys(parsedCache).length,
            "entries"
          );
          ttsCacheRef.current = parsedCache;
        } else {
          console.warn("⚠️ No TTS cache found!");
        }

        const { data, error } = await supabase
          .from("mood_entries")
          .select("id, checked_in_mood, destination_mood, note")
          .eq("id", entryId)
          .single();

        console.log("📊 Supabase response:", { data, error });

        if (data) {
          console.log("✅ Entry loaded:", data);
          setEntry(data);

          const file = MUSIC_MAP[data.destination_mood];
          console.log("🎵 Music file for", data.destination_mood, ":", file);

          if (file) {
            const music = new Audio(`/music/${file}`);
            music.loop = true;
            music.volume = 0.2;
            bgAudioRef.current = music;
            console.log("✅ Background music loaded");
          }
        } else {
          console.error("❌ No entry data returned");
        }

        setInitializing(false);
        console.log("✅ Session initialization complete!");
      } catch (err) {
        console.error("❌ Failed to load meditation:", err);
        router.push(`/meditation/ready?entry_id=${entryId}`);
      }
    };

    initSession();
  }, [entryId, router]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      bgAudioRef.current?.pause();
      if (voiceAudioRef.current) {
        voiceAudioRef.current.pause();
      }
      // Clean up all blob URLs
      Object.values(blobUrlsRef.current).forEach((url) => {
        URL.revokeObjectURL(url);
      });
    };
  }, []);

  // ✅ MODIFIED: Play narration - recreate blob URL from base64
  useEffect(() => {
    if (!isPlaying) return;

    if (voiceAudioRef.current) {
      voiceAudioRef.current.pause();
      voiceAudioRef.current = null;
    }

    const data = ttsCacheRef.current[currentPhase];
    console.log("🎤 Playing phase", currentPhase, "- has data:", !!data);

    if (data && data.base64) {
      try {
        // ✅ CHANGED: Recreate blob URL from base64
        const binary = atob(data.base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: "audio/mpeg" });
        const url = URL.createObjectURL(blob);

        // Store for cleanup
        blobUrlsRef.current[currentPhase] = url;

        const audio = new Audio(url);
        audio.volume = 0.9;
        voiceAudioRef.current = audio;
        audio
          .play()
          .then(() => console.log("✅ Audio playing for phase", currentPhase))
          .catch((err) => console.warn("❌ Audio play failed:", err));
      } catch (err) {
        console.error("❌ Failed to recreate audio from base64:", err);
      }
    } else {
      console.warn("⚠️ No TTS data for phase", currentPhase);
    }
  }, [currentPhase, isPlaying]);

  const completeMeditation = useCallback(async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsPlaying(false);
    setSessionComplete(true);

    bgAudioRef.current?.pause();
    voiceAudioRef.current?.pause();

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (user && entryId) {
      await supabase.from("meditation_sessions").insert([
        {
          user_id: user.id,
          mood_entry_id: entryId,
          completed: true,
          duration_seconds: totalTimeElapsed
        }
      ]);
    }

    setTimeout(() => router.push("/profile"), 2500);
  }, [entryId, totalTimeElapsed, router]);

  useEffect(() => {
    if (!isPlaying || meditation.length === 0) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setTotalTimeElapsed((prev) => prev + 1);

      setTimeInPhase((prev) => {
        const active = meditation[currentPhaseRef.current];
        const duration = active?.theme?.duration ?? 30;
        const next = prev + 1;

        if (next >= duration) {
          if (currentPhaseRef.current < meditation.length - 1) {
            setCurrentPhase((p) => {
              const n = p + 1;
              currentPhaseRef.current = n;
              return n;
            });
            return 0;
          } else {
            completeMeditation();
            return prev;
          }
        }
        return next;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, meditation, completeMeditation]);

  const togglePlayPause = () => {
    console.log("🎮 Toggle play/pause - current state:", isPlaying);
    setIsPlaying((p) => {
      const next = !p;
      if (next) {
        bgAudioRef.current?.play().catch(() => {});
        voiceAudioRef.current?.play().catch(() => {});
      } else {
        bgAudioRef.current?.pause();
        voiceAudioRef.current?.pause();
      }
      return next;
    });
  };

  const skipToNextPhase = () => {
    if (voiceAudioRef.current) {
      voiceAudioRef.current.pause();
      voiceAudioRef.current = null;
    }

    if (currentPhase < meditation.length - 1) {
      setCurrentPhase((p) => {
        const next = p + 1;
        currentPhaseRef.current = next;
        return next;
      });
      setTimeInPhase(0);
    } else {
      completeMeditation();
    }
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-brand flex items-center justify-center text-white">
        <PlanetBackground />
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg">Preparing your session...</p>
        </div>
      </div>
    );
  }

  if (!entry || !entry.destination_mood || !meditation.length) {
    console.error("❌ Missing data after initialization:", {
      hasEntry: !!entry,
      hasDestination: !!entry?.destination_mood,
      meditationLength: meditation.length
    });

    return (
      <div className="min-h-screen bg-brand flex flex-col items-center justify-center text-white gap-4">
        <PlanetBackground />
        <p>Something went wrong loading your meditation.</p>
        <Button
          onClick={() => router.push("/meditation/ready?entry_id=" + entryId)}
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (sessionComplete) {
    return (
      <div className="min-h-screen bg-brand flex flex-col items-center justify-center text-white">
        <PlanetBackground />
        <h2 className="text-4xl font-bold mb-4">Beautiful work</h2>
        <p className="text-gray-300">You completed your meditation.</p>
      </div>
    );
  }

  const currentColor =
    EMOTION_COLORS[entry.checked_in_mood] || EMOTION_COLORS.calm;
  const targetColor =
    EMOTION_COLORS[entry.destination_mood] || EMOTION_COLORS.peaceful;
  const phaseProgress = currentPhase / Math.max(1, meditation.length - 1);
  const interpolated = interpolateColor(
    currentColor,
    targetColor,
    phaseProgress
  );
  const backgroundColor = toHSL(interpolated);
  const phaseDuration = phase?.theme?.duration || 30;
  const phaseProgressPercent = (timeInPhase / phaseDuration) * 100;
  const totalProgress =
    ((currentPhase + timeInPhase / phaseDuration) / meditation.length) * 100;

  return (
    <>
      <style jsx global>{`
        @keyframes breathe {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.2;
          }
          50% {
            transform: scale(1.4);
            opacity: 0.5;
          }
        }
      `}</style>

      <div
        className="min-h-screen flex flex-col items-center justify-center text-white relative overflow-hidden transition-colors duration-2000"
        style={{ backgroundColor }}
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-white/10">
          <div
            className="h-full bg-white/60 transition-all duration-300"
            style={{ width: `${totalProgress}%` }}
          />
        </div>

        <div className="absolute top-8 text-sm opacity-60">
          Phase {currentPhase + 1} of {meditation.length}
        </div>

        <div className="max-w-2xl px-8 text-center space-y-8 relative">
          <h2
            className={`text-3xl font-semibold transition-opacity duration-1000 relative mt-64 ${
              textVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            {phase?.phase || "Meditation"}
          </h2>

          <p
            className={`text-xl leading-relaxed max-w-lg mx-auto transition-opacity duration-1500 delay-500 relative ${
              textVisible ? "opacity-90" : "opacity-0"
            }`}
          >
            {phase?.text}
          </p>

          <div className="pt-8 relative">
            <div className="w-64 h-2 bg-white/10 rounded-full mx-auto overflow-hidden">
              <div
                className="h-full bg-white/70 transition-all duration-300"
                style={{ width: `${phaseProgressPercent}%` }}
              />
            </div>
            <p className="text-sm text-white/60 mt-3 font-light">
              {Math.floor(timeInPhase)}s / {phaseDuration}s
            </p>
          </div>
        </div>

        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white/10 backdrop-blur-xl px-6 py-3 rounded-full border border-white/20 shadow-2xl">
          <button
            onClick={togglePlayPause}
            className="w-16 h-16 flex items-center justify-center bg-white/90 text-black rounded-full shadow-lg hover:scale-105 transition-all"
          >
            {isPlaying ? (
              <Pause size={28} fill="currentColor" />
            ) : (
              <Play size={28} fill="currentColor" className="ml-1" />
            )}
          </button>
          <button
            onClick={skipToNextPhase}
            className="w-12 h-12 flex items-center justify-center text-white bg-white/5 rounded-full border border-white/10 hover:bg-white/15 transition-all"
          >
            <SkipForward size={20} />
          </button>
          <div className="h-8 w-px bg-white/20" />
          <button
            onClick={completeMeditation}
            className="px-4 py-2 text-sm text-white/80 hover:text-white bg-white/5 rounded-full hover:bg-white/10 transition-all"
          >
            End Session
          </button>
        </div>
      </div>
    </>
  );
}
