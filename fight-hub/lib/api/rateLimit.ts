import { NextRequest, NextResponse } from "next/server";
const buckets = new Map<string,{count:number;reset:number}>();
export function rateLimit(request:NextRequest,limit=60,windowMs=60000):NextResponse|null{const ip=request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()??"local";const now=Date.now();const current=buckets.get(ip);if(!current||current.reset<now){buckets.set(ip,{count:1,reset:now+windowMs});return null}if(current.count>=limit)return NextResponse.json({error:"Demasiadas solicitudes. Intenta de nuevo en un momento."},{status:429});current.count+=1;return null}
