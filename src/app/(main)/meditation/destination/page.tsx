"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import {
  getDestinationEmotionsFrom,
  getEmotionMetadata
} from "@/lib/emotionMap";
import PlanetBackground from "@/components/visuals/PlanetBackground";
import NavigationButtons from "@/components/ui/NavigationButtons";

export default function MeditationDestinationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const entryId = searchParams.get("entry_id");

  const [checkedInMood, setCheckedInMood] = useState<string | null>(null);
  const [selectedDestinationMood, setSelectedDestinationMood] = useState<
    string | null
  >(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [fetchingMood, setFetchingMood] = useState(true);
  const [contentVisible, setContentVisible] = useState(false);

  useEffect(() => {
    const fetchCheckedInMood = async () => {
      if (!entryId) {
        console.log("👹 Missing entry information. Please start over");
        setFeedback("Missing entry information. Please start over.");
        setFetchingMood(false);
        return;
      }

      const { data, error } = await supabase
        .from("mood_entries")
        .select("checked_in_mood, destination_mood")
        .eq("id", entryId)
        .single();

      if (error) {
        console.error("👹 Error fetching mood entry:", error);
        setFeedback("Couldn't load your check-in. Please try again.");
        setFetchingMood(false);
      } else if (data) {
        setCheckedInMood(data.checked_in_mood);
        if (data.destination_mood) {
          setSelectedDestinationMood(data.destination_mood);
        }
        setFetchingMood(false);

        setTimeout(() => {
          setContentVisible(true);
        }, 100);
      }
    };
    fetchCheckedInMood();
  }, [entryId]);

  const handleSubmit = async () => {
    if (!selectedDestinationMood || !entryId) return;
    if (loading) return;
    setLoading(true);

    const { error } = await supabase
      .from("mood_entries")
      .update({ destination_mood: selectedDestinationMood })
      .eq("id", entryId);

    if (error) {
      console.error("Error updating destination mood:", error);
      setFeedback("Something went wrong. Please try again.");
      setLoading(false);
    } else {
      console.log("💫 Your meditation is being prepared!");
      router.push(`/meditation/ready?entry_id=${entryId}`);
    }
  };

  if (fetchingMood) {
    return (
      <div className="min-h-screen bg-brand text-white relative overflow-hidden">
        <PlanetBackground />
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-lg">Preparing next step...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!entryId || !checkedInMood) {
    return (
      <div className="min-h-screen bg-brand text-white relative overflow-hidden">
        <PlanetBackground />
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center gap-4">
          <p>We could not find your check-in.</p>
          <Button onClick={() => router.push("/check-in")}>Start Over</Button>
        </div>
      </div>
    );
  }

  const availableDestinationMoods = getDestinationEmotionsFrom(checkedInMood);

  return (
    <div className="min-h-screen bg-brand text-white relative overflow-hidden">
      <PlanetBackground />
      <div
        className={`relative z-10 min-h-screen flex flex-col items-center justify-center p-8 transition-opacity duration-700 ${
          contentVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <h2 className="text-2xl font-semibold mb-2 text-center">
          Choose Your Destination
        </h2>
        <p className="text-gray-400 text-sm mb-4 text-center max-w-md">
          We&apos;ll guide you gently, helping you shift from your current mood
          toward a calmer, lighter state.
        </p>
        <p className="text-gray-400 text-sm mb-6 text-center max-w-md">
          You are feeling{" "}
          <span className="text-white font-medium">{checkedInMood}</span> right
          now. Choose the feeling you&apos;d like this meditation to guide you
          toward.
        </p>

        {/* Emoji Preview */}
        <div className="flex items-center gap-2 mb-8 text-lg">
          <span>{getEmotionMetadata(checkedInMood)?.emoji}</span>
          <span className="text-gray-400">→</span>
          {selectedDestinationMood ? (
            <span>{getEmotionMetadata(selectedDestinationMood)?.emoji}</span>
          ) : (
            <span className="text-gray-600">?</span>
          )}
        </div>

        {/* Destination Mood Options */}
        <div className="flex gap-4 mb-8 flex-wrap justify-center max-w-2xl">
          {availableDestinationMoods.map((destinationOption) => {
            const display = getEmotionMetadata(destinationOption);
            return (
              <button
                key={destinationOption}
                onClick={() => setSelectedDestinationMood(destinationOption)}
                aria-pressed={selectedDestinationMood === destinationOption}
                className={`
                  relative p-6 rounded-2xl border-2 transition-all duration-300 min-w-[140px]
                  ${
                    selectedDestinationMood === destinationOption
                      ? "bg-gray-800 border-purple-500 scale-105"
                      : "bg-gray-900/50 border-gray-700 hover:bg-gray-800/70 hover:border-gray-600"
                  }
                `}
              >
                <div
                  className={`w-12 h-12 ${display.color} rounded-full flex items-center justify-center mb-3 mx-auto`}
                >
                  <span className="text-xl">{display.emoji}</span>
                </div>
                <h3 className="font-semibold mb-1">{display.label}</h3>
                <p className="text-xs text-gray-400">{display.description}</p>
              </button>
            );
          })}
        </div>

        {/* Feedback Message */}
        {feedback && <p className="text-sm text-red-300 mb-4">{feedback}</p>}

        {/* Navigation Buttons */}
        <div className="min-w-[490px]">
          <NavigationButtons
            onBack={() => router.push(`/check-in?entry_id=${entryId}`)}
            onNext={handleSubmit}
            nextLabel="Guide Me"
            backLabel="Back"
            disabled={!selectedDestinationMood || loading}
          />
        </div>
      </div>

      {/* ✅ Add custom animation styles */}
      {/* <style jsx global>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
        }
      `}</style> */}

      {/* Loading Overlay - Shows during navigation to ready page */}
      {loading && (
        <div className="fixed inset-0 z-50 bg-brand/95 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-lg">Preparing your meditation...</p>
          </div>
        </div>
      )}
    </div>
  );
}
