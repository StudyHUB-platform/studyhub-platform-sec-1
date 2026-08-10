import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

function FocusPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [minutes, setMinutes] = useState(25);
  const [left, setLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [subject, setSubject] = useState("");
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const save = useMutation({
    mutationFn: async (mins: number) => {
      const { error } = await supabase.from("study_sessions").insert({
        user_id: user!.id,
        minutes: mins,
        subject: subject || null,
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
        .select("minutes, subject, created_at")
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
  }, [running, minutes]);

  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  const totalToday = (sessions ?? [])
    .filter((s) => new Date(s.created_at).toDateString() === new Date().toDateString())
    .reduce((a, s) => a + s.minutes, 0);

  return (
    <AppShell title="⏱️ Study Focus" subtitle="ركّز جلسة كاملة بدون تشتيت">
      <div className="mx-auto max-w-md">
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
          </div>

          <div className="mt-6 grid grid-cols-2 gap-2 text-left">
            <div>
              <p className="mb-1 text-xs font-bold text-muted-foreground">مدة الجلسة (دقيقة)</p>
              <Input
                type="number"
                min={1}
                max={180}
                value={minutes}
                onChange={(e) => {
                  const v = Math.max(1, Math.min(180, Number(e.target.value) || 1));
                  setMinutes(v);
                  if (!running) setLeft(v * 60);
                }}
              />
            </div>
            <div>
              <p className="mb-1 text-xs font-bold text-muted-foreground">المادة (اختياري)</p>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Math" />
            </div>
          </div>

          <p className="mt-5 text-sm font-bold text-primary">إجمالي اليوم: {totalToday} دقيقة</p>
        </div>

        <div className="mt-5 space-y-2">
          {sessions?.map((s, i) => (
            <div key={i} className="hub-card flex items-center justify-between p-3 text-sm">
              <span className="font-semibold">{s.subject ?? "جلسة دراسة"}</span>
              <span className="text-muted-foreground">
                {s.minutes} د · {new Date(s.created_at).toLocaleDateString("ar-EG")}
              </span>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
