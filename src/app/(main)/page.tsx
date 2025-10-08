"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import PlanetBackground from "@/components/visuals/PlanetBackground";
import { GUIDED_MEDITATION_PHASES } from "@/lib/constants";
import { NICK_NAMES } from "@/lib/constants";

export default function MainPage() {
  const [user, setUser] = useState<User | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const initUser = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const name =
          user.user_metadata?.name ||
          NICK_NAMES[Math.floor(Math.random() * NICK_NAMES.length)];
        setUserName(name);
        console.log(`✨Hi ${name}, wonderful to have you here!`);
      }

      setLoading(false);
    };

    initUser();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    console.log("👋 Signing out succesfully! Come back soon, bye!");
    toast.success("Signed out successfully", {
      description: "Come back soon for your next journey!"
    });

    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  if (loading) {
    console.log("🌀Loading...");
    return (
      <div className="min-h-screen bg-brand flex items-center justify-center">
        <PlanetBackground />
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand text-white relative overflow-hidden">
      <PlanetBackground />
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-8">
        <div className="mb-6 px-4 py-2 bg-purple-800/50 rounded-full border border-purple-400/30 text-sm">
          ✨ Emotional Wellness Journey
        </div>
        <h1 className="text-5xl font-bold mb-4 text-center">
          Welcome back, <span className="text-purple-300">{userName}</span>
        </h1>
        <p className="text-gray-300 text-center max-w-xl mb-6">
          Ready to explore your inner landscape? Let Sentient guide you through
          a personalized meditation crafted just for your emotional state.
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 max-w-5xl mx-auto mb-6">
          {GUIDED_MEDITATION_PHASES.map((phase, index) => (
            <div
              key={phase.name}
              className="card-zen p-4 text-center transform hover:scale-105 transition-zen"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div
                className={`w-12 h-12 ${phase.color} rounded-full mx-auto mb-3 shadow-soft`}
              ></div>
              <h3 className="font-semibold text-sm">{phase.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {phase.description}
              </p>
            </div>
          ))}
        </div>
        <Button
          onClick={() => router.push("/check-in")}
          size="lg"
          className="bg-purple-600 hover:bg-purple-500 text-white px-12 py-6 text-lg rounded-full mb-8"
        >
          ❤️ Begin Your Journey
        </Button>
        <p className="text-sm text-gray-400 text-center max-w-md mb-8">
          Each journey is unique. Sentient will personalize your experience
          based on how you are feeling today.
        </p>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
