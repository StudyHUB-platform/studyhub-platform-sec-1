import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { SubjectGrid } from "@/components/SubjectCards";
import { LIBRARY_CATEGORY_LABELS } from "@/lib/hub";

export const Route = createFileRoute("/library/$category/")({
  head: () => ({
    meta: [
      { title: "مواد القسم — Study HUB Library" },
      { name: "description", content: "اختر المادة الدراسية داخل قسم المكتبة لعرض ملفاتها." },
      { property: "og:title", content: "مواد القسم — Study HUB Library" },
      { property: "og:description", content: "اختر المادة داخل قسم مكتبة Study HUB." },
    ],
  }),
  component: LibrarySubjectsPage,
});

function LibrarySubjectsPage() {
  const { category } = Route.useParams();

  const { data } = useQuery({
    queryKey: ["library-counts", category],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("library_items")
        .select("subject").neq("file_type", "Video")
        .eq("category", category);
      if (error) throw error;
      return data;
    },
  });

  const counts: Record<string, number> = {};
  for (const row of data ?? []) counts[row.subject] = (counts[row.subject] ?? 0) + 1;

  return (
    <AppShell
      title={`📚 ${LIBRARY_CATEGORY_LABELS[category] ?? category}`}
      subtitle="الخطوة 2 — اختر المادة"
    >
      <Button asChild variant="outline" size="sm" className="mb-4">
        <Link to="/library">
          <ArrowRight className="mr-1 size-3.5" /> الأقسام
        </Link>
      </Button>

      <SubjectGrid
        to="/library/$category/$subject"
        buildParams={(s) => ({ category, subject: s })}
        counts={counts}
        countLabel="ملف"
      />
    </AppShell>
  );
}
