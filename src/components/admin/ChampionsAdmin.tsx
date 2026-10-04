import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { uploadLibraryFile } from "@/lib/storage";
import { LibraryImage } from "@/components/LibraryImage";
import { Bracket, type ClPerson } from "@/components/champions/Bracket";
import {
  CL_ROUNDS,
  CL_SUBJECTS,
  GENDER_AR,
  ROUND_STATE_AR,
  TRACK_AR,
  fmtElapsed,
  roundState,
  subjectLabel,
  type RoundRow,
} from "@/lib/champions";
import { Section } from "./AdminSections";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const NONE = "";

function useAdminCl() {
  return useQuery({
    queryKey: ["admin-cl"],
    refetchInterval: 15000,
    queryFn: async () => {
      await supabase.rpc("cl_refresh");
      const [s, p, r, m, a, q] = await Promise.all([
        supabase.from("cl_settings").select("*").eq("id", 1).maybeSingle(),
        supabase.from("cl_participants").select("*").order("seed", { nullsFirst: false }).order("created_at"),
        supabase.from("cl_rounds").select("*").order("round"),
        supabase.from("cl_matches").select("*").order("round").order("slot"),
        supabase.from("cl_attempts").select("*"),
        supabase.from("cl_questions").select("*").order("position").order("created_at"),
      ]);
      return {
        settings: s.data,
        participants: p.data ?? [],
        rounds: (r.data ?? []) as RoundRow[],
        matches: m.data ?? [],
        attempts: a.data ?? [],
        questions: q.data ?? [],
      };
    },
  });
}
type D = NonNullable<ReturnType<typeof useAdminCl>["data"]>;

export function ChampionsAdmin() {
  const { data, isLoading } = useAdminCl();
  if (isLoading || !data) return <p className="text-sm text-muted-foreground">جاري التحميل…</p>;
  return (
    <Tabs defaultValue="players" className="space-y-3">
      <TabsList className="flex h-auto flex-wrap justify-start">
        <TabsTrigger value="players">👥 المتسابقون</TabsTrigger>
        <TabsTrigger value="bracket">🗺️ الخريطة والمواجهات</TabsTrigger>
        <TabsTrigger value="rounds">📅 الجولات والمواعيد</TabsTrigger>
        <TabsTrigger value="questions">❓ أسئلة الجولات</TabsTrigger>
        <TabsTrigger value="results">📊 النتائج</TabsTrigger>
      </TabsList>
      <TabsContent value="players"><Players d={data} /></TabsContent>
      <TabsContent value="bracket"><BracketAdmin d={data} /></TabsContent>
      <TabsContent value="rounds"><RoundsAdmin d={data} /></TabsContent>
      <TabsContent value="questions"><QuestionsAdmin d={data} /></TabsContent>
      <TabsContent value="results"><Results d={data} /></TabsContent>
    </Tabs>
  );
}

const useInv = () => {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: ["admin-cl"] });
    void qc.invalidateQueries({ queryKey: ["champions"] });
  };
};

