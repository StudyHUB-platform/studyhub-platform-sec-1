import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Pencil, Plus, Trash2, Youtube } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { fetchYouTubeVideo } from "@/lib/youtube.functions";
import { getYouTubeVideoId, isYouTubeUrl, youTubeThumbnail } from "@/lib/youtube";
import {
  ALL_SUBJECTS,
  SUBJECT_AR,
  VIDEO_SECTIONS,
  VIDEO_SECTION_LABELS,
} from "@/lib/hub";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

export function VideosAdmin() {
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [subject, setSubject] = useState<string>(ALL_SUBJECTS[0]!);
  const [section, setSection] = useState<string>(VIDEO_SECTIONS[0]);
  const [busy, setBusy] = useState(false);
  const getMeta = useServerFn(fetchYouTubeVideo);

  const { data: videos } = useQuery({
    queryKey: ["admin-videos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["admin-videos"] });
    void qc.invalidateQueries({ queryKey: ["videos"] });
    void qc.invalidateQueries({ queryKey: ["video-counts"] });
  };

  const reset = () => {
    setEditingId(null);
    setUrl("");
    setTitle("");
    setDescription("");
    setThumbnail("");
  };

  const autofill = async (link: string) => {
    if (!isYouTubeUrl(link)) {
      toast.error("ضع رابط يوتيوب صحيح");
      return;
    }
    try {
      const meta = await getMeta({ data: { url: link } });
      if (meta.title) setTitle(meta.title);
      setThumbnail(meta.thumbnail || youTubeThumbnail(link) || "");
      toast.success("تم جلب بيانات الفيديو من يوتيوب");
    } catch {
      const fallback = youTubeThumbnail(link);
      if (fallback) setThumbnail(fallback);
      toast.error("تعذر جلب البيانات — اكتب العنوان يدوياً");
    }
  };

  const save = async () => {
    setBusy(true);
    try {
      const link = url.trim();
      if (!editingId && !link) throw new Error("ضع رابط الفيديو");
      if (!title.trim()) throw new Error("اكتب عنوان الفيديو");
      const values = {
        title: title.trim(),
        description: description.trim() || null,
        subject,
        section,
        thumbnail_url: thumbnail.trim() || (link ? youTubeThumbnail(link) : null),
        ...(link ? { url: link, video_id: getYouTubeVideoId(link) } : {}),
      };
      if (editingId) {
        const { error } = await supabase.from("videos").update(values).eq("id", editingId);
        if (error) throw error;
        toast.success("تم تحديث الفيديو");
      } else {
        const { error } = await supabase.from("videos").insert({ ...values, url: link });
        if (error) throw error;
        toast.success("تم إضافة الفيديو");
      }
      reset();
      invalidate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل الحفظ");
    } finally {
      setBusy(false);
    }
  };

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("videos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      reset();
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const move = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: { subject?: string; section?: string } }) => {
      const { error } = await supabase.from("videos").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <section className="hub-card space-y-3 p-4">
        <p className="font-display font-bold text-primary">
          {editingId ? "✏️ تعديل الفيديو" : "🎬 إضافة فيديو جديد"}
        </p>
        <Field label="رابط YouTube">
          <div className="flex gap-2">
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://youtu.be/…" />
            <Button variant="outline" onClick={() => void autofill(url.trim())}>
              <Youtube className="mr-1 size-4" /> جلب البيانات
            </Button>
          </div>
        </Field>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="عنوان الفيديو">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label="صورة مصغرة (Thumbnail)">
            <Input value={thumbnail} onChange={(e) => setThumbnail(e.target.value)} />
          </Field>
          <Field label="المادة">
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_SUBJECTS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {SUBJECT_AR[s] ?? s} — {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="قسم الفيديو">
            <Select value={section} onValueChange={setSection}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VIDEO_SECTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {VIDEO_SECTION_LABELS[s]} — {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <Field label="الوصف">
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        {thumbnail && (
          <img src={thumbnail} alt="thumbnail" className="aspect-video w-52 rounded-xl object-cover" />
        )}
        <div className="flex gap-2">
          <Button className="gradient-gold font-bold" disabled={busy} onClick={() => void save()}>
            <Plus className="mr-1 size-4" /> {editingId ? "تحديث" : "إضافة"}
          </Button>
          {editingId && (
            <Button variant="outline" onClick={reset}>
              إلغاء
            </Button>
          )}
        </div>
      </section>

      <section className="hub-card space-y-3 p-4">
        <p className="font-display font-bold text-primary">🎥 الفيديوهات المنشورة ({videos?.length ?? 0})</p>
        {!videos?.length && <p className="text-sm text-muted-foreground">لا يوجد فيديوهات بعد.</p>}
        {videos?.map((v) => (
          <div key={v.id} className="flex flex-wrap items-center gap-3 rounded-xl bg-secondary/60 p-3">
            {v.thumbnail_url && (
              <img src={v.thumbnail_url} alt={v.title} className="aspect-video w-28 rounded-lg object-cover" />
            )}
            <div className="min-w-40 flex-1">
              <p className="text-sm font-bold">{v.title}</p>
              <p className="text-[11px] text-muted-foreground">
                {SUBJECT_AR[v.subject] ?? v.subject} · {VIDEO_SECTION_LABELS[v.section] ?? v.section}
              </p>
            </div>
            <Select
              value={v.subject}
              onValueChange={(value) => move.mutate({ id: v.id, values: { subject: value } })}
            >
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_SUBJECTS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {SUBJECT_AR[s] ?? s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={v.section}
              onValueChange={(value) => move.mutate({ id: v.id, values: { section: value } })}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VIDEO_SECTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {VIDEO_SECTION_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="icon"
              variant="outline"
              onClick={() => {
                setEditingId(v.id);
                setTitle(v.title);
                setDescription(v.description ?? "");
                setUrl(v.url);
                setThumbnail(v.thumbnail_url ?? "");
                setSubject(v.subject);
                setSection(v.section);
              }}
            >
              <Pencil className="size-4" />
            </Button>
            <Button size="icon" variant="destructive" onClick={() => remove.mutate(v.id)}>
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </section>
    </div>
  );
}
