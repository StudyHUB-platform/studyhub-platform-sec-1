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

const EMOJI: Record<string, string> = {
  "WhatsApp Community": "💬",
  "WhatsApp Group": "👥",
  "WhatsApp Channel": "📢",
  "Telegram Group": "✈️",
  "Telegram Channel": "📣",
  "YouTube Channel": "▶️",
};

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

  return (
    <AppShell title="👥 Community" subtitle="انضم لمجتمع Study HUB">
      {isLoading && <p className="text-sm text-muted-foreground">جاري التحميل…</p>}
      {!isLoading && !data?.length && (
        <div className="hub-card p-8 text-center">
          <Users className="mx-auto size-10 text-primary" />
          <p className="font-display mt-3 text-lg font-bold">لا توجد روابط متاحة</p>
          <p className="mt-1 text-sm text-muted-foreground">الأدمن يضيف روابط المجتمع من Admin Panel.</p>
        </div>
      )}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {data?.map((c) => (
          <article key={c.id} className="hub-card p-4">
            <p className="text-2xl">{EMOJI[c.platform] ?? "🔗"}</p>
            <p className="font-display mt-2 font-bold">{c.title}</p>
            <p className="text-xs text-muted-foreground">{c.platform}</p>
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
