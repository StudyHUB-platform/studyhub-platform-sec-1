import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Puzzle } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { LevelBadge } from "@/components/Gamification";
import { supabase } from "@/integrations/supabase/client";
import { avatarUrl } from "@/lib/avatars";
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

type HonorRow = {
  rank: number;
  name: string;
  shards: number;
  level: number;
  is_me: boolean;
  avatar_id: number | null;
  public_id: string | null;
};

const PODIUM_STYLES = [
  { ring: "ring-4 ring-yellow-400", label: "text-yellow-300", chip: "🥇", size: "h-24 w-24" },
  { ring: "ring-4 ring-slate-300", label: "text-slate-200", chip: "🥈", size: "h-20 w-20" },
  { ring: "ring-4 ring-amber-600", label: "text-amber-500", chip: "🥉", size: "h-20 w-20" },
] as const;

/** Light celebratory confetti — runs once on load, respects reduced motion. */
function Confetti() {
  if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return null;
  }
  const colors = ["#facc15", "#f472b6", "#38bdf8", "#4ade80", "#c084fc", "#fb923c"];
  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-40 h-screen overflow-hidden">
      {Array.from({ length: 28 }, (_, i) => (
        <span
          key={i}
          className="absolute block size-2.5 rounded-sm"
          style={{
            left: `${(i * 37) % 100}%`,
            backgroundColor: colors[i % colors.length],
            animation: `game-confetti ${2.6 + (i % 5) * 0.5}s ease-in ${i * 0.08}s 1 both`,
          }}
        />
      ))}
    </div>
  );
}

function HonorBoard() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["honor"],
    refetchInterval: 20000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("honor_board");
      if (error) throw error;
      return (data ?? []) as HonorRow[];
    },
  });

  const podium = data.slice(0, 3);
  const rest = data.slice(3);

  return (
    <AppShell title="👑 Rankings — Top 10" subtitle="ترتيب حقيقي حسب Shards Tokens">
      <Confetti />
      <div className="relative mx-auto max-w-2xl">
        <div className="overflow-hidden rounded-3xl bg-sidebar p-6 text-sidebar-foreground shadow-gold">
          <div className="relative text-center">
            <span aria-hidden className="anim-crown-drop absolute left-1/2 top-0 -translate-x-1/2 text-4xl">
              👑
            </span>
            <h2 className="text-gradient-gold font-display pt-10 text-5xl font-extrabold">Top 10</h2>
            <p className="mt-1 text-xs opacity-70">🏅 لوحة شرف Study HUB 🏅</p>
          </div>

          {isLoading && <p className="py-10 text-center text-sm opacity-70">جاري التحميل…</p>}
          {!isLoading && data.length === 0 && (
            <p className="py-10 text-center text-sm opacity-70">
              القائمة فارغة حالياً — اجمع Shards لتظهر هنا 🧩
            </p>
          )}

          {!isLoading && podium.length > 0 && (
            <div className="mt-6 flex items-end justify-center gap-3">
              {[podium[1], podium[0], podium[2]].map((row, i) => {
                if (!row) return null;
                const place = row.rank; // 1,2,3
                const style = PODIUM_STYLES[place - 1]!;
                const height = place === 1 ? "h-24" : place === 2 ? "h-16" : "h-12";
                return (
                  <div key={row.rank} className="flex flex-1 flex-col items-center">
                    <div className="relative">
                      {place === 1 && (
                        <span aria-hidden className="anim-crown-drop absolute -top-6 left-1/2 -translate-x-1/2 text-2xl">
                          👑
                        </span>
                      )}
                      <img
                        src={avatarUrl(row.avatar_id)}
                        alt={row.name}
                        className={cn(
                          "anim-pop rounded-2xl object-cover shadow-gold",
                          style.size,
                          style.ring,
                        )}
                        style={{ animationDelay: `${place * 0.15}s` }}
                      />
                      <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-sidebar px-1.5 text-lg">
                        {style.chip}
                      </span>
                    </div>
                    <p className={cn("mt-3 max-w-full truncate text-center font-bold", style.label, place === 1 && "anim-name-pulse")}>
                      {row.name}
                    </p>
                    <p className="flex items-center gap-1 text-sm font-extrabold">
                      <Puzzle className="size-3.5 fill-primary text-primary" />
                      {row.shards}
                    </p>
                    <div
                      className={cn(
                        "mt-2 flex w-full items-start justify-center rounded-t-2xl bg-primary/15 pt-2",
                        height,
                      )}
                    >
                      <span className="font-display text-gradient-gold text-2xl font-extrabold">#{place}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-6 space-y-2">
            {rest.map((r, i) => (
              <div
                key={r.rank}
                className={cn(
                  "anim-slide-up flex items-center gap-3 rounded-2xl border border-sidebar-border px-4 py-2.5",
                  r.is_me && "ring-2 ring-primary",
                )}
                style={{ animationDelay: `${0.3 + i * 0.06}s` }}
              >
                <span className="font-display w-8 text-center text-lg font-extrabold text-primary">
                  #{r.rank}
                </span>
                <img src={avatarUrl(r.avatar_id)} alt={r.name} className="size-10 rounded-xl object-cover" loading="lazy" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">
                    {r.name} {r.is_me && <span className="text-xs text-primary">(أنت)</span>}
                  </p>
                  <LevelBadge level={r.level} className="mt-1 bg-sidebar-accent" />
                </div>
                <span className="flex items-center gap-1 font-display font-extrabold">
                  <Puzzle className="size-4 fill-primary text-primary" /> {r.shards}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
