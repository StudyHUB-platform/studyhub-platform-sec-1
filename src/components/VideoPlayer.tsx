import { useCallback, useEffect, useRef, useState } from "react";
import {
  Maximize,
  Minimize,
  Pause,
  Play,
  Settings,
  Volume2,
  VolumeX,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/* Minimal typing for the YouTube IFrame API we use. */
type YTPlayer = {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (s: number, allow: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  setVolume: (v: number) => void;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  setPlaybackRate: (r: number) => void;
  getAvailablePlaybackRates: () => number[];
  setPlaybackQuality: (q: string) => void;
  getAvailableQualityLevels: () => string[];
  destroy: () => void;
};

declare global {
  interface Window {
    YT?: { Player: new (el: HTMLElement, opts: unknown) => YTPlayer; PlayerState: { PLAYING: number } };
    onYouTubeIframeAPIReady?: () => void;
  }
}

const QUALITY_LABELS: Record<string, string> = {
  auto: "تلقائي",
  tiny: "144p",
  small: "240p",
  medium: "360p",
  large: "480p",
  hd720: "720p",
  hd1080: "1080p",
  hd1440: "1440p",
  hd2160: "2160p",
  highres: "أعلى جودة",
};

function loadApi(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve();
  return new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    if (!document.getElementById("yt-iframe-api")) {
      const s = document.createElement("script");
      s.id = "yt-iframe-api";
      s.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(s);
    }
  });
}

const fmt = (s: number) => {
  if (!Number.isFinite(s) || s < 0) s = 0;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  const pad = (n: number) => String(n).padStart(2, "0");
  return h ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
};

