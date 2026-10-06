import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, CheckCircle2, FileText, Timer, XCircle } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { useMyStats } from "@/hooks/useMyStats";
import { StudyCandles } from "@/components/StudyCandles";

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
  const { data: my } = useMyStats();
  const { data } = useQuery({
    queryKey: ["stats"],
    queryFn: async () => {
      const [sessions, todos, attempts] = await Promise.all([
        supabase.from("study_sessions").select("minutes, created_at"),
        supabase.from("todos").select("is_done"),
        supabase
          .from("exam_attempts")
          .select("percentage, score, total, created_at, exams(name)")
          .order("created_at", { ascending: false }),
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
  const correct = (data?.attempts ?? []).reduce((a, x) => a + (x.score ?? 0), 0);
  const wrong = (data?.attempts ?? []).reduce((a, x) => a + ((x.total ?? 0) - (x.score ?? 0)), 0);
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
      <div className="tone-card tone-orange mb-5 flex flex-wrap items-center gap-4 p-5">
        <span className="text-5xl">🔥</span>
        <div className="flex-1">
          <p className="text-xs font-bold opacity-80">Weekly Streak</p>
          <p className="font-display text-3xl font-extrabold">{my?.streak ?? 0} يوم</p>
          <p className="text-xs opacity-80">
            {my?.studied_today ? "✅ ذاكرت النهارده" : "ذاكر النهارده عشان تحافظ على الـStreak"} — كل 7 أيام متتالية = +200 Shards 🧩
          </p>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <span key={i} className={i < (my?.streak ?? 0) % 7 || ((my?.streak ?? 0) > 0 && (my?.streak ?? 0) % 7 === 0) ? "text-xl" : "text-xl opacity-25 grayscale"}>🔥</span>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard icon={Timer} label="دقائق التركيز" value={String(minutes)} hint={`${data?.sessions.length ?? 0} جلسة`} />
        <StatCard icon={CheckCircle2} label="المهام المنجزة" value={`${doneTodos}/${totalTodos}`} />
        <StatCard icon={FileText} label="الامتحانات" value={String(data?.attempts.length ?? 0)} />
        <StatCard icon={BarChart3} label="Average Grades — متوسط الدرجات" value={`${avg}%`} />
        <StatCard icon={CheckCircle2} label="الإجابات الصحيحة" value={String(correct)} hint="من كل الامتحانات" />
        <StatCard icon={XCircle} label="الإجابات الخاطئة" value={String(wrong)} hint="من كل الامتحانات" />
      </div>

      <div className="hub-card mt-5 p-5">
        <p className="font-display mb-1 font-bold">📈 Study Progress — آخر 30 يوم</p>
        <p className="mb-3 text-xs text-muted-foreground">كل شمعة توضح صعود (أخضر) أو هبوط (أحمر) دقائق المذاكرة عن اليوم السابق.</p>
        <StudyCandles sessions={data?.sessions ?? []} />
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
        <p className="font-display mb-4 font-bold">نتائج الامتحانات</p>
        {!data?.attempts.length && (
          <p className="text-sm text-muted-foreground">لم تحل أي امتحان بعد.</p>
        )}
        <div className="space-y-3">
          {(data?.attempts ?? []).map((a, i) => (
            <div key={i}>
              <div className="mb-1 flex items-center justify-between text-xs font-bold">
                <span className="truncate">
                  {(a as { exams?: { name?: string } }).exams?.name ?? "امتحان"}
                </span>
                <span className="text-primary">
                  {a.score}/{a.total} · {Math.round(a.percentage)}%
                </span>
              </div>
              <Progress value={a.percentage} />
            </div>
          ))}
        </div>
      </div>

      <div className="hub-card mt-5 p-5">
        <p className="font-display mb-2 font-bold">نسبة إنجاز المهام</p>
        <Progress value={totalTodos ? (doneTodos / totalTodos) * 100 : 0} />
        <p className="mt-2 text-xs text-muted-foreground">
          {doneTodos} من {totalTodos} مهمة مكتملة
        </p>
      </div>
    </AppShell>
  );
}
