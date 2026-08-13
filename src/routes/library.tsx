import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Download, ExternalLink, Eye, Search, Share2 } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { resolveLibraryUrl } from "@/lib/storage";
import {
  CORE_SUBJECTS,
  FILE_TYPES,
  FILE_TYPE_EMOJI,
  LIBRARY_CATEGORIES,
  LIBRARY_CATEGORY_LABELS,
  OTHER_SUBJECTS,
  SUBJECT_AR,
  SUBJECT_EMOJI,
} from "@/lib/hub";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "المكتبة — Study HUB Library" },
      {
        name: "description",
        content: "ملخصات، كتب خارجية، مراجعات ونماذج استرشادية لكل المواد بصيغة PDF وفيديو وصور وروابط.",
      },
      { property: "og:title", content: "المكتبة — Study HUB Library" },
      { property: "og:description", content: "كل ملفات ومراجعات المواد في مكتبة Study HUB." },
    ],
  }),
  component: LibraryPage,
});

function Chip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={
        active
          ? "gradient-gold shadow-gold rounded-full px-3 py-1.5 text-xs font-bold text-primary-foreground"
          : "rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
      }
    >
      {children}
    </button>
  );
}

function LibraryPage() {
  const [category, setCategory] = useState<string | null>(null);
  const [subject, setSubject] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["library"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("library_items")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const items = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data ?? []).filter(
      (i) =>
        (!category || i.category === category) &&
        (!subject || i.subject === subject) &&
        (!fileType || i.file_type === fileType) &&
        (!q ||
          i.title.toLowerCase().includes(q) ||
          (i.description ?? "").toLowerCase().includes(q) ||
          i.subject.toLowerCase().includes(q)),
    );
  }, [data, category, subject, fileType, search]);

  const open = async (url: string, download = false) => {
    try {
      const resolved = await resolveLibraryUrl(url);
      if (download) {
        const a = document.createElement("a");
        a.href = resolved;
        a.download = "";
        a.target = "_blank";
        a.click();
      } else {
        window.open(resolved, "_blank", "noopener");
      }
    } catch {
      toast.error("تعذر فتح الملف");
    }
  };

  const share = async (url: string, title: string) => {
    try {
      const resolved = await resolveLibraryUrl(url);
      if (navigator.share) await navigator.share({ title, url: resolved });
      else {
        await navigator.clipboard.writeText(resolved);
        toast.success("تم نسخ الرابط");
      }
    } catch {
      /* cancelled */
    }
  };

  return (
    <AppShell title="📚 Study HUB Library" subtitle="فلتر بالقسم والمادة ونوع الملف، أو ابحث مباشرة">
      <section className="hub-card mb-4 p-4">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 ابحث في المكتبة…"
            className="pl-9"
          />
        </div>
      </section>

      <section className="hub-card mb-4 p-4">
        <h2 className="font-display mb-3 text-sm font-extrabold">📁 الأقسام — Categories</h2>
        <div className="flex flex-wrap gap-2">
          <Chip active={!category} onClick={() => setCategory(null)}>
            الكل
          </Chip>
          {LIBRARY_CATEGORIES.map((c) => (
            <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
              {LIBRARY_CATEGORY_LABELS[c]}
            </Chip>
          ))}
        </div>
      </section>

      <section className="hub-card mb-4 p-4">
        <h2 className="font-display mb-3 text-sm font-extrabold">📚 المواد الأساسية — Core Subjects</h2>
        <div className="flex flex-wrap gap-2">
          <Chip active={!subject} onClick={() => setSubject(null)}>
            الكل
          </Chip>
          {CORE_SUBJECTS.map((s) => (
            <Chip key={s} active={subject === s} onClick={() => setSubject(s)}>
              <span className="block leading-tight">
                {SUBJECT_EMOJI[s]} {SUBJECT_AR[s] ?? s}
              </span>
              <span className="block text-[10px] leading-tight font-semibold opacity-75">{s}</span>
            </Chip>
          ))}
        </div>
      </section>

      <section className="hub-card mb-4 p-4">
        <h2 className="font-display mb-3 text-sm font-extrabold">🧩 مواد أخرى — Other Subjects</h2>
        <div className="flex flex-wrap gap-2">
          {OTHER_SUBJECTS.map((s) => (
            <Chip key={s} active={subject === s} onClick={() => setSubject(s)}>
              <span className="block leading-tight">
                {SUBJECT_EMOJI[s]} {SUBJECT_AR[s] ?? s}
              </span>
              <span className="block text-[10px] leading-tight font-semibold opacity-75">{s}</span>
            </Chip>
          ))}
        </div>
      </section>

      <section className="hub-card mb-5 p-4">
        <h2 className="font-display mb-3 text-sm font-extrabold">📄 نوع الملف — File Types</h2>
        <div className="flex flex-wrap gap-2">
          <Chip active={!fileType} onClick={() => setFileType(null)}>
            الكل
          </Chip>
          {FILE_TYPES.map((t) => (
            <Chip key={t} active={fileType === t} onClick={() => setFileType(t)}>
              {FILE_TYPE_EMOJI[t]} {t}
            </Chip>
          ))}
        </div>
      </section>

      {isLoading && <p className="text-sm text-muted-foreground">جاري التحميل…</p>}
      {!isLoading && !items.length && (
        <div className="hub-card p-8 text-center">
          <p className="font-display text-lg font-bold">المكتبة فارغة حالياً</p>
          <p className="mt-1 text-sm text-muted-foreground">
            الأدمن هو اللي يضيف المحتوى من Admin Panel → Library Management.
          </p>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <article key={item.id} className="hub-card flex flex-col p-4">
            <div className="flex items-start justify-between gap-2">
              <span className="text-2xl">{FILE_TYPE_EMOJI[item.file_type] ?? "📁"}</span>
              <Badge variant="secondary" className="text-[10px]">
                {item.file_type}
              </Badge>
            </div>
            <h3 className="font-display mt-3 font-bold">{item.title}</h3>
            {item.description && (
              <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{item.description}</p>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              {SUBJECT_EMOJI[item.subject] ?? "📘"} {item.subject} · {item.category}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              📅 {new Date(item.created_at).toLocaleDateString("ar-EG")}
            </p>
            <div className="mt-4 flex gap-2">
              <Button size="sm" className="gradient-gold flex-1 font-bold" onClick={() => void open(item.url)}>
                {item.file_type === "Link" ? (
                  <ExternalLink className="mr-1 size-3.5" />
                ) : (
                  <Eye className="mr-1 size-3.5" />
                )}
                View
              </Button>
              <Button size="sm" variant="outline" onClick={() => void share(item.url, item.title)}>
                <Share2 className="size-3.5" />
              </Button>
              {item.file_type !== "Link" && (
                <Button size="sm" variant="outline" onClick={() => void open(item.url, true)}>
                  <Download className="size-3.5" />
                </Button>
              )}
            </div>
          </article>
        ))}
      </div>
    </AppShell>
  );
}
