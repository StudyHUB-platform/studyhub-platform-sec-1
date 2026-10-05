import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Puzzle } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { LevelBadge } from "@/components/Gamification";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/honor")({
  head: () => ({
    meta: [
      { title: "Top 10 — Honor Board | Study HUB" },
      { name: "description", content: "لوحة شرف Study HUB: أفضل 10 طلاب حسب عدد Shards Tokens." },
      { property: "og:title", content: "Top 10 — Honor Board | Study HUB" },
      { property: "og:description", content: "أفضل 10 حسابات في Study HUB حسب الـShards." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HonorBoard,
});

const MEDAL = ["🥇", "🥈", "🥉"];

function HonorBoard() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["honor"],
    refetchInterval: 20000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("honor_board");
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <AppShell title="🔝 Honor Board" subtitle="أفضل 10 حسابات حسب Shards Tokens">
      <div className="mx-auto max-w-2xl rounded-3xl bg-sidebar p-6 text-sidebar-foreground shadow-gold">
        <p className="text-center text-sm tracking-[0.4em] text-primary">✦ ✦ ✦</p>
        <h2 className="text-gradient-gold font-display text-center text-6xl font-extrabold">Top 10</h2>
        <p className="mt-1 text-center text-xs opacity-70">🏅 لوحة شرف Study HUB 🏅</p>
        <div className="mt-6 space-y-2">
          {isLoading && <p className="text-center text-sm opacity-70">جاري التحميل…</p>}
          {!isLoading && data.length === 0 && (
            <p className="py-8 text-center text-sm opacity-70">القائمة فارغة حالياً — اجمع Shards لتظهر هنا 🧩</p>
          )}
          {data.map((r) => {
            const top = r.rank <= 3;
            return (
              <div
                key={r.rank}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border px-4",
                  top ? "border-primary/60 bg-primary/10 py-4" : "border-sidebar-border py-2.5",
                  r.is_me && "ring-2 ring-primary",
                )}
              >
                <span className={cn("font-display w-10 text-center font-extrabold", top ? "text-4xl" : "text-lg text-primary")}>
                  {top ? MEDAL[r.rank - 1] : `#${r.rank}`}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={cn("truncate font-bold", top ? "text-lg" : "text-sm")}>
                    {r.name} {r.is_me && <span className="text-xs text-primary">(أنت)</span>}
                  </p>
                  <LevelBadge level={r.level} className="mt-1 bg-sidebar-accent" />
                </div>
                <span className="flex items-center gap-1 font-display font-extrabold">
                  <Puzzle className="size-4 fill-primary text-primary" /> {r.shards}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
