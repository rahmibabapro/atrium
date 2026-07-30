import type { Localized } from "@/lib/site-types";

export type RadioStation = {
  id: string;
  name: Localized;
  tagline?: Localized;
  genre?: string;
  streamUrl: string;
  format?: "mp3" | "aac" | "ogg" | "hls";
  /** Optional now-playing JSON (SomaFM songhistory or Icecast status-json). */
  statusUrl?: string;
  artwork?: string;
};

export type RadioConfig = {
  dock?: boolean;
  title: Localized;
  lead?: Localized;
  stations: RadioStation[];
};
