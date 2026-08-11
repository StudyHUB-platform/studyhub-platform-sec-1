import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, Clock, Lightbulb, Megaphone } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { FEATURES } from "@/lib/hub";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "لوحة التحكم — Study HUB" },
      { name: "description", content: "كل أدوات Study HUB في مكان واحد مع نصيحة اليوم وآخر التحديثات." },
      { property: "og:title", content: "لوحة التحكم — Study HUB" },
      { property: "og:description", content: "كل أدوات Study HUB في مكان واحد." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { profile } = useAuth();

  const { data: tip } = useQuery({
    queryKey: ["tip", "latest"],
    queryFn: async () => {
      const { data } = await supabase
        .from("admin_tips")
        .select("title, content")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  const { data: updates } = useQuery({
    queryKey: ["updates", "dashboard"],
    queryFn: async () => {
      const { data } = await supabase
        .from("platform_updates")
        .select("id, title, content, created_at")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(3);
      return data ?? [];
    },
  });

  const { data: todayMinutes } = useQuery({
    queryKey: ["dashboard", "focus-today"],
    queryFn: async () => {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const { data } = await supabase
        .from("study_sessions")
        .select("minutes, created_at")
        .gte("created_at", start.toISOString());
      return (data ?? []).reduce((a, s) => a + (s.minutes ?? 0), 0);
    },
  });

  const { data: tasks } = useQuery({
    queryKey: ["dashboard", "todos"],
    queryFn: async () => {
      const { data } = await supabase.from("todos").select("id, is_done");
      return data ?? [];
    },
  });

  const done = (tasks ?? []).filter((t) => t.is_done).length;
  const total = tasks?.length ?? 0;
  const hours = String(Math.floor((todayMinutes ?? 0) / 60)).padStart(2, "0");
  const mins = String((todayMinutes ?? 0) % 60).padStart(2, "0");

  return (
    <AppShell
      title={`Welcome back, ${profile?.full_name ?? "Student"}! 👋`}
      subtitle="من دواعي سرورنا نراك مرة أخرى في Study HUB"
    >
      {/* Stats */}
      <section className="mb-6 grid gap-3 sm:grid-cols-2">
        <div className="tone-card tone-blue flex items-center justify-between gap-3 p-5">
          <div className="min-w-0">
            <p className="text-xs font-bold opacity-80">وقت المذاكرة اليوم</p>
            <p className="font-display mt-1 text-3xl font-extrabold tabular-nums">
              {hours}:{mins}:00
            </p>
            <p className="mt-1 text-xs font-bold text-gold">
              {todayMinutes ? `${todayMinutes} دقيقة مسجلة` : "لا يوجد وقت مسجل بعد"}
            </p>
          </div>
          <span className="grid size-14 shrink-0 place-items-center rounded-full bg-white/12">
            <Clock className="size-7 text-gold" />
          </span>
        </div>

        <div className="gradient-gold shadow-gold flex items-center justify-between gap-3 rounded-xl p-5 text-primary-foreground">
          <div className="min-w-0">
            <p className="text-xs font-bold opacity-80">المهام المكتملة</p>
            <p className="font-display mt-1 text-3xl font-extrabold tabular-nums">
              {done} / {total}
            </p>
            <p className="mt-1 text-xs font-bold opacity-80">
              {total ? "استمر، أنت على الطريق الصحيح" : "لا توجد مهام بعد"}
            </p>
          </div>
          <span className="grid size-14 shrink-0 place-items-center rounded-full bg-white/25">
            <CheckCircle2 className="size-7" />
          </span>
        </div>
      </section>

      {/* Tip of the day */}
      <section className="gradient-gold shadow-gold mb-6 flex items-start gap-4 rounded-2xl p-5 text-primary-foreground">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/25">
          <Lightbulb className="size-6" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-extrabold tracking-widest uppercase opacity-80">Tip of the day</p>
          <h2 className="font-display mt-1 text-xl font-extrabold">
            {tip?.title ?? "نصيحة اليوم قادمة قريباً"}
          </h2>
          <p className="mt-1 text-sm font-medium opacity-90">
            {tip?.content ?? "الأدمن لسه مضافش نصيحة النهاردة — استعد وابدأ بمهامك."}
          </p>
        </div>
      </section>

      {/* Feature cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {FEATURES.map((f) => {
          const Icon = f.icon;
          return (
            <Link
              key={f.to}
              to={f.to}
              className={cn(
                "tone-card group flex items-start gap-3 p-5 transition-transform hover:-translate-y-1",
                f.tone,
              )}
            >
              <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-white/15 text-2xl">
                {f.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display truncate text-base font-extrabold">{f.label}</p>
                <p className="mt-0.5 text-xs opacity-85">{f.labelAr}</p>
              </div>
              <span className="grid size-8 shrink-0 place-items-center self-end rounded-full bg-white/20 transition-transform group-hover:translate-x-0.5">
                <ArrowRight className="size-4" />
              </span>
              <Icon className="hidden" />
            </Link>
          );
        })}
      </section>

      <section className="mt-8">
        <h2 className="font-display mb-3 flex items-center gap-2 text-lg font-bold">
          <Megaphone className="size-5 text-primary" /> Latest Updates
        </h2>
        <div className="space-y-3">
          {!updates?.length && (
            <p className="hub-card p-4 text-sm text-muted-foreground">لا توجد تحديثات منشورة بعد.</p>
          )}
          {updates?.map((u) => (
            <article key={u.id} className="hub-card p-4">
              <p className="font-display font-bold text-primary">{u.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{u.content}</p>
            </article>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
