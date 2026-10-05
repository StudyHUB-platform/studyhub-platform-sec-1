import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { ALL_SUBJECTS, SUBJECT_AR, SUBJECT_EMOJI } from "@/lib/hub";

export const Route = createFileRoute("/flashcards/")({
  head: () => ({
    meta: [
      { title: "Flash Cards — Study HUB" },
      { name: "description", content: "اكتب الأسئلة التي تخطئ فيها وراجعها بكروت تنقلب لكل مادة." },
      { property: "og:title", content: "Flash Cards — Study HUB" },
      { property: "og:description", content: "مراجعة تفاعلية بكروت السؤال والإجابة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FlashBoxes,
});

function FlashBoxes() {
  const { data = [] } = useQuery({
    queryKey: ["flashcards-count"],
    queryFn: async () => (await supabase.from("flashcards").select("subject")).data ?? [],
  });
  return (
    <AppShell title="🃏 Flash Cards" subtitle="اختر المادة التي تريد المراجعة منها">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {ALL_SUBJECTS.map((s) => (
          <Link
            key={s}
            to="/flashcards/$subject"
            params={{ subject: s }}
            className="tone-card tone-bluegray flex flex-col items-center gap-2 p-5 text-center transition-transform hover:-translate-y-1"
          >
            <span className="text-4xl">{SUBJECT_EMOJI[s]}</span>
            <span className="font-display text-sm font-bold">{SUBJECT_AR[s]}</span>
            <span className="text-[11px] opacity-80">{s}</span>
            <span className="rounded-full bg-black/20 px-2 py-0.5 text-[10px]">
              {data.filter((c) => c.subject === s).length} كارت
            </span>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
