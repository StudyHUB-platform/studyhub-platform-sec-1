import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/exams/$examId")({
  head: () => ({
    meta: [
      { title: "أداء الامتحان — Study HUB" },
      { name: "description", content: "حل الامتحان بمؤقت زمني واحصل على تصحيح فوري ونتيجة مفصلة." },
      { property: "og:title", content: "أداء الامتحان — Study HUB" },
      { property: "og:description", content: "حل الامتحان واحصل على نتيجتك فوراً." },
    ],
  }),
  component: ExamRunner,
});

type Result = { score: number; total: number; percentage: number };

function ExamRunner() {
  const { examId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [left, setLeft] = useState<number | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data } = useQuery({
    queryKey: ["exam", examId],
    queryFn: async () => {
      const [{ data: exam, error: e1 }, { data: questions, error: e2 }] = await Promise.all([
        supabase.from("exams").select("*").eq("id", examId).single(),
        supabase.from("exam_questions").select("*").eq("exam_id", examId).order("position"),
      ]);
      if (e1) throw e1;
      if (e2) throw e2;
      return { exam, questions: questions ?? [] };
    },
  });

  useEffect(() => {
    if (data?.exam && left === null) setLeft(data.exam.duration_minutes * 60);
  }, [data, left]);

  const submit = useMemo(
    () => async () => {
      if (!data || submitting) return;
      setSubmitting(true);
      let score = 0;
      let total = 0;
      data.questions.forEach((q) => {
        total += q.points;
        const given = (answers[q.id] ?? "").trim().toLowerCase();
        if (given && given === q.correct_answer.trim().toLowerCase()) score += q.points;
      });
      const percentage = total ? Math.round((score / total) * 100) : 0;
      const { error } = await supabase.from("exam_attempts").insert({
        exam_id: examId,
        user_id: user!.id,
        answers,
        score,
        total,
        percentage,
      });
      if (error) toast.error(error.message);
      setResult({ score, total, percentage });
      setSubmitting(false);
    },
    [answers, data, examId, submitting, user],
  );

  useEffect(() => {
    if (left === null || result) return;
    if (left <= 0) {
      void submit();
      return;
    }
    const t = setTimeout(() => setLeft((v) => (v ?? 1) - 1), 1000);
    return () => clearTimeout(t);
  }, [left, result, submit]);

  if (!data?.exam) {
    return (
      <AppShell title="جاري التحميل…">
        <p className="text-sm text-muted-foreground">جاري تحميل الامتحان…</p>
      </AppShell>
    );
  }

  if (result) {
    const passed = result.percentage >= 50;
    return (
      <AppShell title="نتيجة الامتحان" subtitle={data.exam.name}>
        <div className="hub-card mx-auto max-w-md p-8 text-center">
          {passed ? (
            <CheckCircle2 className="mx-auto size-12 text-primary" />
          ) : (
            <XCircle className="mx-auto size-12 text-destructive" />
          )}
          <p className="text-gradient-gold font-display mt-4 text-5xl font-extrabold">
            {result.percentage}%
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            حصلت على {result.score} من {result.total} درجة
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Button className="gradient-gold font-bold" onClick={() => navigate({ to: "/exams" })}>
              كل الامتحانات
            </Button>
            <Button variant="outline" onClick={() => navigate({ to: "/statistics" })}>
              الإحصائيات
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  const answered = Object.keys(answers).filter((k) => answers[k]).length;
  const mm = String(Math.floor((left ?? 0) / 60)).padStart(2, "0");
  const ss = String((left ?? 0) % 60).padStart(2, "0");

  return (
    <AppShell title={data.exam.name} subtitle={`${data.exam.subject} · ${data.questions.length} سؤال`}>
      <div className="hub-card sticky top-16 z-10 mb-4 flex items-center justify-between p-3">
        <span className="flex items-center gap-2 text-sm font-bold text-primary">
          <Clock className="size-4" /> {mm}:{ss}
        </span>
        <div className="mx-4 flex-1">
          <Progress value={(answered / Math.max(1, data.questions.length)) * 100} />
        </div>
        <span className="text-xs text-muted-foreground">
          {answered}/{data.questions.length}
        </span>
      </div>

      <div className="space-y-3">
        {data.questions.map((q, i) => {
          const options = Array.isArray(q.options) ? (q.options as string[]) : [];
          return (
            <article key={q.id} className="hub-card p-4">
              <p className="font-display font-bold">
                {i + 1}. {q.question_text}
              </p>
              {q.image_url && (
                <img src={q.image_url} alt="صورة السؤال" className="mt-3 max-h-64 rounded-xl" loading="lazy" />
              )}
              {q.question_type === "written" ? (
                <Input
                  className="mt-3"
                  value={answers[q.id] ?? ""}
                  onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                  placeholder="اكتب إجابتك…"
                />
              ) : (
                <div className="mt-3 space-y-2">
                  {options.map((opt) => {
                    const active = answers[q.id] === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                        className={
                          active
                            ? "gradient-gold w-full rounded-xl px-4 py-2.5 text-left text-sm font-bold text-primary-foreground"
                            : "w-full rounded-xl border border-border px-4 py-2.5 text-left text-sm hover:bg-accent"
                        }
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              )}
            </article>
          );
        })}
      </div>

      <Button
        className="gradient-gold mt-5 w-full font-bold"
        disabled={submitting}
        onClick={() => void submit()}
      >
        تسليم الامتحان
      </Button>
    </AppShell>
  );
}
