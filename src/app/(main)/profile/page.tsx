"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import PlanetBackground from "@/components/visuals/PlanetBackground";
import NavigationButtons from "@/components/ui/NavigationButtons";

type UserProfile = {
  email: string;
  username: string;
};

type MeditationStats = {
  sessionsComplete: number;
  totalMinutes: number;
};

type RecentCheckIn = {
  date: string;
  emotion: string;
  destination_mood: string | null;
};

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<MeditationStats>({
    sessionsComplete: 0,
    totalMinutes: 0
  });
  const [recentCheckIns, setRecentCheckIns] = useState<RecentCheckIn[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setProfile({
        email: user.email || "",
        username: user.email?.split("@")[0] || "user"
      });

      const { data: sessions } = await supabase
        .from("meditation_sessions")
        .select("duration_seconds, completed")
        .eq("user_id", user.id)
        .eq("completed", true);

      if (sessions) {
        const totalSeconds = sessions.reduce(
          (sum, session) => sum + (session.duration_seconds || 0),
          0
        );
        setStats({
          sessionsComplete: sessions.length,
          totalMinutes: Math.round(totalSeconds / 60)
        });
      }

      const { data: checkIns } = await supabase
        .from("mood_entries")
        .select("created_at, checked_in_mood, destination_mood")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (checkIns) {
        setRecentCheckIns(
          checkIns.map((entry) => ({
            date: new Date(entry.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric"
            }),
            emotion: entry.checked_in_mood,
            destination_mood: entry.destination_mood
          }))
        );
      }

      setLoading(false);
    };

    fetchProfileData();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-brand flex items-center justify-center text-white">
        <PlanetBackground />
        <p>Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand text-white relative overflow-hidden">
      <PlanetBackground />

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-4xl space-y-6 mb-10">
          {/* Profile Header */}
          <div className="w-full bg-white/[0.05] border border-white/[0.08] backdrop-blur-xl rounded-3xl p-8 shadow-[0_0_40px_rgba(0,0,0,0.4)]">
            <div className="text-center">
              <div className="w-24 h-24 bg-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl">
                👤
              </div>
              <h1 className="text-3xl font-bold mb-2">{profile?.username}</h1>
              <p className="text-gray-400">{profile?.email}</p>
            </div>
          </div>

          {/* Stats & Preferences Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Meditation Stats */}
            <div className="bg-white/[0.05] border border-white/[0.08] backdrop-blur-xl rounded-3xl p-8 shadow-[0_0_40px_rgba(0,0,0,0.4)]">
              <div className="bg-gradient-to-br from-black/40 to-black/20 border border-white/[0.15] rounded-2xl p-6 h-full flex flex-col">
                <h2 className="text-xl font-semibold mb-5 flex items-center gap-2">
                  📊 Meditation Stats
                </h2>
                <div className="space-y-6 flex-1 flex flex-col justify-center">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Sessions Complete</span>
                    <span className="text-2xl font-bold text-white">
                      {stats.sessionsComplete}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Total Minutes</span>
                    <span className="text-2xl font-bold text-orange-500">
                      {stats.totalMinutes}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Meditation Preferences */}
            <div className="bg-white/[0.05] border border-white/[0.08] backdrop-blur-xl rounded-3xl p-8 shadow-[0_0_40px_rgba(0,0,0,0.4)]">
              <div className="bg-gradient-to-br from-black/40 to-black/20 border border-white/[0.15] rounded-2xl p-6">
                <h2 className="text-xl font-semibold mb-5 flex items-center gap-2">
                  ⚙️ Meditation Preferences
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-300 font-medium block mb-2">
                      Voice Style
                    </label>
                    <div className="flex gap-2">
                      {["Gentle", "Warm", "Neutral"].map((style) => (
                        <button
                          key={style}
                          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                            style === "Warm"
                              ? "bg-purple-600 text-white"
                              : "bg-black/40 border border-white/10 text-gray-400 hover:bg-white/[0.08]"
                          }`}
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-300 font-medium block mb-2">
                      Session Duration
                    </label>
                    <div className="flex gap-2">
                      {["10-15 min", "15-20 min", "20-25 min"].map(
                        (duration) => (
                          <button
                            key={duration}
                            className={`flex-1 px-2 py-2 rounded-lg text-sm font-medium transition-all ${
                              duration === "15-20 min"
                                ? "bg-purple-600 text-white"
                                : "bg-black/40 border border-white/10 text-gray-400 hover:bg-white/[0.08]"
                            }`}
                          >
                            {duration}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Check-ins */}
          <div className="bg-white/[0.05] border border-white/[0.08] backdrop-blur-xl rounded-3xl p-8 shadow-[0_0_40px_rgba(0,0,0,0.4)]">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              ❤️ Recent Emotional Check-ins
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {recentCheckIns.length > 0 ? (
                recentCheckIns.map((checkIn, index) => (
                  <div
                    key={index}
                    className="bg-black/30 border border-white/10 rounded-xl p-4 text-center hover:bg-white/[0.08] transition-colors"
                  >
                    <p className="text-sm text-gray-400 mb-2">{checkIn.date}</p>
                    <p className="font-semibold text-white capitalize">
                      {checkIn.emotion}
                    </p>
                    {checkIn.destination_mood && (
                      <p className="text-xs text-gray-500 mt-1">
                        → {checkIn.destination_mood}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-500 col-span-full text-center py-4">
                  No check-ins yet. Start your first meditation!
                </p>
              )}
            </div>
          </div>

          {/* Data & Privacy Section */}
          <div className="bg-white/[0.05] border border-white/[0.08] backdrop-blur-xl rounded-3xl p-8 shadow-[0_0_40px_rgba(0,0,0,0.4)]">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              🔒 Data & Privacy
            </h2>
            <div className="space-y-3 text-sm text-gray-300">
              <p>
                <strong>What we store:</strong> Your moods and notes are saved
                privately in your account (only visible to you).
              </p>
              <p>
                <strong>What we share:</strong> For personalized meditations,
                only your mood + note text may be sent to our AI service — never
                your identity (like your email).
              </p>
              <p>
                <strong>How long:</strong> Entries stay in your account until
                you delete them.
              </p>
            </div>
          </div>

          {/* Navigation Buttons - OUTSIDE all the cards */}

          {/* Match the content container */}
          <div className="flex items-center justify-between">
            <NavigationButtons
              onBack={async () => {
                await supabase.auth.signOut();
                router.push("/");
              }}
              onNext={() => router.push("/check-in")}
              nextLabel="New Meditation"
              backLabel="Go back to Home"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
