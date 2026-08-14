import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Coffee, Maximize2, Minimize2, Pause, Play, RotateCcw, Timer } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/focus")({
  head: () => ({
    meta: [
      { title: "التركيز الدراسي — Study Focus" },
      { name: "description", content: "مؤقت بومودورو لجلسات دراسة مركزة مع تسجيل دقائق التركيز." },
      { property: "og:title", content: "التركيز الدراسي — Study Focus" },
      { property: "og:description", content: "مؤقت دراسة مركز مع تسجيل جلساتك." },
    ],
  }),
  component: FocusPage,
});

type ModeKey = "focus" | "short_break" | "long_break";

const MODES: { key: ModeKey; label: string; labelAr: string; icon: typeof Timer; def: number }[] = [
  { key: "focus", label: "Focus", labelAr: "مذاكرة", icon: Timer, def: 25 },
  { key: "short_break", label: "Short Break", labelAr: "بريك قصير", icon: Coffee, def: 5 },
  { key: "long_break", label: "Long Break", labelAr: "بريك طويل", icon: Coffee, def: 15 },
];

function FocusPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [mode, setMode] = useState<ModeKey>("focus");
  const [durations, setDurations] = useState<Record<ModeKey, number>>({
    focus: 25,
    short_break: 5,
    long_break: 15,
  });
  const [left, setLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const minutes = durations[mode];

  const save = useMutation({
    mutationFn: async (mins: number) => {
      const { error } = await supabase.from("study_sessions").insert({
        user_id: user!.id,
        minutes: mins,
        mode,
      });
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["sessions"] }),
  });

  const { data: sessions } = useQuery({
    queryKey: ["sessions"],
    queryFn: async () => {
      const { data } = await supabase
        .from("study_sessions")
        .select("minutes, mode, created_at")
        .order("created_at", { ascending: false })
        .limit(10);
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!running) return;
    timer.current = setInterval(() => {
      setLeft((v) => {
        if (v <= 1) {
          setRunning(false);
          save.mutate(minutes);
          return 0;
        }
        return v - 1;
      });
    }, 1000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, minutes, mode]);

  const selectMode = (key: ModeKey) => {
    setMode(key);
    setRunning(false);
    setLeft(durations[key] * 60);
  };

  const setDuration = (key: ModeKey, value: number) => {
    const v = Math.max(1, Math.min(180, value || 1));
    setDurations((d) => ({ ...d, [key]: v }));
    if (key === mode && !running) setLeft(v * 60);
  };

  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  const totalToday = (sessions ?? [])
    .filter((s) => new Date(s.created_at).toDateString() === new Date().toDateString())
    .reduce((a, s) => a + s.minutes, 0);

  return (
    <AppShell title="⏱️ Study Focus" subtitle="اختار نوع الجلسة وحدد وقتها بنفسك">
      <div className="mx-auto max-w-md">
        {/* Mode picker */}
        <section className="hub-card mb-4 p-4">
          <h2 className="font-display mb-3 text-sm font-extrabold">🎯 نوع الجلسة</h2>
          <div className="grid grid-cols-3 gap-2">
            {MODES.map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.key}
                  onClick={() => selectMode(m.key)}
                  className={cn(
                    "rounded-xl border p-3 text-center text-xs font-bold transition-colors",
                    mode === m.key
                      ? "gradient-gold shadow-gold border-transparent text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="mx-auto mb-1 size-4" />
                  {m.labelAr}
                  <span className="mt-0.5 block text-[10px] opacity-80">{durations[m.key]} د</span>
                </button>
              );
            })}
          </div>
        </section>

        <div className="hub-card p-6 text-center">
          <p className="text-gradient-gold font-display text-6xl font-extrabold tabular-nums">
            {mm}:{ss}
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Button className="gradient-gold font-bold" onClick={() => setRunning((r) => !r)}>
              {running ? <Pause className="mr-1 size-4" /> : <Play className="mr-1 size-4" />}
              {running ? "إيقاف مؤقت" : "ابدأ"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setRunning(false);
                setLeft(minutes * 60);
              }}
            >
              <RotateCcw className="mr-1 size-4" /> إعادة
            </Button>
            <Button variant="outline" onClick={() => setFullscreen(true)}>
              <Maximize2 className="mr-1 size-4" /> شاشة كاملة
            </Button>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2 text-left">
            {MODES.map((m) => (
              <div key={m.key}>
                <p className="mb-1 text-[11px] font-bold text-muted-foreground">{m.labelAr} (دقيقة)</p>
                <Input
                  type="number"
                  min={1}
                  max={180}
                  value={durations[m.key]}
                  onChange={(e) => setDuration(m.key, Number(e.target.value))}
                />
              </div>
            ))}
          </div>

          <p className="mt-5 text-sm font-bold text-primary">إجمالي اليوم: {totalToday} دقيقة</p>
        </div>

        <div className="mt-5 space-y-2">
          {sessions?.map((s, i) => (
            <div key={i} className="hub-card flex items-center justify-between p-3 text-sm">
              <span className="font-semibold">
                {MODES.find((m) => m.key === s.mode)?.labelAr ?? "جلسة دراسة"}
              </span>
              <span className="text-muted-foreground">
                {s.minutes} د · {new Date(s.created_at).toLocaleDateString("ar-EG")}
              </span>
            </div>
          ))}
        </div>
      </div>

      {fullscreen && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 bg-sidebar px-6 text-center text-sidebar-foreground">
          <p className="text-sm font-bold tracking-[0.3em] uppercase opacity-70">
            {MODES.find((m) => m.key === mode)?.labelAr}
          </p>
          <p className="text-gradient-gold font-display text-[22vw] leading-none font-extrabold tabular-nums md:text-[15vw]">
            {mm}:{ss}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button size="lg" className="gradient-gold font-bold" onClick={() => setRunning((r) => !r)}>
              {running ? <Pause className="mr-1 size-4" /> : <Play className="mr-1 size-4" />}
              {running ? "إيقاف مؤقت" : "ابدأ"}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => {
                setRunning(false);
                setLeft(minutes * 60);
              }}
            >
              <RotateCcw className="mr-1 size-4" /> إعادة
            </Button>
            <Button size="lg" variant="outline" onClick={() => setFullscreen(false)}>
              <Minimize2 className="mr-1 size-4" /> خروج
            </Button>
          </div>
          <p className="text-sm font-bold text-gold">إجمالي اليوم: {totalToday} دقيقة</p>
        </div>
      )}
    </AppShell>
  );
}
