import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getMMAProvider } from "@/lib/providers";
import { rateLimit } from "@/lib/api/rateLimit";
export async function GET(req:NextRequest,{params}:{params:Promise<{eventId:string}>}){const limited=rateLimit(req);if(limited)return limited;const {eventId}=await params;if(!z.string().regex(/^\d+$/).safeParse(eventId).success)return NextResponse.json({error:"ID inválido"},{status:400});try{const data=await getMMAProvider().getEventFightCard(eventId);return data?NextResponse.json(data):NextResponse.json({error:"No encontrado"},{status:404})}catch{return NextResponse.json({error:"No pudimos cargar esta información."},{status:502})}}
