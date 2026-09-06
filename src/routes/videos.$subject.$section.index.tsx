import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Play } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { youTubeThumbnail } from "@/lib/youtube";
import { SUBJECT_AR, VIDEO_SECTION_EMOJI, VIDEO_SECTION_LABELS } from "@/lib/hub";

export const Route = createFileRoute("/videos/$subject/$section/")({
  head: () => ({
    meta: [
      { title: "فيديوهات القسم — Study HUB Videos" },
      { name: "description", content: "كل فيديوهات القسم بعنوانها وصورتها المصغرة وتشغيلها داخل المنصة." },
      { property: "og:title", content: "فيديوهات القسم — Study HUB Videos" },
      { property: "og:description", content: "شغّل الفيديو داخل Study HUB بدون الخروج من المنصة." },
    ],
  }),
  component: VideoListPage,
});

function VideoListPage() {
  const { subject, section } = Route.useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["videos", subject, section],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .eq("subject", subject)
        .eq("section", section)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <AppShell
      title={`${VIDEO_SECTION_EMOJI[section] ?? "🎬"} ${VIDEO_SECTION_LABELS[section] ?? section}`}
      subtitle={SUBJECT_AR[subject] ?? subject}
    >
      <Button asChild variant="outline" size="sm" className="mb-4">
        <Link to="/videos/$subject" params={{ subject }}>
          <ArrowRight className="mr-1 size-3.5" /> أقسام الفيديوهات
        </Link>
      </Button>

      {isLoading && <p className="text-sm text-muted-foreground">جاري التحميل…</p>}
      {!isLoading && !data?.length && (
        <div className="hub-card p-8 text-center">
          <p className="font-display text-lg font-bold">لا يوجد فيديوهات هنا حالياً</p>
          <p className="mt-1 text-sm text-muted-foreground">
            الأدمن هو اللي يضيف الفيديوهات من Admin Panel → Videos.
          </p>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {(data ?? []).map((v) => {
          const thumb = v.thumbnail_url ?? youTubeThumbnail(v.url);
          return (
            <Link
              key={v.id}
              to="/videos/$subject/$section/$videoId"
              params={{ subject, section, videoId: v.id }}
              className="hub-card flex flex-col overflow-hidden transition hover:-translate-y-0.5"
            >
              <span className="relative block bg-secondary">
                {thumb ? (
                  <img src={thumb} alt={v.title} className="aspect-video w-full object-cover" loading="lazy" />
                ) : (
                  <span className="flex aspect-video w-full items-center justify-center text-4xl">🎬</span>
                )}
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="tone-card tone-red flex size-12 items-center justify-center rounded-full">
                    <Play className="size-5 fill-current" />
                  </span>
                </span>
              </span>
              <span className="flex flex-1 flex-col p-4">
                <span className="font-display line-clamp-2 font-bold">{v.title}</span>
                {v.description && (
                  <span className="mt-1 line-clamp-2 text-sm text-muted-foreground">{v.description}</span>
                )}
                <span className="mt-2 text-[11px] text-muted-foreground">
                  {SUBJECT_AR[v.subject] ?? v.subject} · {VIDEO_SECTION_LABELS[v.section] ?? v.section}
                </span>
                <span className="mt-1 text-[11px] text-muted-foreground">
                  📅 {new Date(v.created_at).toLocaleDateString("ar-EG")}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}
