import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CheckCircle2, Pencil, Plus, Send, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { ALL_SUBJECTS } from "@/lib/hub";
import { uploadLibraryFile } from "@/lib/storage";
import { LibraryImage } from "@/components/LibraryImage";
import { Section } from "./AdminSections";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STATUS_AR: Record<string, string> = {
  draft: "📄 مسودة",
  published: "✅ منشور",
  ended: "🔴 انتهى — مغلق",
};

export function ExamsAdmin() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [subject, setSubject] = useState<string>(ALL_SUBJECTS[0]!);
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(30);
  const [selected, setSelected] = useState<string | null>(null);
  const [editingExam, setEditingExam] = useState<string | null>(null);

  const [qText, setQText] = useState("");
  const [qType, setQType] = useState("mcq");
  const [options, setOptions] = useState("");
  const [correct, setCorrect] = useState("");
  const [points, setPoints] = useState(1);
  const [imageUrl, setImageUrl] = useState("");
  const [explanation, setExplanation] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["admin-exams"] });
    void qc.invalidateQueries({ queryKey: ["exams"] });
    void qc.invalidateQueries({ queryKey: ["admin-questions", selected] });
    void qc.invalidateQueries({ queryKey: ["admin-attempts", selected] });
  };

  const uploadQuestionImage = async (file: File) => {
    setUploadingImage(true);
    try {
      setImageUrl(await uploadLibraryFile(file));
      toast.success("تم رفع صورة السؤال");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل رفع الصورة");
    } finally {
      setUploadingImage(false);
    }
  };

  const { data: exams } = useQuery({
    queryKey: ["admin-exams"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exams")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: questions } = useQuery({
    queryKey: ["admin-questions", selected],
    enabled: !!selected,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exam_questions")
        .select("*")
        .eq("exam_id", selected!)
        .order("position");
      if (error) throw error;
      return data;
    },
  });

  const { data: attempts } = useQuery({
    queryKey: ["admin-attempts", selected],
    enabled: !!selected,
    queryFn: async () => {
      const [{ data: rows, error }, { data: people }] = await Promise.all([
        supabase
          .from("exam_attempts")
          .select("id, user_id, score, total, percentage, created_at")
          .eq("exam_id", selected!)
          .order("percentage", { ascending: false }),
        supabase.from("profiles").select("id, full_name, email, phone"),
      ]);
      if (error) throw error;
      return (rows ?? []).map((r) => ({
        ...r,
        student: people?.find((p) => p.id === r.user_id),
      }));
    },
  });



  const resetExamForm = () => {
    setName("");
    setDescription("");
    setDuration(30);
    setEditingExam(null);
  };

  const createExam = useMutation({
    mutationFn: async () => {
      const fields = {
        name: name.trim(),
        subject,
        description: description.trim() || null,
        duration_minutes: duration,
      };
      if (editingExam) {
        const { error } = await supabase.from("exams").update(fields).eq("id", editingExam);
        if (error) throw error;
        return editingExam;
      }
      const { data, error } = await supabase
        .from("exams")
        .insert({ ...fields, status: "draft" })
        .select("id")
        .single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: (id) => {
      const wasEdit = Boolean(editingExam);
      resetExamForm();
      setSelected(id);
      invalidate();
      toast.success(wasEdit ? "تم تحديث الامتحان" : "تم إنشاء الامتحان كمسودة — أضف الأسئلة ثم انشره");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setStatus = useMutation({
    mutationFn: async (e: { id: string; status: string }) => {
      const { error } = await supabase.from("exams").update({ status: e.status }).eq("id", e.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const removeExam = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("exams").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      setSelected(null);
      resetExamForm();
      invalidate();
      toast.success("تم حذف الامتحان");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const resetQuestionForm = () => {
    setQText("");
    setOptions("");
    setCorrect("");
    setImageUrl("");
    setExplanation("");
    setEditingQuestion(null);
  };

  const addQuestion = useMutation({
    mutationFn: async () => {
      const opts =
        qType === "written"
          ? []
          : options
              .split("\n")
              .map((o) => o.trim())
              .filter(Boolean);
      const values = {
        question_text: qText.trim(),
        question_type: qType,
        options: opts,
        correct_answer: correct.trim(),
        points,
        image_url: imageUrl.trim() || null,
        explanation: explanation.trim() || null,
      };
      if (editingQuestion) {
        const { error } = await supabase
          .from("exam_questions")
          .update(values)
          .eq("id", editingQuestion);
        if (error) throw error;
        return;
      }
      const { error } = await supabase.from("exam_questions").insert({
        ...values,
        exam_id: selected!,
        position: (questions?.length ?? 0) + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      const wasEdit = Boolean(editingQuestion);
      resetQuestionForm();
      invalidate();
      toast.success(wasEdit ? "تم تحديث السؤال" : "تم إضافة السؤال");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeQuestion = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("exam_questions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return (
    <div className="space-y-4">
      <Section title={editingExam ? "✏️ تعديل الامتحان" : "📝 إنشاء امتحان جديد"}>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs">اسم الامتحان</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">المادة</Label>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_SUBJECTS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">المدة (دقيقة)</Label>
            <Input
              type="number"
              value={duration}
              onChange={(e) => setDuration(Math.max(1, Number(e.target.value) || 1))}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">الوصف</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            className="gradient-gold font-bold"
            disabled={!name.trim() || createExam.isPending}
            onClick={() => createExam.mutate()}
          >
            <Plus className="mr-1 size-4" /> {editingExam ? "حفظ التعديل" : "إنشاء كمسودة"}
          </Button>
          {editingExam && (
            <Button variant="outline" onClick={resetExamForm}>
              إلغاء
            </Button>
          )}
        </div>
      </Section>

      <Section title={`الامتحانات (${exams?.length ?? 0})`}>
        <div className="space-y-2">
          {exams?.map((e) => (
            <div
              key={e.id}
              className={
                selected === e.id
                  ? "rounded-xl border border-primary/50 bg-primary/10 p-3"
                  : "rounded-xl border border-border p-3"
              }
            >
              <div className="flex items-center gap-3">
                <button className="min-w-0 flex-1 text-left" onClick={() => setSelected(e.id)}>
                  <p className="truncate text-sm font-bold">{e.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {e.subject} · {e.duration_minutes} دقيقة · {STATUS_AR[e.status] ?? e.status}
                  </p>
                </button>
                <Select value={e.status} onValueChange={(v) => setStatus.mutate({ id: e.id, status: v })}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">📄 مسودة</SelectItem>
                    <SelectItem value="published">✅ منشور</SelectItem>
                    <SelectItem value="ended">🔒 منتهي</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    setEditingExam(e.id);
                    setSelected(e.id);
                    setName(e.name);
                    setSubject(e.subject);
                    setDescription(e.description ?? "");
                    setDuration(e.duration_minutes);
                  }}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    if (confirm(`حذف امتحان "${e.name}" وكل أسئلته؟`)) removeExam.mutate(e.id);
                  }}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {selected && (
        <Section title="➕ إضافة سؤال">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs">نص السؤال</Label>
              <Textarea value={qText} onChange={(e) => setQText(e.target.value)} rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">نوع السؤال</Label>
              <Select value={qType} onValueChange={setQType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mcq">اختيار من متعدد</SelectItem>
                  <SelectItem value="true_false">صح / خطأ</SelectItem>
                  <SelectItem value="written">مقالي قصير</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">الدرجة</Label>
              <Input
                type="number"
                value={points}
                onChange={(e) => setPoints(Math.max(1, Number(e.target.value) || 1))}
              />
            </div>
            {qType !== "written" && (
              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-xs">الاختيارات (كل اختيار في سطر)</Label>
                <Textarea
                  value={options}
                  onChange={(e) => setOptions(e.target.value)}
                  rows={3}
                  placeholder={qType === "true_false" ? "صح\nخطأ" : "أ\nب\nج\nد"}
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs">الإجابة الصحيحة</Label>
              <Input value={correct} onChange={(e) => setCorrect(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">صورة للسؤال (رابط، اختياري)</Label>
              <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
            </div>
          </div>
          <Button
            className="gradient-gold font-bold"
            disabled={!qText.trim() || !correct.trim()}
            onClick={() => addQuestion.mutate()}
          >
            <Plus className="mr-1 size-4" /> إضافة السؤال
          </Button>

          <div className="mt-3 space-y-2">
            {questions?.map((q, i) => (
              <div key={q.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                <p className="min-w-0 flex-1 truncate text-sm">
                  {i + 1}. {q.question_text}
                </p>
                <span className="text-xs text-muted-foreground">{q.points} د</span>
                <Button size="icon" variant="ghost" onClick={() => removeQuestion.mutate(q.id)}>
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

export function SupportAdmin() {
  const qc = useQueryClient();
  const [active, setActive] = useState<string | null>(null);
  const [body, setBody] = useState("");

  const { data: convos } = useQuery({
    queryKey: ["admin-support"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_conversations")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: students } = useQuery({
    queryKey: ["admin-support-students"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone");
      if (error) throw error;
      return data;
    },
  });

  const studentOf = (userId: string) => students?.find((s) => s.id === userId);

  const { data: messages } = useQuery({
    queryKey: ["admin-support-messages", active],
    enabled: !!active,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_messages")
        .select("*")
        .eq("conversation_id", active!)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const send = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from("support_messages").insert({
        conversation_id: active!,
        sender_id: u.user!.id,
        body: body.trim(),
        is_admin: true,
      });
      if (error) throw error;
      await supabase
        .from("support_conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", active!);
    },
    onSuccess: () => {
      setBody("");
      void qc.invalidateQueries({ queryKey: ["admin-support-messages", active] });
      void qc.invalidateQueries({ queryKey: ["admin-support"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setConvStatus = useMutation({
    mutationFn: async (v: { id: string; status: string }) => {
      const { error } = await supabase
        .from("support_conversations")
        .update({ status: v.status })
        .eq("id", v.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم تحديث حالة المحادثة");
      void qc.invalidateQueries({ queryKey: ["admin-support"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const current = convos?.find((c) => c.id === active);
  const student = current ? studentOf(current.user_id) : undefined;
  const closed = current?.status === "closed";

  return (
    <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
      <div className="space-y-2">
        {!convos?.length && <p className="hub-card p-4 text-sm text-muted-foreground">لا توجد تذاكر.</p>}
        {convos?.map((c) => {
          const s = studentOf(c.user_id);
          return (
            <button
              key={c.id}
              onClick={() => setActive(c.id)}
              className={
                active === c.id
                  ? "w-full rounded-xl border border-primary/50 bg-primary/10 p-3 text-left"
                  : "hub-card w-full p-3 text-left"
              }
            >
              <p className="truncate text-sm font-bold">{c.subject}</p>
              <p className="truncate text-xs text-muted-foreground">👤 {s?.full_name ?? "طالب"}</p>
              <p className="truncate text-xs text-muted-foreground">📧 {s?.email ?? "—"}</p>
              <p className="mt-1 text-[11px] font-bold text-primary">
                {c.status === "closed" ? "🔒 منتهية" : "🟢 مفتوحة"}
              </p>
            </button>
          );
        })}
      </div>

      <div className="hub-card flex h-[60vh] flex-col p-0">
        {!active ? (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            اختر تذكرة للرد
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{current?.subject}</p>
                <p className="truncate text-xs text-muted-foreground">
                  👤 {student?.full_name ?? "طالب"} · 📧 {student?.email ?? "—"} · 📱{" "}
                  {student?.phone ?? "—"}
                </p>
              </div>
              {closed ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setConvStatus.mutate({ id: active, status: "active" })}
                >
                  <CheckCircle2 className="mr-1 size-3.5" /> إعادة فتح
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setConvStatus.mutate({ id: active, status: "closed" })}
                >
                  <X className="mr-1 size-3.5" /> إنهاء المحادثة
                </Button>
              )}
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {!messages?.length && (
                <p className="text-center text-sm text-muted-foreground">لا توجد رسائل بعد.</p>
              )}
              {messages?.map((m) => (
                <div key={m.id} className={m.is_admin ? "flex justify-end" : "flex justify-start"}>
                  <div
                    className={
                      m.is_admin
                        ? "gradient-gold max-w-[80%] rounded-2xl px-4 py-2 text-sm font-medium text-primary-foreground"
                        : "max-w-[80%] rounded-2xl bg-accent px-4 py-2 text-sm text-accent-foreground"
                    }
                  >
                    <span className="mb-0.5 block text-[10px] font-bold opacity-70">
                      {m.is_admin ? "الدعم الفني" : (student?.full_name ?? "الطالب")}
                    </span>
                    {m.body}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 border-t border-border p-3">
              <Input
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={closed ? "المحادثة منتهية" : "رد الدعم…"}
                disabled={closed}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && body.trim() && !closed) send.mutate();
                }}
              />
              <Button
                className="gradient-gold"
                disabled={!body.trim() || closed || send.isPending}
                onClick={() => send.mutate()}
              >
                <Send className="size-4" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
