import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Users } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/community")({
  head: () => ({
    meta: [
      { title: "المجتمع — Study HUB Community" },
      {
        name: "description",
        content: "انضم لمجموعات وقنوات Study HUB على واتساب وتليجرام ويوتيوب وتابع كل جديد.",
      },
      { property: "og:title", content: "المجتمع — Study HUB Community" },
      { property: "og:description", content: "مجموعات وقنوات Study HUB على كل المنصات." },
    ],
  }),
  component: CommunityPage,
});

const PLATFORM_ORDER = [
  "WhatsApp Community",
  "WhatsApp Group",
  "WhatsApp Channel",
  "Telegram Group",
  "Telegram Channel",
  "YouTube Channel",
];

function PlatformIcon({ platform }: { platform: string }) {
  const base = "size-8 shrink-0";
  switch (platform) {
    case "WhatsApp Community":
    case "WhatsApp Group":
    case "WhatsApp Channel":
      return (
        <svg className={base} viewBox="0 0 24 24" fill="#25D366" aria-hidden="true">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.134 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.004c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      );
    case "Telegram Group":
    case "Telegram Channel":
      return (
        <svg className={base} viewBox="0 0 24 24" fill="#0088cc" aria-hidden="true">
          <path d="M9.78 18.65l.28-4.2 7.68-6.92c.34-.31-.07-.46-.52-.27L6.9 14.74l-4.14-1.3c-.88-.28-.89-.86.2-1.3L20.46 6.1c.73-.26 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71l-4.15-3.06-2.01 1.85c-.23.21-.42.39-.85.39z" />
        </svg>
      );
    case "YouTube Channel":
      return (
        <svg className={base} viewBox="0 0 24 24" fill="#FF0000" aria-hidden="true">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      );
    default:
      return <ExternalLink className={base} />;
  }
}

function CommunityPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["community"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("community_links")
        .select("*")
        .eq("is_active", true)
        .order("platform");
      if (error) throw error;
      return data;
    },
  });

  const sorted = data
    ? [...data].sort(
        (a, b) => PLATFORM_ORDER.indexOf(a.platform) - PLATFORM_ORDER.indexOf(b.platform),
      )
    : [];

  return (
    <AppShell title="👥 Community" subtitle="انضم لمجتمع Study HUB">
      {isLoading && <p className="text-sm text-muted-foreground">جاري التحميل…</p>}
      {!isLoading && !sorted.length && (
        <div className="hub-card p-8 text-center">
          <Users className="mx-auto size-10 text-primary" />
          <p className="font-display mt-3 text-lg font-bold">لا توجد روابط متاحة</p>
          <p className="mt-1 text-sm text-muted-foreground">الأدمن يضيف روابط المجتمع من Admin Panel.</p>
        </div>
      )}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {sorted.map((c) => (
          <article key={c.id} className="hub-card p-4">
            <div className="flex items-center gap-3">
              <PlatformIcon platform={c.platform} />
              <div>
                <p className="font-display font-bold">{c.title}</p>
                <p className="text-xs text-muted-foreground">{c.platform}</p>
              </div>
            </div>
            {c.url ? (
              <Button asChild size="sm" className="gradient-gold mt-3 w-full font-bold">
                <a href={c.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-1 size-3.5" /> انضم الآن
                </a>
              </Button>
            ) : (
              <p className="mt-3 text-xs text-muted-foreground">الرابط سيتم إضافته قريباً</p>
            )}
          </article>
        ))}
      </div>
    </AppShell>
  );
}
