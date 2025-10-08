import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

// ---- Types ----
type MatchChunkRow = {
  id: string;
  text: string;
  checked_in_mood: string;
  destination_mood: string;
  distance: number;
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

type GenerateBody = {
  checked_in_mood: string;
  destination_mood: string | null;
  note?: string | null;
};

// ---- Clients ----
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
});

// ---- Route ----
export async function POST(req: Request) {
  try {
    const { checked_in_mood, destination_mood, note }: GenerateBody =
      await req.json();

    // 1️⃣ Validation
    if (!checked_in_mood || !destination_mood) {
      return NextResponse.json(
        { error: "checked_in_mood and destination_mood are required" },
        { status: 400 }
      );
    }

    // 2️⃣ Embed the journey query

  
    // 3️⃣ Retrieve best-matching chunks via RPC

    if (rpcError) {
      console.error("❌ Supabase RPC error:", rpcError);
      return NextResponse.json({ error: rpcError.message }, { status: 500 });
    }

    const chunks: MatchChunkRow[] = (rpcData as MatchChunkRow[]) ?? [];

    // 4️⃣ Build inspiration lines

    // 5️⃣ Create prompt

    // 6️⃣ Generate meditation phases
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ]
    });

    let raw = completion.choices[0].message?.content?.trim() || "[]";

    // 7️⃣ Clean raw output (in case it contains code fences)
    if (raw.startsWith("```")) {
      raw = raw
        .replace(/^```json\n?/, "")
        .replace(/^```/, "")
        .replace(/```$/, "")
        .trim();
    }

    // 8️⃣ Parse safely
    let meditation: MeditationPhase[] = [];
    try {
      meditation = JSON.parse(raw);
    } catch (err) {
      console.error("❌ Failed to parse meditation JSON:", err, raw);
      return NextResponse.json(
        { error: "Invalid JSON returned from AI", raw },
        { status: 502 }
      );
    }

    // 9️⃣ Validate shape: must be an array of 6 phases
    if (!Array.isArray(meditation) || meditation.length !== 6) {
      console.error("❌ AI did not return 6 phases:", meditation);
      return NextResponse.json(
        { error: "AI did not return 6 valid phases", raw },
        { status: 502 }
      );
    }

    // 10️⃣ Normalize output
    const phases = (meditation as MeditationPhase[]).map((p, i) => ({
      phase: typeof p.phase === "string" ? p.phase : `Phase ${i + 1}`,
      text: typeof p.text === "string" ? p.text : "",
      theme: { duration: 30 }
    }));

    // ✅ Return the final phases
    return NextResponse.json(phases);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Server error";
    console.error("❌ generate/POST error:", e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
