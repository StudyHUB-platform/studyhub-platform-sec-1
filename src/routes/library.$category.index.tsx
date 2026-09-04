import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ChevronLeft } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  CORE_SUBJECTS,
  LIBRARY_CATEGORY_LABELS,
  OTHER_SUBJECTS,
  SUBJECT_AR,
  SUBJECT_EMOJI,
} from "@/lib/hub";

export const Route = createFileRoute("/library/$category")({
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
        .select("subject")
        .eq("category", category);
      if (error) throw error;
      return data;
    },
  });

  const card = (s: string) => {
    const count = (data ?? []).filter((i) => i.subject === s).length;
    return (
      <Link
        key={s}
        to="/library/$category/$subject"
        params={{ category, subject: s }}
        className="hub-card flex items-center justify-between p-4 transition hover:shadow-gold"
      >
        <span>
          <span className="font-display block text-sm font-extrabold">
            {SUBJECT_EMOJI[s] ?? "📘"} {SUBJECT_AR[s] ?? s}
          </span>
          <span className="mt-0.5 block text-[11px] font-semibold text-muted-foreground">{s}</span>
          <span className="mt-1.5 block text-[11px] text-muted-foreground">{count} ملف</span>
        </span>
        <ChevronLeft className="size-5 text-primary" />
      </Link>
    );
  };

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

      <section className="hub-card mb-4 p-4">
        <h2 className="font-display mb-3 text-sm font-extrabold">📚 المواد الأساسية — Core Subjects</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{CORE_SUBJECTS.map(card)}</div>
      </section>

      <section className="hub-card p-4">
        <h2 className="font-display mb-3 text-sm font-extrabold">🧩 مواد أخرى — Other Subjects</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{OTHER_SUBJECTS.map(card)}</div>
      </section>
    </AppShell>
  );
}
