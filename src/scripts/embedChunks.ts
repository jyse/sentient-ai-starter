import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

// ✅ Load environment variables
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // service role = needed for writes
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
});

async function embedBatch() {
  // Fetch up to 50 rows where embedding is still missing
  const { data: rows, error } = await supabase
    .from("content_chunks")
    .select("id, text")
    .is("embedding", null)
    .limit(50);

  if (error) throw error;
  if (!rows || rows.length === 0) {
    console.log("🎉 All rows are embedded!");
    return false; // stop loop
  }

  console.log(`🔎 Found ${rows.length} rows to embed...`);

  // Create embeddings for each row
  for (const row of rows) {
    try {
      const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: row.text
      });

      const embedding = embeddingResponse.data[0].embedding;

      const { error: upError } = await supabase
        .from("content_chunks")
        .update({ embedding })
        .eq("id", row.id);

      if (upError) {
        console.error("❌ Failed to update row", row.id, upError.message);
      } else {
        console.log(`✅ Embedded row ${row.id}`);
      }
    } catch {
      console.error("⚠️ Embedding failed for row", row.id, error);
    }
  }

  return true; // continue loop
}

async function main() {
  console.log(`✅ Using Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);

  let keepGoing = true;
  while (keepGoing) {
    keepGoing = await embedBatch();
    if (keepGoing) {
      console.log("⏳ Waiting 3s before next batch...");
      await new Promise((r) => setTimeout(r, 3000)); // small delay for safety
    }
  }

  console.log("🎉 Done embedding all rows!");
}

main().catch((err) => {
  console.error("Fatal error:", err);
});
