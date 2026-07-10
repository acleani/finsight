import { NextRequest, NextResponse } from "next/server";
import { search } from "@/lib/providers";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const results = await search().search(q);
  return NextResponse.json({ results });
}
