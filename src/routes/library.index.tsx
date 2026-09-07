import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { LIBRARY_CATEGORIES, LIBRARY_CATEGORY_LABELS } from "@/lib/hub";

export const Route = createFileRoute("/library/")({
  head: () => ({
    meta: [
      { title: "المكتبة — أقسام Study HUB Library" },
      {
        name: "description",
        content: "اختر القسم: ملخصات، كتب خارجية، مراجعات، نماذج استرشادية وبوسترات Study HUB.",
      },
      { property: "og:title", content: "المكتبة — أقسام Study HUB Library" },
      { property: "og:description", content: "كل أقسام مكتبة Study HUB في مكان واحد." },
    ],
  }),
  component: LibraryCategoriesPage,
});

function LibraryCategoriesPage() {
  const { data } = useQuery({
    queryKey: ["library-counts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("library_items").select("category, subject, file_type").neq("file_type", "Video");
      if (error) throw error;
      return data;
    },
  });

  return (
    <AppShell title="📚 Study HUB Library" subtitle="الخطوة 1 — اختر القسم">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {LIBRARY_CATEGORIES.map((c) => {
          const count = (data ?? []).filter((i) => i.category === c).length;
          return (
            <Link
              key={c}
              to="/library/$category"
              params={{ category: c }}
              className="hub-card flex items-center justify-between p-5 transition hover:shadow-gold"
            >
              <span>
                <span className="font-display block text-base font-extrabold">
                  {LIBRARY_CATEGORY_LABELS[c]}
                </span>
                <span className="mt-1 block text-xs font-semibold text-muted-foreground">{c}</span>
                <span className="mt-2 block text-[11px] text-muted-foreground">{count} ملف</span>
              </span>
              <ChevronLeft className="size-5 text-primary" />
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}
