import { NextResponse } from "next/server";
import { z } from "zod";
import { radioStationById } from "@/lib/radio/config";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  station: z.string().min(1).max(80),
});

type NowPlaying = {
  title?: string;
  artist?: string;
  album?: string;
  raw?: string;
};

async function fromSomaHistory(url: string): Promise<NowPlaying | null> {
  const res = await fetch(url, {
    next: { revalidate: 30 },
    headers: { accept: "application/json" },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as Array<{
    title?: string;
    artist?: string;
    album?: string;
  }>;
  const row = data?.[0];
  if (!row) return null;
  return {
    title: row.title,
    artist: row.artist,
    album: row.album,
    raw: [row.artist, row.title].filter(Boolean).join(" — "),
  };
}

async function fromIcecastStatus(url: string): Promise<NowPlaying | null> {
  const res = await fetch(url, {
    next: { revalidate: 20 },
    headers: { accept: "application/json" },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    icestats?: {
      source?:
        | { title?: string; artist?: string; server_name?: string }
        | Array<{ title?: string; artist?: string; server_name?: string }>;
    };
  };
  const source = data.icestats?.source;
  const row = Array.isArray(source) ? source[0] : source;
  if (!row) return null;
  const title = row.title || row.server_name;
  return {
    title,
    artist: row.artist,
    raw: [row.artist, title].filter(Boolean).join(" — ") || title,
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const parsed = querySchema.safeParse({ station: searchParams.get("station") });
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const station = radioStationById(parsed.data.station);
  if (!station?.statusUrl) {
    return NextResponse.json({
      ok: true,
      playing: null as NowPlaying | null,
    });
  }

  try {
    const url = station.statusUrl;
    const playing = url.includes("songhistory.json")
      ? await fromSomaHistory(url)
      : await fromIcecastStatus(url);
    return NextResponse.json({ ok: true, playing });
  } catch {
    return NextResponse.json({ ok: true, playing: null });
  }
}
