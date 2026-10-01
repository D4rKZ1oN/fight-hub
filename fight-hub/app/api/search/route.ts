import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getMMAProvider } from "@/lib/providers";
import { rateLimit } from "@/lib/api/rateLimit";
export async function GET(req:NextRequest){const limited=rateLimit(req,40);if(limited)return limited;const parsed=z.string().trim().min(2).max(80).safeParse(req.nextUrl.searchParams.get("q")??"");if(!parsed.success)return NextResponse.json({fighters:[],events:[]});try{return NextResponse.json(await getMMAProvider().search(parsed.data))}catch{return NextResponse.json({error:"No pudimos cargar esta información."},{status:502})}}
