import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ArrowRight, Download, ExternalLink, Eye, Search, Share2 } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { resolveLibraryUrl } from "@/lib/storage";
import { isYouTubeUrl, youTubeThumbnail } from "@/lib/youtube";
import {
  FILE_TYPE_EMOJI,
  LIBRARY_CATEGORY_LABELS,
  SUBJECT_AR,
  SUBJECT_EMOJI,
} from "@/lib/hub";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/library/$category/$subject/$fileType")({
  head: () => ({
    meta: [
      { title: "ملفات المكتبة — Study HUB Library" },
      { name: "description", content: "كل ملفات المادة داخل القسم بنوع الملف المختار: عرض، تحميل ومشاركة." },
      { property: "og:title", content: "ملفات المكتبة — Study HUB Library" },
      { property: "og:description", content: "اعرض وحمّل وشارك ملفات مكتبة Study HUB." },
    ],
  }),
  component: LibraryItemsPage,
});

function LibraryItemsPage() {
  const { category, subject, fileType } = Route.useParams();
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["library", category, subject, fileType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("library_items")
        .select("*")
        .eq("category", category)
        .eq("subject", subject)
        .eq("file_type", fileType)
        .neq("file_type", "Video")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const items = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data ?? []).filter(
      (i) => !q || i.title.toLowerCase().includes(q) || (i.description ?? "").toLowerCase().includes(q),
    );
  }, [data, search]);

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
    <AppShell
      title={`${FILE_TYPE_EMOJI[fileType] ?? "📁"} ${fileType} — ${SUBJECT_AR[subject] ?? subject}`}
      subtitle={LIBRARY_CATEGORY_LABELS[category] ?? category}
    >
      <Button asChild variant="outline" size="sm" className="mb-4">
        <Link to="/library/$category/$subject" params={{ category, subject }}>
          <ArrowRight className="mr-1 size-3.5" /> أنواع الملفات
        </Link>
      </Button>

      <section className="hub-card mb-4 p-4">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 ابحث…"
            className="pl-9"
          />
        </div>
      </section>

      {isLoading && <p className="text-sm text-muted-foreground">جاري التحميل…</p>}
      {!isLoading && !items.length && (
        <div className="hub-card p-8 text-center">
          <p className="font-display text-lg font-bold">لا يوجد محتوى هنا حالياً</p>
          <p className="mt-1 text-sm text-muted-foreground">
            الأدمن هو اللي يضيف المحتوى من Admin Panel → Library Management.
          </p>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const thumb = item.thumbnail_url ?? youTubeThumbnail(item.url);
          return (
            <article key={item.id} className="hub-card flex flex-col p-4">
              {thumb && (
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    void open(item.url);
                  }}
                  className="relative mb-3 block overflow-hidden rounded-xl"
                >
                  <img src={thumb} alt={item.title} className="aspect-video w-full object-cover" loading="lazy" />
                  {isYouTubeUrl(item.url) && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/25 text-3xl">
                      ▶️
                    </span>
                  )}
                </a>
              )}
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
                {SUBJECT_EMOJI[item.subject] ?? "📘"} {SUBJECT_AR[item.subject] ?? item.subject} ·{" "}
                {LIBRARY_CATEGORY_LABELS[item.category] ?? item.category}
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
          );
        })}
      </div>
    </AppShell>
  );
}
