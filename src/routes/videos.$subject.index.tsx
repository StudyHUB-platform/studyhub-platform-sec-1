import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ChevronLeft } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  SUBJECT_AR,
  SUBJECT_EMOJI,
  VIDEO_SECTIONS,
  VIDEO_SECTION_DESC,
  VIDEO_SECTION_EMOJI,
  VIDEO_SECTION_LABELS,
} from "@/lib/hub";

export const Route = createFileRoute("/videos/$subject/")({
  head: () => ({
    meta: [
      { title: "أقسام الفيديوهات — Study HUB Videos" },
      { name: "description", content: "شرح وحل، مراجعات سريعة، مراجعات شهرية ومراجعات نهائية لكل مادة." },
      { property: "og:title", content: "أقسام الفيديوهات — Study HUB Videos" },
      { property: "og:description", content: "اختر قسم الفيديوهات داخل المادة." },
    ],
  }),
  component: VideoSectionsPage,
});

function VideoSectionsPage() {
  const { subject } = Route.useParams();

  const { data } = useQuery({
    queryKey: ["video-counts", subject],
    queryFn: async () => {
      const { data, error } = await supabase.from("videos").select("section").eq("subject", subject);
      if (error) throw error;
      return data;
    },
  });

  return (
    <AppShell
      title={`🎬 ${SUBJECT_EMOJI[subject] ?? "📘"} ${SUBJECT_AR[subject] ?? subject}`}
      subtitle="الخطوة 2 — اختر قسم الفيديوهات"
    >
      <Button asChild variant="outline" size="sm" className="mb-4">
        <Link to="/videos">
          <ArrowRight className="mr-1 size-3.5" /> المواد
        </Link>
      </Button>

      <div className="grid gap-3 sm:grid-cols-2">
        {VIDEO_SECTIONS.map((s) => {
          const count = (data ?? []).filter((v) => v.section === s).length;
          return (
            <Link
              key={s}
              to="/videos/$subject/$section"
              params={{ subject, section: s }}
              className="hub-card flex items-center gap-4 p-5 transition hover:-translate-y-0.5 hover:border-destructive/60"
            >
              <span className="tone-card tone-red flex size-16 items-center justify-center rounded-2xl text-3xl">
                {VIDEO_SECTION_EMOJI[s]}
              </span>
              <span className="flex-1">
                <span className="font-display block text-base font-extrabold">
                  {VIDEO_SECTION_LABELS[s]}
                </span>
                <span className="mt-0.5 block text-[11px] font-bold text-muted-foreground">{s}</span>
                <span className="mt-1.5 block text-xs text-muted-foreground">
                  {VIDEO_SECTION_DESC[s]}
                </span>
                <span className="mt-2 block text-[11px] font-bold text-primary">{count} فيديو</span>
              </span>
              <ChevronLeft className="size-5 text-primary" />
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}
