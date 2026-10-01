import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getMMAProvider } from "@/lib/providers";
import { rateLimit } from "@/lib/api/rateLimit";
export async function GET(req:NextRequest){const limited=rateLimit(req);if(limited)return limited;const parsed=z.coerce.number().int().min(1).max(20).safeParse(req.nextUrl.searchParams.get("limit")??8);if(!parsed.success)return NextResponse.json({error:"Parámetro inválido"},{status:400});try{return NextResponse.json(await getMMAProvider().getUpcomingEvents(parsed.data))}catch{return NextResponse.json({error:"No pudimos cargar esta información."},{status:502})}}
