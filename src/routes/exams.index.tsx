import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Clock, FileText } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SUBJECT_EMOJI } from "@/lib/hub";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/exams/")({
  head: () => ({
    meta: [
      { title: "الامتحانات — Study HUB Exams" },
      { name: "description", content: "امتحانات إلكترونية بمؤقت وتصحيح فوري لكل المواد الدراسية." },
      { property: "og:title", content: "الامتحانات — Study HUB Exams" },
      { property: "og:description", content: "امتحانات بمؤقت وتصحيح فوري ونتائج مفصلة." },
    ],
  }),
  component: ExamsPage,
});

function ExamsPage() {
  const { user } = useAuth();
  const { data: exams, isLoading } = useQuery({
    queryKey: ["exams"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exams")
        .select("*")
        .in("status", ["published", "ended"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: attempts } = useQuery({
    queryKey: ["attempts", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("exam_attempts")
        .select("exam_id, percentage, created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <AppShell title="📝 Exams" subtitle="اختر امتحان وابدأ — التصحيح فوري بعد التسليم">
      {isLoading && <p className="text-sm text-muted-foreground">جاري التحميل…</p>}
      {!isLoading && !exams?.length && (
        <div className="hub-card p-8 text-center">
          <p className="font-display text-lg font-bold">لا توجد امتحانات متاحة</p>
          <p className="mt-1 text-sm text-muted-foreground">الأدمن هو اللي ينشئ الامتحانات وينشرها.</p>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {exams?.map((e) => {
          const mine = attempts?.filter((a) => a.exam_id === e.id) ?? [];
          const best = mine.map((a) => a.percentage);
          const solved = mine.length > 0;
          const ended = e.status === "ended";
          return (
            <article key={e.id} className="hub-card flex flex-col p-4">
              <div className="flex items-start justify-between">
                <span className="text-2xl">{SUBJECT_EMOJI[e.subject] ?? "📘"}</span>
                <span className="flex flex-wrap items-center justify-end gap-1">
                  {ended && <Badge variant="destructive">🔴 انتهى — مغلق</Badge>}
                  {solved && <Badge variant="secondary">نتيجتك {Math.max(...best)}%</Badge>}
                </span>
              </div>
              <h3 className="font-display mt-3 font-bold">{e.name}</h3>
              {e.description && (
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{e.description}</p>
              )}
              <p className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <FileText className="size-3.5" /> {e.subject}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="size-3.5" /> {e.duration_minutes} د
                </span>
              </p>
              {ended && !solved ? (
                <Button className="mt-4 font-bold" variant="outline" disabled>
                  🔒 الامتحان مغلق
                </Button>
              ) : (
                <Button
                  asChild
                  className={solved ? "mt-4 font-bold" : "gradient-gold mt-4 font-bold"}
                  variant={solved ? "outline" : "default"}
                >
                  <Link to="/exams/$examId" params={{ examId: e.id }}>
                    {solved ? "عرض نتيجتك" : "ابدأ الامتحان"}
                  </Link>
                </Button>
              )}
            </article>
          );
        })}
      </div>
    </AppShell>
  );
}
