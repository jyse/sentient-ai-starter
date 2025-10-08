"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Heart, Sparkles, Eye, EyeOff } from "lucide-react";
import PlanetBackground from "../../../components/visuals/PlanetBackground";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleAuth = async (
    event: React.FormEvent<HTMLFormElement>,
    isSignUp: boolean
  ) => {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`
          }
        });

        if (error) throw error;

        console.log("✅ Account has been created! Check your email 📩");
        toast.success("Welcome to your wellness journey!", {
          description:
            "Your account has been created. Check your email to verify your account."
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;

        console.log("👋 Welcome back signing in!");
        toast.success("Welcome back!", {
          description: "Ready to continue your emotional wellness journey?"
        });

        window.location.href = "/";
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.log("👹👹👹 Something went wrong. Signup or Login failed.");
        toast.error(isSignUp ? "Signup failed" : "Login failed", {
          description:
            error.message || "Something went wrong. Please try again."
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-brand">
      <PlanetBackground />
      <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 mb-6">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Mindful AI Companion</span>
            </div>
            <h1 className="text-4xl font-bold mb-2 text-white">
              Welcome to{" "}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Sentient AI
              </span>
            </h1>
            <p className="text-gray-400">
              Your personal AI companion for emotional wellness
            </p>
          </div>
          <Card className="border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/50">
                <Heart className="w-8 h-8 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6 bg-white/5">
                  <TabsTrigger
                    value="signin"
                    className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-white text-gray-400"
                  >
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger
                    value="signup"
                    className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-white text-gray-400"
                  >
                    Sign Up
                  </TabsTrigger>
                </TabsList>

                {/* Sign In Form */}
                <TabsContent value="signin">
                  <form
                    onSubmit={(e) => handleAuth(e, false)}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-white">
                        Email
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="you@example.com"
                        required
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-white">
                        Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          required
                          minLength={6}
                          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full mt-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                      disabled={loading}
                    >
                      {loading ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>
                </TabsContent>

                {/* Sign Up Form */}
                <TabsContent value="signup">
                  <form
                    onSubmit={(e) => handleAuth(e, true)}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="text-white">
                        Email
                      </Label>
                      <Input
                        id="signup-email"
                        name="email"
                        type="email"
                        placeholder="you@example.com"
                        required
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="text-white">
                        Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="signup-password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a secure password"
                          required
                          minLength={6}
                          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full mt-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                      disabled={loading}
                    >
                      {loading ? "Creating account..." : "Begin Journey"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-gray-400 mt-6">
            By continuing, you agree to embark on a journey of self-discovery
            and emotional wellness.
          </p>
        </div>
      </div>
    </div>
  );
}
