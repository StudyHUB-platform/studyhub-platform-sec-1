import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { AppShell } from "@/components/AppShell";
import { SubjectGrid } from "@/components/SubjectCards";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/videos/")({
  head: () => ({
    meta: [
      { title: "الفيديوهات — Study HUB Videos" },
      {
        name: "description",
        content: "فيديوهات الشرح والحل والمراجعات السريعة والشهرية والنهائية لكل مادة داخل Study HUB.",
      },
      { property: "og:title", content: "الفيديوهات — Study HUB Videos" },
      { property: "og:description", content: "اختر المادة لعرض فيديوهات الشرح والمراجعات." },
    ],
  }),
  component: VideoSubjectsPage,
});

function VideoSubjectsPage() {
  const { data } = useQuery({
    queryKey: ["video-counts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("videos").select("subject");
      if (error) throw error;
      return data;
    },
  });

  const counts: Record<string, number> = {};
  for (const row of data ?? []) counts[row.subject] = (counts[row.subject] ?? 0) + 1;

  return (
    <AppShell title="🎬 Study HUB Videos" subtitle="الخطوة 1 — اختر المادة">
      <SubjectGrid
        to="/videos/$subject"
        buildParams={(s) => ({ subject: s })}
        counts={counts}
        countLabel="فيديو"
        accent="red"
      />
    </AppShell>
  );
}
