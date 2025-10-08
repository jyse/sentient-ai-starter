"use client";
import PlanetBackground from "@/components/visuals/PlanetBackground";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-brand text-white p-8">
      <PlanetBackground />

      <div className="max-w-3xl mx-auto space-y-6 p-10 bg-white/4 rounded-xl mt-6">
        <h1 className="text-3xl font-bold mb-4">🔒 Privacy Policy</h1>
        <p>
          We care about your privacy. This app only stores the data needed to
          provide your personalized meditations.
        </p>

        <section>
          <h2 className="text-xl font-semibold mb-2">What We Store</h2>
          <ul className="list-disc list-inside space-y-1 text-gray-300">
            <li>Your login (email & password managed by Supabase Auth).</li>
            <li>
              Mood check-ins: your selected emotion and any notes you choose to
              write.
            </li>
            <li>Meditation stats like sessions completed and duration.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">What We Send</h2>
          <p className="text-gray-300">
            To create your guided meditations, your mood and notes are sent
            anonymously to OpenAI. They never receive your email, account info,
            or any identifiers. Supabase Auth manages your password securely —
            we never see or store it. All data is encrypted in transit and at
            rest.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">Who Can See It</h2>
          <p className="text-gray-300">
            Only you, when logged in. Our database uses row-level security so
            other users cannot access your entries.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">How Long We Keep It</h2>
          <p className="text-gray-300">
            Your data is stored until you delete your account. In future
            versions we may add automatic clean-up options.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">Your Rights</h2>
          <p className="text-gray-300">
            You can delete your account and data anytime. For the demo, contact
            us at <span className="text-purple-300">support@example.com</span>.
          </p>
        </section>
      </div>
    </div>
  );
}
