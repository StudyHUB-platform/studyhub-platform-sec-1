import { createFileRoute, Link } from "@tanstack/react-router";

import { AppShell } from "@/components/AppShell";
import { useChampions } from "@/hooks/useChampions";
import { CL_ROUNDS, ROUND_STATE_AR, fmtDate, fmtElapsed, roundState } from "@/lib/champions";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/champions/match/$matchId")({
  head: () => ({
    meta: [
      { title: "تفاصيل المواجهة — Champions League" },
      { name: "description", content: "تفاصيل مواجهة في بطولة Study HUB: المتسابقين والنتائج والفائز." },
      { property: "og:title", content: "تفاصيل المواجهة — Champions League" },
      { property: "og:description", content: "نتيجة كل متسابق والنسبة ووقت الإكمال والمتأهل." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MatchDetails,
});

function MatchDetails() {
  const { matchId } = Route.useParams();
  const { data, isLoading } = useChampions();
  const m = data?.matches.find((x) => x.id === matchId);

  if (isLoading || !data) {
    return (
      <AppShell title="تفاصيل المواجهة">
        <p className="text-sm text-muted-foreground">جاري التحميل…</p>
      </AppShell>
    );
  }
  if (!m) {
    return (
      <AppShell title="تفاصيل المواجهة">
        <div className="hub-card p-8 text-center">
          <p>المواجهة غير متاحة.</p>
          <Button asChild className="gradient-gold mt-4 font-bold">
            <Link to="/champions">العودة للبطولة</Link>
          </Button>
        </div>
      </AppShell>
    );
  }
  const r = CL_ROUNDS.find((x) => x.round === m.round)!;
  const row = data.rounds.find((x) => x.round === m.round);
  const st = roundState(row);
  const side = (pid: string | null) => {
    const person = pid ? data.people.get(pid) : undefined;
    const a = pid ? data.attempts.find((x) => x.round === m.round && x.participant_id === pid) : undefined;
    const status = !a
      ? st === "ended"
        ? "لم يبدأ — 0%"
        : "لم يبدأ الامتحان بعد"
      : a.status === "submitted"
        ? "أنهى الامتحان ✅"
        : "بدأ الامتحان ⏳";
    const won = m.winner && pid === m.winner;
    const lost = m.winner && pid && pid !== m.winner;
    return (
      <div className={`hub-card flex-1 p-5 text-center ${won ? "ring-2 ring-primary" : ""}`}>
        <p className="text-5xl">{person?.emoji ?? "❔"}</p>
        <p className="font-display mt-2 text-lg font-extrabold">
          {person?.name ?? "في الانتظار"} {lost && <span className="text-destructive">❌ X</span>}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">{pid ? status : ""}</p>
        {a?.status === "submitted" && (
          <div className="mt-3 space-y-1 text-sm">
            <p>النتيجة: <b>{a.score}/{a.total}</b></p>
            <p>النسبة: <b className="text-primary">{Number(a.percentage)}%</b></p>
            <p>وقت الإكمال: <b>{fmtElapsed(a.started_at, a.submitted_at)}</b></p>
          </div>
        )}
        {won && <p className="mt-3 text-sm font-extrabold text-primary">🏆 الفائز — متأهل للجولة التالية</p>}
        {lost && <p className="mt-3 text-sm font-bold text-destructive">الخاسر — خرج من البطولة</p>}
      </div>
    );
  };
  const winner = m.winner ? data.people.get(m.winner) : undefined;

  return (
    <AppShell title="Match Details" subtitle={`${r.medal} ${r.en} — ${r.ar}`}>
      <div className="flex flex-col items-stretch gap-4 md:flex-row md:items-center">
        {side(m.p1)}
        <p className="font-display text-center text-3xl font-extrabold text-primary">VS</p>
        {side(m.p2)}
      </div>
      <div className="hub-card mt-5 grid gap-2 p-5 text-sm sm:grid-cols-2">
        <p>الحالة: <b>{ROUND_STATE_AR[st]}</b></p>
        <p>مدة الامتحان: <b>{row?.duration_minutes ?? "—"} دقيقة</b></p>
        <p>موعد البداية: <b>{fmtDate(row?.start_at ?? null)}</b></p>
        <p>موعد النهاية: <b>{fmtDate(row?.end_at ?? null)}</b></p>
        <p>الفائز: <b>{winner ? `${winner.emoji} ${winner.name}` : "لم يُحسم بعد"}</b></p>
        <p>
          المتأهل للجولة التالية:{" "}
          <b>{winner ? (m.round === 4 ? `🏆 بطل البطولة ${winner.emoji} ${winner.name}` : `${winner.emoji} ${winner.name}`) : "—"}</b>
        </p>
      </div>
      <Button asChild variant="outline" className="mt-4">
        <Link to="/champions">← خريطة البطولة</Link>
      </Button>
    </AppShell>
  );
}
