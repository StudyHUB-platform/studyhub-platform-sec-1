import { Link, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Home, Puzzle, Trophy, User as UserIcon } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useMyStats } from "@/hooks/useMyStats";
import { levelInfo } from "@/lib/gamification";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export function LevelBadge({ level, className }: { level: number; className?: string }) {
  const info = levelInfo(level);
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full bg-sidebar px-2 py-0.5 text-[11px] font-bold text-sidebar-foreground", className)}>
      <span>{info.badge}</span>
      <span className="font-display text-primary">Lv.{info.level}</span>
      <span className="hidden sm:inline">{info.name}</span>
    </span>
  );
}

export function ShardsCounter() {
  const { data } = useMyStats();
  if (!data) return null;
  return (
    <Link to="/honor" className="flex items-center gap-1.5 rounded-full border border-primary/40 bg-sidebar px-2.5 py-1 text-sidebar-foreground" title="Shards Tokens">
      <Puzzle className="size-4 fill-primary text-primary" />
      <span className="font-display text-sm font-extrabold">{data.shards}</span>
      <LevelBadge level={data.level} className="hidden bg-transparent px-0 md:inline-flex" />
    </Link>
  );
}

export function LevelUpDialog() {
  const { data } = useMyStats();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const open = !!data && data.pending_level > data.level;
  if (!open) return null;
  const from = data.level;
  const to = data.pending_level;
  const info = levelInfo(to);
  const confirm = async () => {
    setBusy(true);
    const { error } = await supabase.rpc("claim_level_up");
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    void qc.invalidateQueries({ queryKey: ["my-stats"] });
    void qc.invalidateQueries({ queryKey: ["honor"] });
  };
  return (
    <Dialog open>
      <DialogContent className="max-w-sm text-center [&>button]:hidden">
        <DialogTitle className="font-display text-3xl font-extrabold">🎉 Level Up!</DialogTitle>
        <p className="text-6xl">{info.badge}</p>
        <p className="font-display text-xl font-bold">
          Level {from} → <span className="text-gradient-gold">Level {to}</span> 🎉
        </p>
        <p className="text-sm text-muted-foreground">{info.name}</p>
        <p className="rounded-xl bg-sidebar p-3 font-bold text-sidebar-foreground">
          Reward: +{50 * (to - from)} Shards 🧩
        </p>
        <Button className="gradient-gold w-full font-bold" disabled={busy} onClick={() => void confirm()}>
          Continue
        </Button>
      </DialogContent>
    </Dialog>
  );
}

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const items = [
    { to: "/dashboard", label: "Home", icon: Home },
    { to: "/honor", label: "Top 10", icon: Trophy },
    { to: "/profile", label: "Profile", icon: UserIcon },
  ] as const;
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-sidebar-border bg-sidebar text-sidebar-foreground lg:hidden">
      {items.map((it) => {
        const Icon = it.icon;
        const active = pathname === it.to;
        return (
          <Link key={it.to} to={it.to} className={cn("flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-bold", active ? "text-primary" : "opacity-75")}>
            <Icon className="size-5" />
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
