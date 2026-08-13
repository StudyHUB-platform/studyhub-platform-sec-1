import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { uploadLibraryFile } from "@/lib/storage";
import {
  ALL_SUBJECTS,
  COMMUNITY_PLATFORMS,
  FILE_TYPES,
  LIBRARY_CATEGORIES,
  LIBRARY_CATEGORY_LABELS,
} from "@/lib/hub";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="hub-card space-y-3 p-4">
      <p className="font-display font-bold text-primary">{title}</p>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

function Picker({
  value,
  onChange,
  options,
  labels,
}: {
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  labels?: Record<string, string>;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {labels?.[o] ?? o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/* ---------------- Library management ---------------- */
export function LibraryAdmin() {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>(LIBRARY_CATEGORIES[0]);
  const [subject, setSubject] = useState<string>(ALL_SUBJECTS[0]!);
  const [fileType, setFileType] = useState<string>(FILE_TYPES[0]);
  const [link, setLink] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const { data: items } = useQuery({
    queryKey: ["admin-library"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("library_items")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const add = async () => {
    if (!title.trim()) {
      toast.error("اكتب عنوان الملف");
      return;
    }
    setBusy(true);
    try {
      let url = link.trim();
      if (fileType !== "Link") {
        if (!file && !url) throw new Error("ارفع ملف أو ضع رابط");
        if (file) url = await uploadLibraryFile(file);
      }
      if (!url) throw new Error("الرابط مطلوب");
      const { error } = await supabase.from("library_items").insert({
        title: title.trim(),
        description: description.trim() || null,
        category,
        subject,
        file_type: fileType,
        url,
      });
      if (error) throw error;
      toast.success("تم إضافة الملف للمكتبة");
      setTitle("");
      setDescription("");
      setLink("");
      setFile(null);
      void qc.invalidateQueries({ queryKey: ["admin-library"] });
      void qc.invalidateQueries({ queryKey: ["library"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل الإضافة");
    } finally {
      setBusy(false);
    }
  };

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("library_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin-library"] });
      void qc.invalidateQueries({ queryKey: ["library"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <Section title="📤 إضافة ملف جديد للمكتبة">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="العنوان">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label="القسم">
            <Picker
              value={category}
              onChange={setCategory}
              options={LIBRARY_CATEGORIES}
              labels={LIBRARY_CATEGORY_LABELS}
            />
          </Field>
          <Field label="المادة">
            <Picker value={subject} onChange={setSubject} options={ALL_SUBJECTS} />
          </Field>
          <Field label="نوع الملف">
            <Picker value={fileType} onChange={setFileType} options={FILE_TYPES} />
          </Field>
          <Field label="الوصف">
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </Field>
          {fileType === "Link" ? (
            <Field label="الرابط">
              <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://…" />
            </Field>
          ) : (
            <Field label="الملف (أو رابط خارجي)">
              <div className="space-y-2">
                <Input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="أو رابط مباشر" />
              </div>
            </Field>
          )}
        </div>
        <Button className="gradient-gold font-bold" disabled={busy} onClick={() => void add()}>
          <Upload className="mr-1 size-4" /> إضافة
        </Button>
      </Section>

      <Section title={`📚 الملفات (${items?.length ?? 0})`}>
        <div className="space-y-2">
          {!items?.length && <p className="text-sm text-muted-foreground">لا توجد ملفات.</p>}
          {items?.map((i) => (
            <div key={i.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{i.title}</p>
                <p className="text-xs text-muted-foreground">
                  {i.category} · {i.subject} · {i.file_type}
                </p>
              </div>
              <Button size="icon" variant="ghost" onClick={() => remove.mutate(i.id)}>
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

/* ---------------- Teachers ---------------- */
export function TeachersAdmin() {
  const qc = useQueryClient();
  const [subject, setSubject] = useState<string>(ALL_SUBJECTS[0]!);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [image, setImage] = useState("");

  const { data } = useQuery({
    queryKey: ["admin-teachers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("teachers").select("*").order("subject");
      if (error) throw error;
      return data;
    },
  });

  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("teachers").insert({
        subject,
        channel_name: name.trim(),
        channel_url: url.trim(),
        image_url: image.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setName("");
      setUrl("");
      setImage("");
      void qc.invalidateQueries({ queryKey: ["admin-teachers"] });
      void qc.invalidateQueries({ queryKey: ["teachers"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("teachers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin-teachers"] });
      void qc.invalidateQueries({ queryKey: ["teachers"] });
    },
  });

  return (
    <div className="space-y-4">
      <Section title="👨‍🏫 إضافة معلم / قناة">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="المادة">
            <Picker value={subject} onChange={setSubject} options={ALL_SUBJECTS} />
          </Field>
          <Field label="اسم القناة / المعلم">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="رابط القناة">
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://youtube.com/…" />
          </Field>
          <Field label="صورة (رابط، اختياري)">
            <Input value={image} onChange={(e) => setImage(e.target.value)} />
          </Field>
        </div>
        <Button
          className="gradient-gold font-bold"
          disabled={!name.trim() || !url.trim()}
          onClick={() => add.mutate()}
        >
          <Plus className="mr-1 size-4" /> إضافة
        </Button>
      </Section>

      <Section title={`القائمة (${data?.length ?? 0})`}>
        <div className="space-y-2">
          {data?.map((t) => (
            <div key={t.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{t.channel_name}</p>
                <p className="text-xs text-muted-foreground">{t.subject}</p>
              </div>
              <Button size="icon" variant="ghost" onClick={() => remove.mutate(t.id)}>
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

/* ---------------- Community ---------------- */
export function CommunityAdmin() {
  const qc = useQueryClient();
  const [platform, setPlatform] = useState<string>(COMMUNITY_PLATFORMS[0]);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");

  const { data } = useQuery({
    queryKey: ["admin-community"],
    queryFn: async () => {
      const { data, error } = await supabase.from("community_links").select("*").order("platform");
      if (error) throw error;
      return data;
    },
  });

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["admin-community"] });
    void qc.invalidateQueries({ queryKey: ["community"] });
  };

  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("community_links")
        .insert({ platform, title: title.trim(), url: url.trim() || null });
      if (error) throw error;
    },
    onSuccess: () => {
      setTitle("");
      setUrl("");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async (r: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("community_links")
        .update({ is_active: !r.is_active })
        .eq("id", r.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("community_links").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return (
    <div className="space-y-4">
      <Section title="👥 إضافة رابط مجتمع">
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="المنصة">
            <Picker value={platform} onChange={setPlatform} options={COMMUNITY_PLATFORMS} />
          </Field>
          <Field label="الاسم">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label="الرابط">
            <Input value={url} onChange={(e) => setUrl(e.target.value)} />
          </Field>
        </div>
        <Button className="gradient-gold font-bold" disabled={!title.trim()} onClick={() => add.mutate()}>
          <Plus className="mr-1 size-4" /> إضافة
        </Button>
      </Section>

      <Section title={`الروابط (${data?.length ?? 0})`}>
        <div className="space-y-2">
          {data?.map((c) => (
            <div key={c.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{c.title}</p>
                <p className="text-xs text-muted-foreground">{c.platform}</p>
              </div>
              <Switch
                checked={c.is_active}
                onCheckedChange={() => toggle.mutate({ id: c.id, is_active: c.is_active })}
              />
              <Button size="icon" variant="ghost" onClick={() => remove.mutate(c.id)}>
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

/* ---------------- Announcements: notifications / updates / tips ---------------- */
type AnnouncementTable = "notifications" | "platform_updates" | "admin_tips";

export function AnnouncementsAdmin({
  table,
  heading,
  bodyLabel,
}: {
  table: AnnouncementTable;
  heading: string;
  bodyLabel: string;
}) {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [image, setImage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const withImage = table === "platform_updates";
  const key = ["admin", table];
  const { data } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Array<{
        id: string;
        title: string;
        is_published: boolean;
        content?: string;
        message?: string;
        image_url?: string | null;
        created_at: string;
      }>;
    },
  });

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: key });
    void qc.invalidateQueries({ queryKey: ["updates"] });
    void qc.invalidateQueries({ queryKey: ["tip"] });
    void qc.invalidateQueries({ queryKey: ["notifications"] });
  };

  const reset = () => {
    setTitle("");
    setBody("");
    setImage("");
    setEditingId(null);
  };

  const payload = () => {
    const base =
      table === "notifications"
        ? { title: title.trim(), message: body.trim() }
        : { title: title.trim(), content: body.trim() };
    return withImage ? { ...base, image_url: image.trim() || null } : base;
  };

  const save = useMutation({
    mutationFn: async () => {
      if (editingId) {
        const { error } = await supabase
          .from(table)
          .update(payload() as never)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from(table)
          .insert({ ...payload(), is_published: true } as never);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      const wasEdit = Boolean(editingId);
      reset();
      invalidate();
      toast.success(wasEdit ? "تم تحديث المنشور" : "تم النشر");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async (r: { id: string; is_published: boolean }) => {
      const { error } = await supabase
        .from(table)
        .update({ is_published: !r.is_published } as never)
        .eq("id", r.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      reset();
      invalidate();
      toast.success("تم الحذف");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <Section title={editingId ? `✏️ تعديل — ${heading}` : heading}>
        <Field label="العنوان">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label={bodyLabel}>
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} />
        </Field>
        {withImage && (
          <Field label="رابط الصورة (اختياري)">
            <Input
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://…"
            />
          </Field>
        )}
        <div className="flex flex-wrap gap-2">
          <Button
            className="gradient-gold font-bold"
            disabled={!title.trim() || !body.trim() || save.isPending}
            onClick={() => save.mutate()}
          >
            <Plus className="mr-1 size-4" /> {editingId ? "حفظ التعديل" : "نشر"}
          </Button>
          {editingId && (
            <Button variant="outline" onClick={reset}>
              إلغاء
            </Button>
          )}
        </div>
      </Section>

      <Section title={`المنشورات (${data?.length ?? 0})`}>
        {!data?.length && <p className="text-sm text-muted-foreground">لا توجد منشورات بعد.</p>}
        <div className="space-y-2">
          {data?.map((r) => (
            <div key={r.id} className="rounded-xl border border-border p-3">
              <div className="flex items-center gap-3">
                <p className="min-w-0 flex-1 truncate text-sm font-bold">{r.title}</p>
                <span className="text-[11px] font-bold text-muted-foreground">
                  {r.is_published ? "منشور" : "مخفي"}
                </span>
                <Switch
                  checked={r.is_published}
                  onCheckedChange={() => toggle.mutate({ id: r.id, is_published: r.is_published })}
                />
              </div>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                {r.content ?? r.message}
              </p>
              <div className="mt-2 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingId(r.id);
                    setTitle(r.title);
                    setBody(r.content ?? r.message ?? "");
                    setImage(r.image_url ?? "");
                  }}
                >
                  <Pencil className="mr-1 size-3.5" /> تعديل
                </Button>
                <Button size="sm" variant="ghost" onClick={() => remove.mutate(r.id)}>
                  <Trash2 className="mr-1 size-3.5 text-destructive" /> حذف
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

