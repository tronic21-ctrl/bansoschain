import { NextRequest, NextResponse } from "next/server";

const ALLOWED_HOSTS = ["gist.githubusercontent.com"];

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("url");
  if (!raw) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  if (target.protocol !== "https:" || !ALLOWED_HOSTS.includes(target.hostname)) {
    return NextResponse.json({ error: "Host not allowed" }, { status: 403 });
  }

  try {
    const res = await fetch(target.toString(), { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) {
      return NextResponse.json({ error: `Upstream ${res.status}` }, { status: 502 });
    }
    const text = await res.text();
    return NextResponse.json({ content: text.slice(0, 4000) });
  } catch {
    return NextResponse.json({ error: "Fetch gagal" }, { status: 502 });
  }
}
