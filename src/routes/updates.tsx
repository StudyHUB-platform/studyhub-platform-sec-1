import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Megaphone } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/updates")({
  head: () => ({
    meta: [
      { title: "آخر التحديثات — Study HUB Updates" },
      { name: "description", content: "تابع كل جديد في منصة Study HUB من ميزات وملفات وامتحانات." },
      { property: "og:title", content: "آخر التحديثات — Study HUB Updates" },
      { property: "og:description", content: "كل جديد في منصة Study HUB." },
    ],
  }),
  component: UpdatesPage,
});

function UpdatesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["updates", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_updates")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <AppShell title="📰 Latest Updates" subtitle="كل جديد في Study HUB">
      {isLoading && <p className="text-sm text-muted-foreground">جاري التحميل…</p>}
      {!isLoading && !data?.length && (
        <div className="hub-card p-8 text-center">
          <Megaphone className="mx-auto size-10 text-primary" />
          <p className="font-display mt-3 text-lg font-bold">لا توجد تحديثات بعد</p>
        </div>
      )}
      <div className="space-y-3">
        {data?.map((u) => (
          <article key={u.id} className="hub-card p-4">
            <p className="font-display font-bold text-primary">{u.title}</p>
            <p className="mt-1 text-sm whitespace-pre-wrap text-muted-foreground">{u.content}</p>
            <p className="mt-2 text-[11px] text-muted-foreground">
              📅 {new Date(u.created_at).toLocaleDateString("ar-EG")}
            </p>
          </article>
        ))}
      </div>
    </AppShell>
  );
}
