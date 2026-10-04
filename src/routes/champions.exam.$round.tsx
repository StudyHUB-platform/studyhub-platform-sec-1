import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { LibraryImage } from "@/components/LibraryImage";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useChampions } from "@/hooks/useChampions";
import { CL_ROUNDS, ROUND_STATE_AR, fmtElapsed, liveAttempt, roundState, subjectLabel } from "@/lib/champions";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/champions/exam/$round")({
  head: () => ({
    meta: [
      { title: "امتحان الجولة — Champions League" },
      { name: "description", content: "امتحان جولة بطولة Study HUB بمحاولة واحدة ومؤقت وتسليم تلقائي." },
      { property: "og:title", content: "امتحان الجولة — Champions League" },
      { property: "og:description", content: "محاولة واحدة فقط لكل جولة مع حفظ تلقائي للإجابات." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RoundExam,
});

type Q = {
  id: string;
  subject: string;
  question_text: string;
  image_url: string | null;
  options: string[];
  correct_answer?: string;
  explanation?: string | null;
};
type Attempt = {
  id: string;
  status: string;
  started_at: string;
  submitted_at: string | null;
  deadline: string;
  answers: Record<string, string>;
  score: number;
  total: number;
  percentage: number;
};

function Img({ url }: { url: string }) {
  return url.startsWith("sb://") ? (
    <LibraryImage url={url} alt="صورة السؤال" className="mt-3 max-h-72 rounded-xl" />
  ) : (
    <img src={url} alt="صورة السؤال" className="mt-3 max-h-72 rounded-xl" loading="lazy" />
  );
}

function RoundExam() {
  const round = Number(Route.useParams().round);
  const meta = CL_ROUNDS.find((r) => r.round === round);
  const { user } = useAuth();
  const qc = useQueryClient();
  const champ = useChampions();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const answersRef = useRef(answers);
  answersRef.current = answers;
  const [left, setLeft] = useState(0);
  const offset = useRef(0);
  const done = useRef<string | null>(null);

  const exam = useQuery({
    queryKey: ["cl-exam", round, user?.id],
    enabled: !!user,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("cl_get_exam", { _round: round });
      if (error) throw error;
      return data as unknown as { attempt: Attempt; questions: Q[]; server_now: string } | null;
    },
  });
  const attempt = exam.data?.attempt;
  const inProgress = attempt?.status === "in_progress";
  const attemptRef = useRef(attempt);
  attemptRef.current = attempt;

  const finish = useCallback(
    async (reason?: string) => {
      const a = attemptRef.current;
      if (!a || a.status !== "in_progress" || done.current === a.id) return;
      done.current = a.id;
      liveAttempt.id = null;
      await supabase.rpc("cl_submit_attempt", { _round: round, _answers: answersRef.current });
      if (reason) toast.info(reason);
      void qc.invalidateQueries({ queryKey: ["cl-exam", round] });
      void qc.invalidateQueries({ queryKey: ["champions"] });
    },
    [round, qc],
  );

  // attempt opened outside this page session (reload / came back) → closed as submitted
  useEffect(() => {
    if (!exam.data || !attempt) return;
    if (inProgress && liveAttempt.id !== attempt.id) {
      void finish("تم إغلاق المحاولة لأنك خرجت من صفحة الامتحان");
      return;
    }
    if (inProgress) {
      setAnswers((a) => (Object.keys(a).length ? a : (attempt.answers ?? {})));
      offset.current = new Date(exam.data.server_now).getTime() - Date.now();
    } else {
      setAnswers(attempt.answers ?? {});
    }
  }, [exam.data, attempt, inProgress, finish]);

  // leaving the page = submit
  useEffect(() => {
    if (!inProgress) return;
    const onHide = () => {
      if (document.visibilityState === "hidden") void finish("تم تسليم الامتحان لأنك خرجت من الصفحة");
    };
    const onUnload = () => void finish();
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onUnload);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onUnload);
      void finish();
    };
  }, [inProgress, finish]);

  // timer
  useEffect(() => {
    if (!inProgress || !attempt) return;
    const tick = () => {
      const s = Math.max(0, Math.floor((new Date(attempt.deadline).getTime() - (Date.now() + offset.current)) / 1000));
      setLeft(s);
      if (s <= 0) void finish("انتهى الوقت — تم تسليم الامتحان تلقائياً");
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [inProgress, attempt, finish]);

  // autosave
  useEffect(() => {
    if (!inProgress) return;
    const t = setTimeout(() => {
      void supabase.rpc("cl_save_answers", { _round: round, _answers: answers });
    }, 600);
    return () => clearTimeout(t);
  }, [answers, inProgress, round]);

  const start = async () => {
    setBusy(true);
    const { data, error } = await supabase.rpc("cl_start_attempt", { _round: round });
    setBusy(false);
    setConfirm(false);
    if (error) { toast.error(error.message); return; }
    liveAttempt.id = data as string;
    setAnswers({});
    await exam.refetch();
  };

  if (!meta) return <AppShell title="جولة غير موجودة"><p>جولة غير موجودة.</p></AppShell>;
  const title = `${meta.medal} ${meta.en}`;

  if (exam.isLoading || champ.isLoading) {
    return <AppShell title={title}><p className="text-sm text-muted-foreground">جاري التحميل…</p></AppShell>;
  }

  // submitted → result
  if (attempt && !inProgress) {
    return (
      <AppShell title={title} subtitle="نتيجتك في هذه الجولة">
        <div className="hub-card mx-auto max-w-md p-8 text-center">
          <p className="text-gradient-gold font-display text-5xl font-extrabold">{Number(attempt.percentage)}%</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {attempt.score} من {attempt.total} · وقت الإكمال {fmtElapsed(attempt.started_at, attempt.submitted_at)}
          </p>
          <p className="mt-3 text-xs text-muted-foreground">🔒 محاولة واحدة فقط — لا يمكن إعادة الامتحان.</p>
          <Button asChild className="gradient-gold mt-4 font-bold">
            <Link to="/champions">خريطة البطولة</Link>
          </Button>
        </div>
        <div className="mx-auto mt-5 max-w-2xl space-y-3">
          {exam.data!.questions.map((q, i) => {
            const given = (answers[q.id] ?? "").trim();
            const ok = !!given && given.toLowerCase() === (q.correct_answer ?? "").trim().toLowerCase();
            return (
              <article key={q.id} className="hub-card p-4">
                <p className="text-[11px] font-bold text-primary">{subjectLabel(q.subject)}</p>
                <p className="font-display font-bold">{i + 1}. {q.question_text}</p>
                {q.image_url && <Img url={q.image_url} />}
                <p className={ok ? "mt-2 text-sm font-bold text-primary" : "mt-2 text-sm font-bold text-destructive"}>
                  {ok ? "✅" : "❌"} إجابتك: {given || "بدون إجابة"}
                </p>
                {!ok && <p className="mt-1 text-sm font-bold text-primary">✔️ الإجابة الصحيحة: {q.correct_answer}</p>}
                {q.explanation && (
                  <p className="mt-2 rounded-xl bg-accent p-3 text-sm text-accent-foreground">💡 الشرح: {q.explanation}</p>
                )}
              </article>
            );
          })}
        </div>
      </AppShell>
    );
  }

  // in progress
  if (attempt && inProgress && liveAttempt.id === attempt.id) {
    const qs = exam.data!.questions;
    const answered = qs.filter((q) => answers[q.id]).length;
    return (
      <AppShell title={title} subtitle={`${qs.length} سؤال — لا تخرج من الصفحة`}>
        <div className="hub-card sticky top-16 z-10 mb-4 flex items-center justify-between p-3">
          <span className="flex items-center gap-2 text-sm font-bold text-primary">
            <Clock className="size-4" /> {String(Math.floor(left / 60)).padStart(2, "0")}:{String(left % 60).padStart(2, "0")}
          </span>
          <div className="mx-4 flex-1"><Progress value={(answered / Math.max(1, qs.length)) * 100} /></div>
          <span className="text-xs text-muted-foreground">{answered}/{qs.length}</span>
        </div>
        <div className="space-y-3">
          {qs.map((q, i) => (
            <article key={q.id} className="hub-card p-4">
              <p className="text-[11px] font-bold text-primary">{subjectLabel(q.subject)}</p>
              <p className="font-display font-bold">{i + 1}. {q.question_text}</p>
              {q.image_url && <Img url={q.image_url} />}
              <div className="mt-3 space-y-2">
                {(Array.isArray(q.options) ? q.options : []).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                    className={
                      answers[q.id] === opt
                        ? "gradient-gold w-full rounded-xl px-4 py-2.5 text-start text-sm font-bold text-primary-foreground"
                        : "w-full rounded-xl border border-border px-4 py-2.5 text-start text-sm hover:bg-accent"
                    }
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
        <Button className="gradient-gold mt-5 w-full font-bold" onClick={() => void finish("تم تسليم الامتحان")}>
          تسليم الامتحان
        </Button>
      </AppShell>
    );
  }

  // not started
  const d = champ.data;
  const row = d?.rounds.find((r) => r.round === round);
  const st = roundState(row);
  const me = d?.me;
  const myMatch = d?.matches.find((m) => m.round === round && me && (m.p1 === me.id || m.p2 === me.id));
  const canStart = !!d?.settings?.bracket_published && st === "live" && !!row?.is_open && !!myMatch && !myMatch.winner;

  return (
    <AppShell title={title} subtitle={meta.ar}>
      <div className="hub-card mx-auto max-w-md space-y-3 p-8 text-center">
        <p className="text-5xl">{meta.medal}</p>
        <p className="font-bold">{ROUND_STATE_AR[st]}{st === "live" && !row?.is_open ? " — مغلقة حالياً" : ""}</p>
        <p className="text-sm text-muted-foreground">مدة الامتحان: {row?.duration_minutes ?? "—"} دقيقة</p>
        {!myMatch && <p className="text-sm text-destructive">أنت لست ضمن مواجهات هذه الجولة.</p>}
        <Button className="gradient-gold w-full font-bold" disabled={!canStart || busy} onClick={() => setConfirm(true)}>
          ▶️ بدء الامتحان
        </Button>
      </div>
      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>⚠️ تأكيد بدء الامتحان</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-start leading-relaxed">
              <span className="block">بمجرد بدء الامتحان، سيتم فتحه لك مرة واحدة فقط.</span>
              <span className="block">
                إذا خرجت من صفحة الامتحان أو حاولت الانتقال إلى صفحة أخرى، سيتم إغلاق المحاولة واعتبار الامتحان مُسلَّمًا.
              </span>
              <span className="block">سيتم اعتماد النتيجة بناءً على الإجابات التي تم حلها وحفظها حتى لحظة الخروج.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction disabled={busy} onClick={(e) => { e.preventDefault(); void start(); }}>
              بدء الامتحان
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
