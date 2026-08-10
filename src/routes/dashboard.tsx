import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Lightbulb, Megaphone } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { FEATURES } from "@/lib/hub";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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

  return (
    <AppShell
      title={`أهلاً ${profile?.full_name ?? "بك"} 👋`}
      subtitle="اختار القسم اللي عايز تبدأ بيه من Study HUB"
    >
      <section className="gradient-gold shadow-gold mb-6 rounded-2xl p-5 text-primary-foreground">
        <p className="flex items-center gap-2 text-xs font-extrabold tracking-widest uppercase">
          <Lightbulb className="size-4" /> Tip of the day
        </p>
        <h2 className="font-display mt-2 text-xl font-extrabold">
          {tip?.title ?? "نصيحة اليوم قادمة قريباً"}
        </h2>
        <p className="mt-1 text-sm font-medium opacity-90">
          {tip?.content ?? "الأدمن لسه مضافش نصيحة النهاردة — استعد وابدأ بمهامك."}
        </p>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {FEATURES.map((f, i) => {
          const Icon = f.icon;
          const gold = i % 3 === 0;
          return (
            <Link
              key={f.to}
              to={f.to}
              className={
                gold
                  ? "shadow-gold rounded-2xl border border-primary/30 bg-primary/12 p-4 transition-transform hover:-translate-y-0.5"
                  : "hub-card p-4 transition-transform hover:-translate-y-0.5"
              }
            >
              <span
                className={
                  gold
                    ? "gradient-gold flex size-10 items-center justify-center rounded-xl text-primary-foreground"
                    : "flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground"
                }
              >
                <Icon className="size-5" />
              </span>
              <p className="font-display mt-3 text-sm font-bold">{f.label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{f.labelAr}</p>
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
