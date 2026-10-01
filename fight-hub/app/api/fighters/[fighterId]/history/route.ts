import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getMMAProvider } from "@/lib/providers";
import { rateLimit } from "@/lib/api/rateLimit";

export async function GET(req: NextRequest, { params }: { params: Promise<{ fighterId: string }> }) {
  const limited = rateLimit(req);
  if (limited) return limited;
  const { fighterId } = await params;
  if (!z.string().regex(/^[a-z0-9-]+$/i).safeParse(fighterId).success) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }
  try {
    const data = await getMMAProvider().getFighterHistory(fighterId);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "No pudimos cargar esta información." }, { status: 502 });
  }
}
