import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) return NextResponse.json({ error: "REPLICATE_API_TOKEN is not configured." }, { status: 503 });
  const { id } = await context.params;
  if (!/^[a-zA-Z0-9_-]{8,100}$/.test(id)) return NextResponse.json({ error: "Invalid prediction ID." }, { status: 400 });
  try {
    const replicate = new Replicate({ auth: token });
    const prediction = await replicate.predictions.get(id);
    return NextResponse.json({
      id: prediction.id,
      status: prediction.status,
      output: prediction.output ?? null,
      error: prediction.error ?? null,
      logs: prediction.logs ?? null,
      started_at: prediction.started_at ?? null,
      completed_at: prediction.completed_at ?? null
    }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("[remix:status]", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not retrieve prediction." }, { status: 502 });
  }
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) return NextResponse.json({ error: "REPLICATE_API_TOKEN is not configured." }, { status: 503 });
  const { id } = await context.params;
  if (!/^[a-zA-Z0-9_-]{8,100}$/.test(id)) return NextResponse.json({ error: "Invalid prediction ID." }, { status: 400 });
  try {
    const replicate = new Replicate({ auth: token });
    await replicate.predictions.cancel(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[remix:cancel]", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not cancel prediction." }, { status: 502 });
  }
}
