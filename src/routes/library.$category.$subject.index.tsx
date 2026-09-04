import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ChevronLeft } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  FILE_TYPES,
  FILE_TYPE_EMOJI,
  LIBRARY_CATEGORY_LABELS,
  SUBJECT_AR,
  SUBJECT_EMOJI,
} from "@/lib/hub";

export const Route = createFileRoute("/library/$category/$subject")({
  head: () => ({
    meta: [
      { title: "نوع الملف — Study HUB Library" },
      { name: "description", content: "اختر نوع الملف: PDF، فيديو، صورة أو رابط داخل المادة." },
      { property: "og:title", content: "نوع الملف — Study HUB Library" },
      { property: "og:description", content: "اختر نوع الملف داخل مادة المكتبة." },
    ],
  }),
  component: LibraryFileTypesPage,
});

function LibraryFileTypesPage() {
  const { category, subject } = Route.useParams();

  const { data } = useQuery({
    queryKey: ["library-counts", category, subject],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("library_items")
        .select("file_type")
        .eq("category", category)
        .eq("subject", subject);
      if (error) throw error;
      return data;
    },
  });

  return (
    <AppShell
      title={`${SUBJECT_EMOJI[subject] ?? "📘"} ${SUBJECT_AR[subject] ?? subject}`}
      subtitle={`${LIBRARY_CATEGORY_LABELS[category] ?? category} · الخطوة 3 — اختر نوع الملف`}
    >
      <Button asChild variant="outline" size="sm" className="mb-4">
        <Link to="/library/$category" params={{ category }}>
          <ArrowRight className="mr-1 size-3.5" /> المواد
        </Link>
      </Button>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {FILE_TYPES.map((t) => {
          const count = (data ?? []).filter((i) => i.file_type === t).length;
          return (
            <Link
              key={t}
              to="/library/$category/$subject/$fileType"
              params={{ category, subject, fileType: t }}
              className="hub-card flex items-center justify-between p-5 transition hover:shadow-gold"
            >
              <span>
                <span className="font-display block text-base font-extrabold">
                  {FILE_TYPE_EMOJI[t]} {t}
                </span>
                <span className="mt-1 block text-[11px] text-muted-foreground">{count} ملف</span>
              </span>
              <ChevronLeft className="size-5 text-primary" />
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}
