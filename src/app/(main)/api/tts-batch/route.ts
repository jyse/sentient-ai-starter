import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

export const dynamic = "force-dynamic"; // ensure Node runtime

// ---- CONFIG ----
const BUCKET = "sentient-audio"; // Supabase bucket name
const SIGN_URL_SECONDS = 60 * 60; // 1 hour signed URLs

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
});

type PhaseIn = { text: string };

function badRequest(msg: string) {
  return NextResponse.json({ error: msg }, { status: 400 });
}

export async function POST(req: Request) {
  try {
    // ---- Validation ----
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      return NextResponse.json(
        { error: "Server storage not configured" },
        { status: 500 }
      );
    }
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY missing" },
        { status: 500 }
      );
    }

    const body = (await req.json()) as {
      entryId?: string;
      phases?: PhaseIn[];
      voice?: string; // optional override
      model?: string; // optional override
      reupload?: boolean; // future support for re-generation
    };

    const entryId = body.entryId?.trim();
    const phases = body.phases ?? [];
    const voice = body.voice || "alloy";
    const model = body.model || "gpt-4o-mini-tts";

    if (!entryId) return badRequest("entryId is required");
    if (!Array.isArray(phases) || phases.length !== 6) {
      return badRequest("phases must be an array of 6 items");
    }
    if (
      phases.some(
        (p) => !p || typeof p.text !== "string" || p.text.trim().length === 0
      )
    ) {
      return badRequest("Each phase must have non-empty text");
    }
    if (phases.some((p) => p.text.length > 2000)) {
      return badRequest("Phase text too long (2000 chars max)");
    }

    const urls: string[] = [];

    // ---- Process all 6 phases sequentially ----
    for (let i = 0; i < phases.length; i++) {
      const index = i + 1;
      const text = phases[i].text.trim();
      const path = `tts/${entryId}/phase-${index}.mp3`;

      // Generate speech with OpenAI
      const speech = await openai.audio.speech.create({
        model,
        voice,
        input: text
      });

      // Convert to Blob
      const arrayBuffer = await speech.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: "audio/mpeg" });

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, blob, {
          contentType: "audio/mpeg",
          upsert: true
        });

      if (uploadError) {
        return NextResponse.json(
          { error: `Upload failed for phase ${index}: ${uploadError.message}` },
          { status: 500 }
        );
      }

      // Create signed URL
      const { data: signed, error: signError } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(path, SIGN_URL_SECONDS);

      if (signError || !signed?.signedUrl) {
        return NextResponse.json(
          { error: `Signing failed for phase ${index}: ${signError?.message}` },
          { status: 500 }
        );
      }

      urls.push(signed.signedUrl);
    }

    // ✅ Return signed URLs for each phase
    return NextResponse.json({ urls }, { status: 200 });
  } catch (err) {
    console.error("tts-batch error:", err);

    // Fix for TypeScript strict mode: no `any`
    const message =
      err instanceof Error
        ? err.message
        : typeof err === "string"
        ? err
        : "Unknown error";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
