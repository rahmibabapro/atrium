"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { RadioStation } from "@/lib/radio/types";

type RadioContextValue = {
  stations: RadioStation[];
  station: RadioStation | null;
  playing: boolean;
  loading: boolean;
  volume: number;
  muted: boolean;
  minimized: boolean;
  nowPlaying: string | null;
  sleepMinutes: number | null;
  setStationId: (id: string) => void;
  toggle: () => void;
  play: () => void;
  pause: () => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  setMinimized: (v: boolean) => void;
  setSleepMinutes: (m: number | null) => void;
};

const RadioContext = createContext<RadioContextValue | null>(null);

const STORAGE_KEY = "aom_radio_v1";

type Persisted = {
  stationId?: string;
  volume?: number;
  muted?: boolean;
  minimized?: boolean;
};

export function RadioProvider({
  stations,
  children,
}: {
  stations: RadioStation[];
  children: ReactNode;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [stationId, setStationIdState] = useState(stations[0]?.id || "");
  const [playing, setPlaying] = useState(false);
  const playingRef = useRef(false);
  const [loading, setLoading] = useState(false);
  const [volume, setVolumeState] = useState(0.7);
  const [muted, setMuted] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [nowPlaying, setNowPlaying] = useState<string | null>(null);
  const [sleepMinutes, setSleepMinutesState] = useState<number | null>(null);
  const sleepUntil = useRef<number | null>(null);

  const station = stations.find((s) => s.id === stationId) || stations[0] || null;

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const p = JSON.parse(raw) as Persisted;
      if (p.stationId && stations.some((s) => s.id === p.stationId)) {
        setStationIdState(p.stationId);
      }
      if (typeof p.volume === "number") setVolumeState(p.volume);
      if (typeof p.muted === "boolean") setMuted(p.muted);
      if (typeof p.minimized === "boolean") setMinimized(p.minimized);
    } catch {
      /* ignore */
    }
  }, [stations]);

  useEffect(() => {
    const payload: Persisted = { stationId, volume, muted, minimized };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      /* ignore */
    }
  }, [stationId, volume, muted, minimized]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.volume = muted ? 0 : volume;
  }, [volume, muted]);

  const attachStream = useCallback(
    async (next: RadioStation | null, shouldPlay: boolean) => {
      const el = audioRef.current;
      if (!el || !next) return;
      setLoading(true);
      try {
        const url = next.streamUrl.includes("?")
          ? `${next.streamUrl}&_=${Date.now()}`
          : `${next.streamUrl}?_=${Date.now()}`;
        el.src = url;
        el.load();
        if (shouldPlay) {
          await el.play();
          setPlaying(true);
        }
      } catch {
        setPlaying(false);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void attachStream(station, playingRef.current);
  }, [station?.id, attachStream, station]);

  useEffect(() => {
    if (!stationId) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetch(
          `/api/radio/now-playing?station=${encodeURIComponent(stationId)}`,
        );
        const data = (await res.json()) as {
          playing?: { raw?: string; title?: string; artist?: string } | null;
        };
        if (cancelled) return;
        const label =
          data.playing?.raw ||
          [data.playing?.artist, data.playing?.title]
            .filter(Boolean)
            .join(" — ") ||
          null;
        setNowPlaying(label);
      } catch {
        if (!cancelled) setNowPlaying(null);
      }
    };
    void tick();
    const id = window.setInterval(tick, 45_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [stationId]);

  useEffect(() => {
    if (!("mediaSession" in navigator) || !station) return;
    const name = (station.name.en || station.name.tr || station.id) as string;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: nowPlaying || name,
      artist: "Atrium Radio",
      album: station.genre || "Live",
    });
    navigator.mediaSession.setActionHandler("play", () => {
      void audioRef.current?.play().then(() => setPlaying(true));
    });
    navigator.mediaSession.setActionHandler("pause", () => {
      audioRef.current?.pause();
      setPlaying(false);
    });
  }, [station, nowPlaying]);

  useEffect(() => {
    if (sleepMinutes == null) {
      sleepUntil.current = null;
      return;
    }
    sleepUntil.current = Date.now() + sleepMinutes * 60_000;
    const id = window.setInterval(() => {
      if (sleepUntil.current && Date.now() >= sleepUntil.current) {
        audioRef.current?.pause();
        setPlaying(false);
        setSleepMinutesState(null);
        sleepUntil.current = null;
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [sleepMinutes]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onError = () => {
      if (!playingRef.current || !station) return;
      window.setTimeout(() => {
        void attachStream(station, true);
      }, 2500);
    };
    el.addEventListener("error", onError);
    return () => el.removeEventListener("error", onError);
  }, [station, attachStream]);

  const value: RadioContextValue = {
    stations,
    station,
    playing,
    loading,
    volume,
    muted,
    minimized,
    nowPlaying,
    sleepMinutes,
    setStationId: (id) => {
      setStationIdState(id);
      setPlaying(true);
      const next = stations.find((s) => s.id === id) || null;
      void attachStream(next, true);
    },
    toggle: () => {
      const el = audioRef.current;
      if (!el || !station) return;
      if (playing) {
        el.pause();
        setPlaying(false);
      } else {
        setLoading(true);
        void el
          .play()
          .then(() => setPlaying(true))
          .catch(() => {
            void attachStream(station, true);
          })
          .finally(() => setLoading(false));
      }
    },
    play: () => {
      const el = audioRef.current;
      if (!el) return;
      void el.play().then(() => setPlaying(true));
    },
    pause: () => {
      audioRef.current?.pause();
      setPlaying(false);
    },
    setVolume: (v) => setVolumeState(Math.min(1, Math.max(0, v))),
    toggleMute: () => setMuted((m) => !m),
    setMinimized,
    setSleepMinutes: (m) => setSleepMinutesState(m),
  };

  return (
    <RadioContext.Provider value={value}>
      <audio ref={audioRef} preload="none" />
      {children}
    </RadioContext.Provider>
  );
}

export function useRadio() {
  const ctx = useContext(RadioContext);
  if (!ctx) throw new Error("useRadio must be used within RadioProvider");
  return ctx;
}
