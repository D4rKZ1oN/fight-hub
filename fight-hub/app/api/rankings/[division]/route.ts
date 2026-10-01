import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getMMAProvider } from "@/lib/providers";
import { rateLimit } from "@/lib/api/rateLimit";
export async function GET(req:NextRequest,{params}:{params:Promise<{division:string}>}){const limited=rateLimit(req);if(limited)return limited;const {division}=await params;if(!z.string().min(2).max(80).safeParse(division).success)return NextResponse.json({error:"División inválida"},{status:400});try{const data=await getMMAProvider().getRankingsByDivision(division);return data?NextResponse.json(data):NextResponse.json({error:"No encontrado"},{status:404})}catch{return NextResponse.json({error:"No pudimos cargar esta información."},{status:502})}}
