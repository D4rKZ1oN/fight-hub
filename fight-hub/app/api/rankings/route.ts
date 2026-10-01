import { NextRequest, NextResponse } from "next/server";
import { getMMAProvider } from "@/lib/providers";
import { rateLimit } from "@/lib/api/rateLimit";
export async function GET(req:NextRequest){const limited=rateLimit(req);if(limited)return limited;try{return NextResponse.json(await getMMAProvider().getRankings())}catch{return NextResponse.json({error:"No pudimos cargar esta información."},{status:502})}}
