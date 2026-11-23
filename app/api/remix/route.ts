import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_FILE_BYTES = 30 * 1024 * 1024;
const ALLOWED_EXTENSIONS = /\.(mp3|wav|m4a)$/i;
const MODEL_VERSION = "0b769f28e399c7c30e4f2360691b9b11c294183e9ab2fd9f3398127b556c86d7";

function getReplicate() {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) throw new Error("REPLICATE_API_TOKEN is not configured. Add it to your deployment environment.");
  return new Replicate({ auth: token });
}

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const audio = form.get("audio");
    const prompt = String(form.get("prompt") || "").trim();
    const mixType = String(form.get("mixType") || "duo");
    const mode = String(form.get("mode") || "quick");
    const title = String(form.get("title") || "").trim();
    const lyrics = String(form.get("lyrics") || "").trim();
    const instrumental = String(form.get("instrumental") || "false") === "true";
    const vocal = String(form.get("vocal") || "");

    if (!(audio instanceof File)) return NextResponse.json({ error: "Upload an audio file to start." }, { status: 400 });
    if (!ALLOWED_EXTENSIONS.test(audio.name)) return NextResponse.json({ error: "Only MP3, WAV, and M4A files are supported." }, { status: 400 });
    if (audio.size === 0 || audio.size > MAX_FILE_BYTES) return NextResponse.json({ error: "Audio must be between 1 byte and 30 MB." }, { status: 400 });
    if (!prompt || prompt.length > 1200) return NextResponse.json({ error: "Add a remix description (up to 1,200 characters)." }, { status: 400 });
    if (mixType !== "duo" && mixType !== "wave") return NextResponse.json({ error: "Invalid remix mode." }, { status: 400 });
    if (lyrics.length > 3000 || title.length > 100) return NextResponse.json({ error: "Title or lyrics are too long." }, { status: 400 });

    const direction = [
      prompt,
      title ? `New track title: ${title}.` : "",
      lyrics ? `Lyric and vocal direction: ${lyrics}.` : "",
      instrumental ? "Prioritize an instrumental arrangement without a vocal lead." : "",
      vocal ? `Vocal direction: ${vocal}.` : "",
      mode === "custom" ? "Create a cohesive, polished, professionally produced reinterpretation." : ""
    ].filter(Boolean).join(" ");

    const replicate = getReplicate();
    const count = mixType === "duo" ? 2 : 1;
    const predictions = await Promise.all(Array.from({ length: count }, async (_, index) => {
      const variationPrompt = count === 2 ? `${direction} (Variation ${index + 1}: ${index === 0 ? "stay close to the core groove and melody" : "explore a more adventurous arrangement and production texture"}.)` : direction;
      return replicate.predictions.create({
        version: MODEL_VERSION,
        input: {
          prompt: variationPrompt,
          music_input: audio,
          model_version: "large",
          multi_band_diffusion: false,
          normalization_strategy: "loudness",
          output_format: "mp3",
          temperature: index === 0 ? 1 : 1.12,
          classifier_free_guidance: 3,
          large_chord_voca: false
        }
      });
    }));

    return NextResponse.json({
      predictions: predictions.map((prediction) => ({
        id: prediction.id,
        status: prediction.status,
        created_at: prediction.created_at
      }))
    }, { status: 202 });
  } catch (error) {
    console.error("[remix:create]", error);
    const message = error instanceof Error ? error.message : "Unable to start the remix.";
    return NextResponse.json({ error: message.includes("REPLICATE_API_TOKEN") ? message : `Remix request failed: ${message}` }, { status: 500 });
  }
}