function Players({ d }: { d: D }) {
  const inv = useInv();
  const setReg = async (v: boolean) => {
    const { error } = await supabase.from("cl_settings").update({ registration_open: v, updated_at: new Date().toISOString() }).eq("id", 1);
    if (error) toast.error(error.message); else inv();
  };
  const upd = async (id: string, patch: { seed?: number; is_warned?: boolean; warning_note?: string | null }) => {
    const { error } = await supabase.from("cl_participants").update(patch).eq("id", id);
    if (error) toast.error(error.message); else inv();
  };
  const del = async (id: string) => {
    if (!confirm("حذف المتسابق من البطولة؟ سيتم تفريغ مكانه في المواجهة.")) return;
    const { error } = await supabase.from("cl_participants").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("تم الحذف"); inv(); }
  };
  const progress = (pid: string) => {
    const lostIn = d.matches.find((m) => m.winner && (m.p1 === pid || m.p2 === pid) && m.winner !== pid);
    const rounds = d.matches.filter((m) => m.p1 === pid || m.p2 === pid).map((m) => m.round);
    const top = rounds.length ? Math.max(...rounds) : 0;
    if (lostIn) return `❌ خرج في ${CL_ROUNDS[lostIn.round - 1]!.ar}`;
    const f = d.matches.find((m) => m.round === 4 && m.winner === pid);
    if (f) return "🏆 بطل البطولة";
    return top ? `في ${CL_ROUNDS[top - 1]!.ar}` : "لم يُحدد في الخريطة";
  };
  return (
    <Section title={`المتسابقون (${d.participants.length}/16)`}>
      <div className="flex items-center gap-3 rounded-xl border border-border p-3 text-sm">
        <Switch checked={!!d.settings?.registration_open} onCheckedChange={(v) => void setReg(v)} />
        <span>التسجيل {d.settings?.registration_open ? "مفتوح" : "مغلق"} (يُغلق تلقائياً عند 16)</span>
      </div>
      {d.participants.length === 0 && <p className="text-sm text-muted-foreground">لا يوجد متسابقون بعد.</p>}
      <div className="space-y-2">
        {d.participants.map((p) => (
          <div key={p.id} className="rounded-xl border border-border p-3 text-sm">
            <div className="flex flex-wrap items-center gap-3">
              <Input
                type="number"
                className="w-16"
                defaultValue={p.seed ?? ""}
                title="الترتيب"
                onBlur={(e) => e.target.value && Number(e.target.value) !== p.seed && void upd(p.id, { seed: Number(e.target.value) })}
              />
              <span className="text-2xl">{p.emoji}</span>
              <div className="min-w-40 flex-1">
                <p className="font-bold">{p.name} {p.is_warned && <span className="text-destructive">⚠️ محذّر</span>}</p>
                <p className="text-xs text-muted-foreground" dir="ltr">{p.phone}</p>
                <p className="text-xs text-muted-foreground">
                  {GENDER_AR[p.gender]} · {p.study_type === "general" ? "عام" : "لغات"} · {progress(p.id)}
                </p>
              </div>
              {p.is_warned ? (
                <Button size="sm" variant="outline" onClick={() => void upd(p.id, { is_warned: false, warning_note: null })}>إلغاء التحذير</Button>
              ) : (
                <Button size="sm" variant="outline" onClick={() => {
                  const note = prompt("سبب التحذير (اختياري)") ?? "";
                  void upd(p.id, { is_warned: true, warning_note: note || null });
                }}>⚠️ تحذير</Button>
              )}
              <Button size="icon" variant="ghost" onClick={() => void del(p.id)}><Trash2 className="size-4 text-destructive" /></Button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
              {CL_ROUNDS.map((r) => {
                const a = d.attempts.find((x) => x.round === r.round && x.participant_id === p.id);
                return (
                  <span key={r.round} className="rounded-full bg-accent px-2 py-0.5">
                    {r.medal} {!a ? "لم يبدأ" : a.status === "submitted" ? `أنهى · ${Number(a.percentage)}% · ${fmtElapsed(a.started_at, a.submitted_at)}` : "بدأ الامتحان"}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function BracketAdmin({ d }: { d: D }) {
  const inv = useInv();
  const [round, setRound] = useState(1);
  const meta = CL_ROUNDS[round - 1]!;
  const row = d.rounds.find((r) => r.round === round);
  const locked = roundState(row) !== "not_started";
  const people = new Map<string, ClPerson>(d.participants.map((p) => [p.id, { id: p.id, name: p.name, emoji: p.emoji, is_warned: p.is_warned }]));
  const usedInRound = (exceptSlot: number) =>
    new Set(d.matches.filter((m) => m.round === round && m.slot !== exceptSlot).flatMap((m) => [m.p1, m.p2]).filter(Boolean) as string[]);

  const setSide = async (slot: number, side: "p1" | "p2", val: string) => {
    const existing = d.matches.find((m) => m.round === round && m.slot === slot);
    const v = val || null;
    const patch = side === "p1" ? { p1: v } : { p2: v };
    const { error } = existing
      ? await supabase.from("cl_matches").update(patch).eq("id", existing.id)
      : await supabase.from("cl_matches").insert({ round, slot, ...patch });
    if (error) toast.error(error.message); else inv();
  };
  const setWinner = async (matchId: string, w: string) => {
    const { error } = await supabase.rpc("cl_admin_set_winner", { _match: matchId, _winner: (w || null) as string });
    if (error) toast.error(error.message); else { toast.success("تم تحديث الفائز"); inv(); }
  };
  const publish = async (v: boolean) => {
    if (v && d.matches.filter((m) => m.round === 1 && m.p1 && m.p2).length < 8 && !confirm("لم تكتمل 8 مواجهات لدور الـ16. اعتماد الخريطة على أي حال؟")) return;
    const { error } = await supabase.from("cl_settings").update({ bracket_published: v }).eq("id", 1);
    if (error) toast.error(error.message); else { toast.success(v ? "تم اعتماد الخريطة ونشرها" : "تم إخفاء الخريطة"); inv(); }
  };

  return (
    <div className="space-y-3">
      <Section title="اعتماد الخريطة">
        <div className="flex items-center gap-3 text-sm">
          <Switch checked={!!d.settings?.bracket_published} onCheckedChange={(v) => void publish(v)} />
          <span>{d.settings?.bracket_published ? "✅ الخريطة معتمدة وظاهرة لكل المتسابقين" : "الخريطة غير منشورة بعد"}</span>
        </div>
      </Section>
      <Section title="تحديد المواجهات يدوياً">
        <div className="flex flex-wrap gap-2">
          {CL_ROUNDS.map((r) => (
            <Button key={r.round} size="sm" variant={round === r.round ? "default" : "outline"} onClick={() => setRound(r.round)}>
              {r.medal} {r.ar}
            </Button>
          ))}
        </div>
        {locked && <p className="text-xs text-destructive">🔒 بدأت هذه الجولة — لا يمكن تعديل المواجهات، يمكنك فقط تحديد الفائز يدوياً.</p>}
        <div className="grid gap-2 md:grid-cols-2">
          {Array.from({ length: meta.matches }).map((_, slot) => {
            const m = d.matches.find((x) => x.round === round && x.slot === slot);
            const used = usedInRound(slot);
            const opts = (cur: string | null, other: string | null) =>
              d.participants.filter((p) => p.id === cur || (!used.has(p.id) && p.id !== other));
            return (
              <div key={slot} className="space-y-2 rounded-xl border border-border p-3 text-sm">
                <p className="text-xs font-bold text-primary">
                  المواجهة {slot + 1}{round < 4 ? ` ← تتأهل إلى ${CL_ROUNDS[round]!.ar} مواجهة ${Math.floor(slot / 2) + 1}` : ""}
                </p>
                {(["p1", "p2"] as const).map((side) => (
                  <select
                    key={side}
                    disabled={locked}
                    className="w-full rounded-lg border border-border bg-background p-2"
                    value={m?.[side] ?? NONE}
                    onChange={(e) => void setSide(slot, side, e.target.value)}
                  >
                    <option value={NONE}>— اختر متسابق —</option>
                    {opts(m?.[side] ?? null, m?.[side === "p1" ? "p2" : "p1"] ?? null).map((p) => (
                      <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>
                    ))}
                  </select>
                ))}
                {m && (m.p1 || m.p2) && (
                  <select
                    className="w-full rounded-lg border border-primary/40 bg-background p-2"
                    value={m.winner ?? NONE}
                    onChange={(e) => void setWinner(m.id, e.target.value)}
                  >
                    <option value={NONE}>الفائز: يُحدد تلقائياً</option>
                    {[m.p1, m.p2].filter(Boolean).map((pid) => (
                      <option key={pid!} value={pid!}>🏆 {people.get(pid!)?.emoji} {people.get(pid!)?.name}</option>
                    ))}
                  </select>
                )}
              </div>
            );
          })}
        </div>
      </Section>
      <Bracket matches={d.matches} people={people} />
    </div>
  );
}

const toLocal = (iso: string | null) => {
  if (!iso) return "";
  const dt = new Date(iso);
  return new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

function RoundEditor({ row }: { row: RoundRow }) {
  const inv = useInv();
  const meta = CL_ROUNDS[row.round - 1]!;
  const [start, setStart] = useState(toLocal(row.start_at));
  const [end, setEnd] = useState(toLocal(row.end_at));
  const [dur, setDur] = useState(row.duration_minutes);
  const [limit, setLimit] = useState<string>(row.question_limit?.toString() ?? "");
  useEffect(() => {
    setStart(toLocal(row.start_at)); setEnd(toLocal(row.end_at)); setDur(row.duration_minutes); setLimit(row.question_limit?.toString() ?? "");
  }, [row]);
  const st = roundState(row);
  const locked = st !== "not_started";
  const save = async () => {
    if (!start || !end) { toast.error("حدد موعد البداية والنهاية"); return; }
    if (new Date(end) <= new Date(start)) { toast.error("النهاية يجب أن تكون بعد البداية"); return; }
    if (dur < 1) { toast.error("مدة غير صحيحة"); return; }
    const { error } = await supabase.from("cl_rounds").update({
      start_at: new Date(start).toISOString(),
      end_at: new Date(end).toISOString(),
      duration_minutes: dur,
      question_limit: limit ? Number(limit) : null,
      updated_at: new Date().toISOString(),
    }).eq("round", row.round);
    if (error) toast.error(error.message); else { toast.success("تم حفظ الجولة"); inv(); }
  };
  const toggle = async (v: boolean) => {
    const { error } = await supabase.from("cl_rounds").update({ is_open: v }).eq("round", row.round);
    if (error) toast.error(error.message); else inv();
  };
  return (
    <Section title={`${meta.medal} ${meta.en}`}>
      <p className="text-xs font-bold">{ROUND_STATE_AR[st]}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1"><Label className="text-xs">Start Date & Time</Label><Input type="datetime-local" disabled={locked} value={start} onChange={(e) => setStart(e.target.value)} /></div>
        <div className="space-y-1"><Label className="text-xs">End Date & Time</Label><Input type="datetime-local" disabled={locked} value={end} onChange={(e) => setEnd(e.target.value)} /></div>
        <div className="space-y-1"><Label className="text-xs">مدة الامتحان (دقيقة)</Label><Input type="number" min={1} disabled={locked} value={dur} onChange={(e) => setDur(Number(e.target.value))} /></div>
        <div className="space-y-1"><Label className="text-xs">العدد النهائي للأسئلة لكل متسابق (فارغ = كل الأسئلة)</Label><Input type="number" min={1} disabled={locked} value={limit} onChange={(e) => setLimit(e.target.value)} /></div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button className="gradient-gold font-bold" disabled={locked} onClick={() => void save()}>حفظ</Button>
        <div className="flex items-center gap-2 text-sm">
          <Switch checked={row.is_open} onCheckedChange={(v) => void toggle(v)} />
          <span>{row.is_open ? "🟢 الجولة مفتوحة" : "🔒 الجولة مغلقة"}</span>
        </div>
        {locked && <span className="text-xs text-muted-foreground">🔒 لا يمكن تغيير المواعيد بعد بدء الجولة</span>}
      </div>
    </Section>
  );
}

function RoundsAdmin({ d }: { d: D }) {
  return <div className="space-y-3">{d.rounds.map((r) => <RoundEditor key={r.round} row={r} />)}</div>;
}

function QuestionsAdmin({ d }: { d: D }) {
  const inv = useInv();
  const [round, setRound] = useState(1);
  const [subject, setSubject] = useState<string>("arabic");
  const [track, setTrack] = useState("all");
  const [text, setText] = useState("");
  const [image, setImage] = useState("");
  const [options, setOptions] = useState<string[]>(["", "", "", ""]);
  const [correct, setCorrect] = useState("");
  const [explanation, setExplanation] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const split = CL_SUBJECTS.find((s) => s.key === subject)?.split;
  useEffect(() => { setTrack(split ? "general" : "all"); }, [split]);

  const reset = () => { setText(""); setImage(""); setOptions(["", "", "", ""]); setCorrect(""); setExplanation(""); setEditing(null); };
  const upload = async (f: File) => {
    setUploading(true);
    try { setImage(await uploadLibraryFile(f)); toast.success("تم رفع الصورة"); }
    catch (e) { toast.error(e instanceof Error ? e.message : "فشل الرفع"); }
    finally { setUploading(false); }
  };
  const save = async () => {
    const opts = options.map((o) => o.trim()).filter(Boolean);
    if (!text.trim() && !image) { toast.error("اكتب السؤال أو أضف صورة"); return; }
    if (opts.length < 2) { toast.error("أضف اختيارين على الأقل"); return; }
    if (!correct || !opts.includes(correct)) { toast.error("حدد الإجابة الصحيحة"); return; }
    const payload = {
      round, subject, track: split ? track : "all", question_text: text.trim(), image_url: image || null,
      options: opts, correct_answer: correct, explanation: explanation.trim() || null,
    };
    const { error } = editing
      ? await supabase.from("cl_questions").update(payload).eq("id", editing)
      : await supabase.from("cl_questions").insert({ ...payload, position: d.questions.filter((q) => q.round === round).length });
    if (error) { toast.error(error.message); return; }
    toast.success(editing ? "تم تعديل السؤال" : "تمت إضافة السؤال");
    reset(); inv();
  };
  const edit = (q: D["questions"][number]) => {
    setEditing(q.id); setRound(q.round); setSubject(q.subject); setTimeout(() => setTrack(q.track), 0);
    setText(q.question_text); setImage(q.image_url ?? "");
    const o = (q.options as string[]) ?? []; setOptions([...o, ...Array(Math.max(0, 4 - o.length)).fill("")]);
    setCorrect(q.correct_answer); setExplanation(q.explanation ?? "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const del = async (id: string) => {
    if (!confirm("حذف السؤال؟")) return;
    const { error } = await supabase.from("cl_questions").delete().eq("id", id);
    if (error) toast.error(error.message); else inv();
  };
  const list = d.questions.filter((q) => q.round === round);
  const count = (s: string, t?: string) => list.filter((q) => q.subject === s && (!t || q.track === t)).length;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {CL_ROUNDS.map((r) => (
          <Button key={r.round} size="sm" variant={round === r.round ? "default" : "outline"} onClick={() => { setRound(r.round); reset(); }}>
            {r.medal} {r.en}
          </Button>
        ))}
      </div>
      <Section title="توزيع الأسئلة في هذه الجولة">
        <div className="grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-3">
          {CL_SUBJECTS.map((s) => (
            <div key={s.key} className="rounded-lg bg-accent p-2">
              <b>{s.flag} {s.ar}</b> —{" "}
              {s.split ? `عام ${count(s.key, "general")}/${s.count} · لغات ${count(s.key, "languages")}/${s.count}` : `${count(s.key)}/${s.count}`}
            </div>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground">
          المتسابق "عام" يرى أسئلة Math وIntegrated Science الخاصة بالعام، و"لغات" يرى الخاصة باللغات، وباقي المواد للجميع. يمكنك تحديد العدد النهائي للأسئلة من إعدادات الجولة.
        </p>
      </Section>
      <Section title={editing ? "✏️ تعديل سؤال" : "➕ إضافة سؤال"}>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs">المادة</Label>
            <select className="w-full rounded-lg border border-border bg-background p-2 text-sm" value={subject} onChange={(e) => setSubject(e.target.value)}>
              {CL_SUBJECTS.map((s) => <option key={s.key} value={s.key}>{s.flag} {s.ar} — {s.en}</option>)}
            </select>
          </div>
          {split && (
            <div className="space-y-1">
              <Label className="text-xs">نوع الدراسة</Label>
              <select className="w-full rounded-lg border border-border bg-background p-2 text-sm" value={track} onChange={(e) => setTrack(e.target.value)}>
                <option value="general">عام</option>
                <option value="languages">لغات</option>
              </select>
            </div>
          )}
        </div>
        <Textarea
          placeholder="نص السؤال (أو الصق صورة هنا)"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onPaste={(e) => {
            const f = Array.from(e.clipboardData.files).find((x) => x.type.startsWith("image/"));
            if (f) { e.preventDefault(); void upload(f); }
          }}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Input className="flex-1" placeholder="رابط صورة السؤال (اختياري)" value={image.startsWith("sb://") ? "" : image} onChange={(e) => setImage(e.target.value)} />
          <Input type="file" accept="image/*" className="w-56" disabled={uploading} onChange={(e) => e.target.files?.[0] && void upload(e.target.files[0])} />
          {image && <Button size="sm" variant="ghost" onClick={() => setImage("")}>إزالة الصورة</Button>}
        </div>
        {image && (image.startsWith("sb://") ? <LibraryImage url={image} alt="" className="max-h-40 rounded-lg" /> : <img src={image} alt="" className="max-h-40 rounded-lg" />)}
        <div className="space-y-2">
          <Label className="text-xs">الاختيارات — اضغط ✔ لتحديد الإجابة الصحيحة</Label>
          {options.map((o, i) => (
            <div key={i} className="flex gap-2">
              <Button size="sm" type="button" variant={correct && correct === o.trim() ? "default" : "outline"} onClick={() => o.trim() && setCorrect(o.trim())}>✔</Button>
              <Input value={o} placeholder={`اختيار ${i + 1}`} onChange={(e) => { const n = [...options]; if (correct === n[i]?.trim()) setCorrect(e.target.value.trim()); n[i] = e.target.value; setOptions(n); }} />
            </div>
          ))}
          <Button size="sm" variant="ghost" onClick={() => setOptions([...options, ""])}>+ اختيار</Button>
        </div>
        <Textarea placeholder="شرح / سبب الإجابة (اختياري)" value={explanation} onChange={(e) => setExplanation(e.target.value)} />
        <div className="flex gap-2">
          <Button className="gradient-gold font-bold" onClick={() => void save()}>{editing ? "حفظ التعديل" : "إضافة السؤال"}</Button>
          {editing && <Button variant="outline" onClick={reset}>إلغاء</Button>}
        </div>
      </Section>
      <Section title={`أسئلة ${CL_ROUNDS[round - 1]!.en} (${list.length})`}>
        {list.length === 0 && <p className="text-sm text-muted-foreground">لا توجد أسئلة بعد.</p>}
        {list.map((q, i) => (
          <div key={q.id} className="flex gap-2 rounded-xl border border-border p-3 text-sm">
            <div className="flex-1">
              <p className="text-[11px] font-bold text-primary">{subjectLabel(q.subject)} · {TRACK_AR[q.track]}</p>
              <p className="font-bold">{i + 1}. {q.question_text}</p>
              <p className="text-xs text-muted-foreground">✔️ {q.correct_answer}</p>
            </div>
            <Button size="icon" variant="ghost" onClick={() => edit(q)}><Pencil className="size-4" /></Button>
            <Button size="icon" variant="ghost" onClick={() => void del(q.id)}><Trash2 className="size-4 text-destructive" /></Button>
          </div>
        ))}
      </Section>
    </div>
  );
}

function Results({ d }: { d: D }) {
  const p = new Map(d.participants.map((x) => [x.id, x]));
  return (
    <div className="space-y-3">
      {CL_ROUNDS.map((r) => {
        const ms = d.matches.filter((m) => m.round === r.round);
        return (
          <Section key={r.round} title={`${r.medal} ${r.en}`}>
            {ms.length === 0 && <p className="text-sm text-muted-foreground">لا توجد مواجهات بعد.</p>}
            {ms.map((m) => (
              <div key={m.id} className="grid gap-2 rounded-xl border border-border p-3 text-sm sm:grid-cols-2">
                {[m.p1, m.p2].map((pid, i) => {
                  const who = pid ? p.get(pid) : undefined;
                  const a = d.attempts.find((x) => x.round === r.round && x.participant_id === pid);
                  return (
                    <div key={i} className={m.winner && m.winner === pid ? "font-bold text-primary" : ""}>
                      {who ? `${who.emoji} ${who.name}` : "— فارغ —"} {m.winner && pid && m.winner !== pid && "❌ X"} {m.winner === pid && pid && "🏆"}
                      <p className="text-xs text-muted-foreground">
                        {!a ? "لم يبدأ" : a.status === "submitted" ? `${a.score}/${a.total} · ${Number(a.percentage)}% · ${fmtElapsed(a.started_at, a.submitted_at)}` : "بدأ ولم يُسلّم"}
                      </p>
                    </div>
                  );
                })}
              </div>
            ))}
          </Section>
        );
      })}
    </div>
  );
}
