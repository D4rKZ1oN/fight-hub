import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getMMAProvider } from "@/lib/providers";
import { rateLimit } from "@/lib/api/rateLimit";
export async function GET(req:NextRequest){const limited=rateLimit(req);if(limited)return limited;const q=req.nextUrl.searchParams.get("q");try{if(q){const parsed=z.string().trim().min(2).max(80).safeParse(q);if(!parsed.success)return NextResponse.json({error:"Búsqueda inválida"},{status:400});return NextResponse.json(await getMMAProvider().searchFighters(parsed.data))}const page=z.coerce.number().int().min(0).max(300).catch(0).parse(req.nextUrl.searchParams.get("page")??0);const division=req.nextUrl.searchParams.get("division")??undefined;return NextResponse.json(await getMMAProvider().getFighters(page,division))}catch{return NextResponse.json({error:"No pudimos cargar esta información."},{status:502})}}