export function VideoPlayer({ videoId, title }: { videoId: string; title: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [muted, setMuted] = useState(false);
  const [rate, setRate] = useState(1);
  const [rates, setRates] = useState<number[]>([0.5, 1, 1.25, 1.5, 2]);
  const [qualities, setQualities] = useState<string[]>([]);
  const [quality, setQuality] = useState("auto");
  const [isFull, setIsFull] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void loadApi().then(() => {
      if (cancelled || !mountRef.current || !window.YT) return;
      playerRef.current = new window.YT.Player(mountRef.current, {
        videoId,
        playerVars: { controls: 0, modestbranding: 1, rel: 0, playsinline: 1, disablekb: 0 },
        events: {
          onReady: () => {
            setReady(true);
            const p = playerRef.current;
            if (!p) return;
            setDuration(p.getDuration());
            setRates(p.getAvailablePlaybackRates());
            setQualities(["auto", ...p.getAvailableQualityLevels()]);
          },
          onStateChange: (e: { data: number }) => {
            setPlaying(e.data === 1);
            const p = playerRef.current;
            if (p) setDuration(p.getDuration());
          },
        },
      });
    });
    return () => {
      cancelled = true;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [videoId]);

  useEffect(() => {
    const id = window.setInterval(() => {
      const p = playerRef.current;
      if (!p) return;
      setTime(p.getCurrentTime());
      setMuted(p.isMuted());
    }, 400);
    return () => window.clearInterval(id);
  }, []);

  const enterFullscreen = useCallback(async () => {
    const el = wrapRef.current;
    if (!el) return;
    try {
      if (!document.fullscreenElement) await el.requestFullscreen();
      const orientation = screen.orientation as (ScreenOrientation & { lock?: (o: string) => Promise<void> }) | undefined;
      await orientation?.lock?.("landscape").catch(() => undefined);
    } catch {
      /* fullscreen not allowed */
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      const orientation = screen.orientation as (ScreenOrientation & { unlock?: () => void }) | undefined;
      orientation?.unlock?.();
      void document.exitFullscreen();
    } else void enterFullscreen();
  }, [enterFullscreen]);

  useEffect(() => {
    const onChange = () => setIsFull(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  /* Rotate device to landscape while playing → go fullscreen automatically. */
  useEffect(() => {
    const mq = window.matchMedia("(orientation: landscape)");
    const onOrientation = () => {
      if (mq.matches && playing && !document.fullscreenElement) void enterFullscreen();
    };
    mq.addEventListener("change", onOrientation);
    return () => mq.removeEventListener("change", onOrientation);
  }, [playing, enterFullscreen]);

  const p = playerRef.current;

  return (
    <div ref={wrapRef} className="yt-shell overflow-hidden rounded-2xl bg-black">
      <div className="yt-stage relative aspect-video w-full">
        <div ref={mountRef} className="absolute inset-0 size-full [&>iframe]:size-full" />
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}
        {/* click-to-toggle overlay above the iframe */}
        <button
          aria-label={playing ? "Pause" : "Play"}
          className="absolute inset-0"
          onClick={() => (playing ? p?.pauseVideo() : p?.playVideo())}
        />
      </div>

      {/* Controls */}
      <div className="space-y-2 bg-black/95 px-3 py-2.5">
        <input
          type="range"
          min={0}
          max={Math.max(duration, 1)}
          step={0.5}
          value={Math.min(time, duration || 1)}
          onChange={(e) => {
            const v = Number(e.target.value);
            setTime(v);
            p?.seekTo(v, true);
          }}
          aria-label="شريط التقدم"
          className="h-1.5 w-full cursor-pointer accent-[oklch(0.6_0.22_25)]"
        />
        <div className="flex items-center gap-1 text-tone-foreground">
          <Button
            size="icon"
            variant="ghost"
            className="text-tone-foreground hover:bg-white/10"
            onClick={() => (playing ? p?.pauseVideo() : p?.playVideo())}
            aria-label={playing ? "إيقاف" : "تشغيل"}
          >
            {playing ? <Pause className="size-5" /> : <Play className="size-5" />}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="text-tone-foreground hover:bg-white/10"
            onClick={() => {
              if (muted) {
                p?.unMute();
                setMuted(false);
              } else {
                p?.mute();
                setMuted(true);
              }
            }}
            aria-label="الصوت"
          >
            {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
          </Button>
          <input
            type="range"
            min={0}
            max={100}
            value={muted ? 0 : volume}
            onChange={(e) => {
              const v = Number(e.target.value);
              setVolume(v);
              setMuted(v === 0);
              p?.setVolume(v);
              if (v > 0) p?.unMute();
            }}
            aria-label="مستوى الصوت"
            className="h-1 w-20 cursor-pointer"
          />
          <span className="ml-1 text-[11px] font-semibold tabular-nums">
            {fmt(time)} / {fmt(duration)}
          </span>

          <div className="ml-auto flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-tone-foreground hover:bg-white/10"
                  aria-label="الإعدادات"
                >
                  <Settings className="size-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuLabel className="text-xs">⚡ سرعة التشغيل</DropdownMenuLabel>
                {rates.map((r) => (
                  <DropdownMenuItem
                    key={r}
                    onClick={() => {
                      setRate(r);
                      p?.setPlaybackRate(r);
                    }}
                  >
                    {r === rate ? "✅ " : ""}
                    {r}x
                  </DropdownMenuItem>
                ))}
                {!!qualities.length && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs">🎚️ الجودة</DropdownMenuLabel>
                    {qualities.map((q) => (
                      <DropdownMenuItem
                        key={q}
                        onClick={() => {
                          setQuality(q);
                          p?.setPlaybackQuality(q);
                        }}
                      >
                        {q === quality ? "✅ " : ""}
                        {QUALITY_LABELS[q] ?? q}
                      </DropdownMenuItem>
                    ))}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              size="icon"
              variant="ghost"
              className="text-tone-foreground hover:bg-white/10"
              onClick={toggleFullscreen}
              aria-label="شاشة كاملة"
            >
              {isFull ? <Minimize className="size-5" /> : <Maximize className="size-5" />}
            </Button>
          </div>
        </div>
        <p className="truncate text-[11px] text-tone-foreground/70">{title}</p>
      </div>
    </div>
  );
}
