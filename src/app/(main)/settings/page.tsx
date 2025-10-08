import { useState } from "react";

export default function PrivacySection() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-8 p-4 bg-gray-900/50 border border-gray-700 rounded-lg">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left font-medium text-purple-300"
      >
        Data & Privacy {open ? "▲" : "▼"}
      </button>

      {open && (
        <div className="mt-3 text-sm text-gray-300 space-y-2">
          <p>
            <strong>What we store:</strong> Your moods + notes are saved
            privately in your account (Supabase).
          </p>
          <p>
            <strong>What we share:</strong> For personalized meditations, only
            your mood + note text may be sent to our AI service — never your
            identity.
          </p>
          <p>
            <strong>How long:</strong> Entries stay in your account until you
            delete them.
          </p>
        </div>
      )}
    </div>
  );
}
