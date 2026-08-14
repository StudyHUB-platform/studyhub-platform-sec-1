import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, GraduationCap } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { SUBJECT_EMOJI } from "@/lib/hub";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/teachers")({
  head: () => ({
    meta: [
      { title: "أفضل المعلمين — Best Teachers" },
      { name: "description", content: "قائمة أفضل قنوات ومعلمي كل مادة مع روابط قنواتهم التعليمية." },
      { property: "og:title", content: "أفضل المعلمين — Best Teachers" },
      { property: "og:description", content: "أفضل قنوات المعلمين لكل مادة." },
    ],
  }),
  component: TeachersPage,
});

function TeachersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["teachers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("teachers").select("*").order("subject");
      if (error) throw error;
      return data;
    },
  });

  const bySubject = (data ?? []).reduce<Record<string, typeof data>>((acc, t) => {
    acc[t.subject] = [...(acc[t.subject] ?? []), t];
    return acc;
  }, {});

  return (
    <AppShell title="👨‍🏫 Best Teachers" subtitle="أفضل المعلمين والقنوات لكل مادة">
      {isLoading && <p className="text-sm text-muted-foreground">جاري التحميل…</p>}
      {!isLoading && !data?.length && (
        <div className="hub-card p-8 text-center">
          <GraduationCap className="mx-auto size-10 text-primary" />
          <p className="font-display mt-3 text-lg font-bold">لم يُضف معلمون بعد</p>
          <p className="mt-1 text-sm text-muted-foreground">الأدمن يضيف المعلمين من Admin Panel.</p>
        </div>
      )}

      <div className="space-y-6">
        {Object.entries(bySubject).map(([subject, list]) => (
          <section key={subject}>
            <h2 className="font-display mb-3 text-lg font-bold">
              {SUBJECT_EMOJI[subject] ?? "📘"} {SUBJECT_AR[subject] ?? subject}{" "}
              <span className="text-sm font-semibold text-muted-foreground">/ {subject}</span>
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {list?.map((t) => (
                <article key={t.id} className="hub-card overflow-hidden p-0 text-center">
                  {t.image_url ? (
                    <img
                      src={t.image_url}
                      alt={t.channel_name}
                      className="aspect-video w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="gradient-gold flex aspect-video w-full items-center justify-center text-primary-foreground">
                      <GraduationCap className="size-10" />
                    </div>
                  )}
                  <div className="p-4">
                    <p className="font-display truncate text-base font-extrabold">{t.channel_name}</p>
                    {t.teacher_name && (
                      <p className="mt-0.5 truncate text-sm font-bold text-primary">{t.teacher_name}</p>
                    )}
                    <p className="mt-1 text-xs font-semibold text-muted-foreground">
                      {SUBJECT_AR[t.subject] ?? t.subject}
                    </p>
                    <p className="text-xs text-muted-foreground">{t.subject}</p>
                    <Button asChild size="sm" variant="outline" className="mt-3 w-full">
                      <a href={t.channel_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-1 size-3.5" /> القناة على يوتيوب
                      </a>
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>

    </AppShell>
  );
}
