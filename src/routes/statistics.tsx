import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, CheckCircle2, FileText, Timer } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/statistics")({
  head: () => ({
    meta: [
      { title: "الإحصائيات — Study HUB Statistics" },
      { name: "description", content: "تابع دقائق تركيزك، مهامك المنجزة، ومتوسط نتائج امتحاناتك." },
      { property: "og:title", content: "الإحصائيات — Study HUB Statistics" },
      { property: "og:description", content: "متابعة تقدمك الدراسي بالأرقام." },
    ],
  }),
  component: StatsPage,
});

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof BarChart3;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="hub-card p-4">
      <span className="gradient-gold flex size-10 items-center justify-center rounded-xl text-primary-foreground">
        <Icon className="size-5" />
      </span>
      <p className="mt-3 text-xs font-bold text-muted-foreground">{label}</p>
      <p className="font-display text-2xl font-extrabold">{value}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function StatsPage() {
  const { data } = useQuery({
    queryKey: ["stats"],
    queryFn: async () => {
      const [sessions, todos, attempts] = await Promise.all([
        supabase.from("study_sessions").select("minutes, created_at"),
        supabase.from("todos").select("is_done"),
        supabase.from("exam_attempts").select("percentage, created_at"),
      ]);
      return {
        sessions: sessions.data ?? [],
        todos: todos.data ?? [],
        attempts: attempts.data ?? [],
      };
    },
  });

  const minutes = (data?.sessions ?? []).reduce((a, s) => a + s.minutes, 0);
  const doneTodos = (data?.todos ?? []).filter((t) => t.is_done).length;
  const totalTodos = data?.todos.length ?? 0;
  const avg = data?.attempts.length
    ? Math.round(data.attempts.reduce((a, x) => a + x.percentage, 0) / data.attempts.length)
    : 0;

  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toDateString();
    const mins = (data?.sessions ?? [])
      .filter((s) => new Date(s.created_at).toDateString() === key)
      .reduce((a, s) => a + s.minutes, 0);
    return { label: d.toLocaleDateString("ar-EG", { weekday: "short" }), mins };
  });
  const max = Math.max(60, ...week.map((w) => w.mins));

  return (
    <AppShell title="📊 Statistics" subtitle="تقدمك الدراسي بالأرقام">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Timer} label="دقائق التركيز" value={String(minutes)} hint={`${data?.sessions.length ?? 0} جلسة`} />
        <StatCard icon={CheckCircle2} label="المهام المنجزة" value={`${doneTodos}/${totalTodos}`} />
        <StatCard icon={FileText} label="الامتحانات" value={String(data?.attempts.length ?? 0)} />
        <StatCard icon={BarChart3} label="متوسط النتائج" value={`${avg}%`} />
      </div>

      <div className="hub-card mt-5 p-5">
        <p className="font-display mb-4 font-bold">دقائق التركيز — آخر 7 أيام</p>
        <div className="flex h-40 items-end gap-2">
          {week.map((w) => (
            <div key={w.label} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="gradient-gold w-full rounded-t-lg"
                style={{ height: `${Math.max(4, (w.mins / max) * 100)}%` }}
                title={`${w.mins} دقيقة`}
              />
              <span className="text-[10px] text-muted-foreground">{w.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="hub-card mt-5 p-5">
        <p className="font-display mb-2 font-bold">نسبة إنجاز المهام</p>
        <Progress value={totalTodos ? (doneTodos / totalTodos) * 100 : 0} />
      </div>
    </AppShell>
  );
}
