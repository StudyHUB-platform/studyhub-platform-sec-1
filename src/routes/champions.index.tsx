import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Bracket } from "@/components/champions/Bracket";
import { useChampions } from "@/hooks/useChampions";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { CL_EMOJIS, CL_ROUNDS, ROUND_STATE_AR, fmtDate, roundState } from "@/lib/champions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/champions/")({
  head: () => ({
    meta: [
      { title: "Study HUB Champions League 🏆" },
      { name: "description", content: "بطولة Study HUB التعليمية: 16 متسابق، 4 جولات، وخريطة مواجهات حتى النهائي." },
      { property: "og:title", content: "Study HUB Champions League 🏆" },
      { property: "og:description", content: "سجّل في البطولة وتابع خريطة المواجهات حتى التتويج." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ChampionsPage,
});

function ChampionsPage() {
  const { data, isLoading } = useChampions();

  return (
    <AppShell title="Study HUB Champions League 🏆" subtitle="بطولة تعليمية لـ16 متسابق — 4 جولات حتى النهائي">
      {isLoading || !data ? (
        <p className="text-sm text-muted-foreground">جاري التحميل…</p>
      ) : !data.me ? (
        data.settings?.registration_open && data.count < 16 ? (
          <RegisterForm count={data.count} />
        ) : (
          <div className="hub-card mx-auto max-w-md p-8 text-center">
            <p className="text-4xl">🔒</p>
            <p className="font-display mt-3 text-lg font-bold">التسجيل في البطولة مغلق</p>
            <p className="mt-2 text-sm text-muted-foreground">
              المسابقة متاحة فقط للحسابات المسجلة فيها ({data.count}/16).
            </p>
          </div>
        )
      ) : (
        <Registered data={data} />
      )}
    </AppShell>
  );
}

function Registered({ data }: { data: NonNullable<ReturnType<typeof useChampions>["data"]> }) {
  const me = data.me!;
  const now = Date.now();
  return (
    <div className="space-y-5">
      <div className="tone-card tone-blue flex flex-wrap items-center gap-4 p-5">
        <span className="text-5xl">{me.emoji}</span>
        <div className="flex-1">
          <p className="font-display text-lg font-extrabold">{me.name}</p>
          <p className="text-xs opacity-80">
            {me.study_type === "general" ? "عام" : "لغات"} · متسابق رقم {me.seed ?? "—"}
          </p>
        </div>
        <span className="rounded-full bg-primary/20 px-3 py-1 text-xs font-bold">{data.count}/16 متسابق</span>
      </div>

      {me.is_warned && (
        <div className="rounded-xl border border-destructive bg-destructive/10 p-4 text-sm font-bold text-destructive">
          ⚠️ لديك تحذير من إدارة البطولة{me.warning_note ? `: ${me.warning_note}` : ""}
        </div>
      )}

      {!data.settings?.bracket_published ? (
        <div className="hub-card p-8 text-center">
          <p className="text-4xl">⏳</p>
          <p className="font-display mt-3 font-bold">
            {data.count < 16 ? "في انتظار اكتمال 16 متسابق" : "في انتظار اعتماد خريطة البطولة من الإدارة"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">تم التسجيل: {data.count}/16</p>
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {CL_ROUNDS.map((r) => {
              const row = data.rounds.find((x) => x.round === r.round);
              const st = roundState(row, now);
              const myMatch = data.matches.find(
                (m) => m.round === r.round && (m.p1 === me.id || m.p2 === me.id),
              );
              const myAttempt = data.attempts.find((a) => a.round === r.round && a.participant_id === me.id);
              const canStart = st === "live" && row?.is_open && myMatch && !myMatch.winner && !myAttempt;
              return (
                <div key={r.round} className="hub-card space-y-2 p-4">
                  <p className="font-display text-sm font-bold">
                    {r.medal} {r.en}
                  </p>
                  <p className="text-xs font-bold">{ROUND_STATE_AR[st]}</p>
                  <p className="text-[11px] text-muted-foreground">البداية: {fmtDate(row?.start_at ?? null)}</p>
                  <p className="text-[11px] text-muted-foreground">النهاية: {fmtDate(row?.end_at ?? null)}</p>
                  <p className="text-[11px] text-muted-foreground">المدة: {row?.duration_minutes ?? "—"} دقيقة</p>
                  {myMatch && (
                    <div className="flex flex-col gap-2 pt-1">
                      {myAttempt ? (
                        <Button size="sm" variant="outline" asChild>
                          <Link to="/champions/exam/$round" params={{ round: String(r.round) }}>
                            {myAttempt.status === "submitted" ? "📊 نتيجتي وإجاباتي" : "متابعة"}
                          </Link>
                        </Button>
                      ) : (
                        <Button size="sm" className="gradient-gold font-bold" disabled={!canStart} asChild={!!canStart}>
                          {canStart ? (
                            <Link to="/champions/exam/$round" params={{ round: String(r.round) }}>
                              ▶️ بدء الامتحان
                            </Link>
                          ) : (
                            <span>▶️ بدء الامتحان</span>
                          )}
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" asChild>
                        <Link to="/champions/match/$matchId" params={{ matchId: myMatch.id }}>
                          تفاصيل مواجهتي
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <h2 className="font-display text-lg font-bold">🏆 Tournament Bracket</h2>
          <Bracket matches={data.matches} people={data.people} />
        </>
      )}
    </div>
  );
}

function RegisterForm({ count }: { count: number }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<"boy" | "girl" | "">("");
  const [study, setStudy] = useState<"general" | "languages" | "">("");
  const [emoji, setEmoji] = useState("");
  const [busy, setBusy] = useState(false);

  const { data: taken = [] } = useQuery({
    queryKey: ["cl-taken"],
    refetchInterval: 10000,
    queryFn: async () => ((await supabase.rpc("cl_taken_emojis")).data ?? []) as string[],
  });
  const { data: profile } = useQuery({
    queryKey: ["profile-mini", user?.id],
    enabled: !!user,
    queryFn: async () =>
      (await supabase.from("profiles").select("full_name, phone").eq("id", user!.id).maybeSingle()).data,
  });
  useEffect(() => {
    if (profile) {
      setName((v) => v || profile.full_name || "");
      setPhone((v) => v || profile.phone || "");
    }
  }, [profile]);

  const submit = async () => {
    if (name.trim().length < 2) { toast.error("اكتب الاسم"); return; }
    if (!/^\d{11}$/.test(phone)) { toast.error("رقم الهاتف يجب أن يكون 11 رقم"); return; }
    if (!gender) { toast.error("اختر النوع"); return; }
    if (!study) { toast.error("اختر نوع الدراسة"); return; }
    if (!emoji) { toast.error("اختر Emoji خاص بك"); return; }
    setBusy(true);
    const { error } = await supabase.rpc("cl_register", {
      _name: name.trim(),
      _phone: phone,
      _gender: gender,
      _study_type: study,
      _emoji: emoji,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      void qc.invalidateQueries({ queryKey: ["cl-taken"] });
      return;
    }
    toast.success("تم تسجيلك في البطولة 🏆");
    void qc.invalidateQueries({ queryKey: ["champions"] });
  };

  const choice = (active: boolean) =>
    cn(
      "flex-1 rounded-xl border px-4 py-3 text-sm font-bold transition",
      active ? "gradient-gold border-transparent text-primary-foreground" : "border-border hover:bg-accent",
    );

  return (
    <div className="hub-card mx-auto max-w-2xl space-y-4 p-6">
      <div className="text-center">
        <p className="text-4xl">🏆</p>
        <p className="font-display mt-2 text-xl font-extrabold">التسجيل في Study HUB Champions League</p>
        <p className="mt-1 text-sm text-muted-foreground">المقاعد المتبقية: {16 - count} من 16</p>
      </div>
      <div className="space-y-1.5">
        <Label>1. الاسم</Label>
        <Input value={name} maxLength={60} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>2. رقم الهاتف</Label>
        <Input
          value={phone}
          inputMode="numeric"
          maxLength={11}
          dir="ltr"
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
          placeholder="01xxxxxxxxx"
        />
      </div>
      <div className="space-y-1.5">
        <Label>3. النوع</Label>
        <div className="flex gap-2">
          <button className={choice(gender === "boy")} onClick={() => setGender("boy")}>ولد 👦</button>
          <button className={choice(gender === "girl")} onClick={() => setGender("girl")}>بنت 👧</button>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>4. نوع الدراسة</Label>
        <div className="flex gap-2">
          <button className={choice(study === "general")} onClick={() => setStudy("general")}>عام</button>
          <button className={choice(study === "languages")} onClick={() => setStudy("languages")}>لغات</button>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>5. اختر Emoji خاص بك (المحجوز لا يمكن اختياره)</Label>
        <div className="grid grid-cols-8 gap-1.5 sm:grid-cols-12">
          {CL_EMOJIS.map((e) => {
            const isTaken = taken.includes(e);
            return (
              <button
                key={e}
                disabled={isTaken}
                onClick={() => setEmoji(e)}
                title={isTaken ? "محجوز" : ""}
                className={cn(
                  "aspect-square rounded-lg border text-2xl transition",
                  emoji === e ? "border-primary bg-primary/20 ring-2 ring-primary" : "border-border hover:bg-accent",
                  isTaken && "cursor-not-allowed opacity-25 grayscale",
                )}
              >
                {e}
              </button>
            );
          })}
        </div>
      </div>
      <Button className="gradient-gold w-full font-bold" disabled={busy} onClick={() => void submit()}>
        {busy ? "جاري التسجيل…" : "تسجيل في البطولة"}
      </Button>
    </div>
  );
}
