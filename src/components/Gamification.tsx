import { Link, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Home, Puzzle, Trophy, User as UserIcon } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useMyStats } from "@/hooks/useMyStats";
import { levelInfo } from "@/lib/gamification";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

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

function playRewardSound() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "triangle";
      o.frequency.value = f;
      const t = ctx.currentTime + i * 0.09;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + 0.4);
    });
    setTimeout(() => void ctx.close(), 1200);
  } catch { /* ignore */ }
}

function useAnimatedNumber(target: number) {
  const [value, setValue] = useState(target);
  const prev = useRef(target);
  useEffect(() => {
    const from = prev.current;
    prev.current = target;
    if (from === target) return;
    const start = performance.now();
    const dur = 900;
    let raf = 0;
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(from + (target - from) * e));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return value;
}

export function ShardsCounter() {
  const { data } = useMyStats();
  const shards = data?.shards ?? 0;
  const shown = useAnimatedNumber(shards);
  const [pop, setPop] = useState(false);
  const last = useRef<number | null>(null);
  useEffect(() => {
    if (last.current !== null && shards > last.current) {
      setPop(true);
      const t = setTimeout(() => setPop(false), 900);
      last.current = shards;
      return () => clearTimeout(t);
    }
    last.current = shards;
    return undefined;
  }, [shards]);
  if (!data) return null;
  return (
    <Link to="/honor" className={cn("flex items-center gap-1.5 rounded-full border border-primary/40 bg-sidebar px-2.5 py-1 text-sidebar-foreground transition-transform duration-300", pop && "scale-125 ring-2 ring-primary")} title="Shards Tokens">
      <Puzzle className={cn("size-4 fill-primary text-primary", pop && "animate-spin")} />
      <span className="font-display text-sm font-extrabold tabular-nums">{shown}</span>
      <LevelBadge level={data.level} className="hidden bg-transparent px-0 md:inline-flex" />
    </Link>
  );
}

export function LevelUpDialog() {
  const { data } = useMyStats();
  const qc = useQueryClient();
  const [dismissed, setDismissed] = useState<number | null>(null);
  const open = !!data && data.pending_level > data.level && dismissed !== data.pending_level;
  if (!open) return null;
  const from = data.level;
  const to = data.pending_level;
  const info = levelInfo(to);
  const reward = 50 * (to - from);
  const confirm = async () => {
    playRewardSound();
    setDismissed(to);
    // optimistic update so the counter animates immediately
    qc.setQueriesData({ queryKey: ["my-stats"] }, (old: unknown) =>
      old && typeof old === "object" ? { ...(old as object), level: to, shards: (old as { shards: number }).shards + reward } : old,
    );
    const { error } = await supabase.rpc("claim_level_up");
    if (error) console.error(error);
    void qc.invalidateQueries({ queryKey: ["my-stats"] });
    void qc.invalidateQueries({ queryKey: ["honor"] });
  };
  return (
    <Dialog open onOpenChange={(o) => { if (!o) void confirm(); }}>
      <DialogContent className="max-w-sm text-center [&>button]:hidden">
        <DialogTitle className="font-display text-3xl font-extrabold">🎉 Level Up!</DialogTitle>
        <DialogDescription className="sr-only">Level up reward</DialogDescription>
        <p className="text-6xl">{info.badge}</p>
        <p className="font-display text-xl font-bold">
          Level {from} → <span className="text-gradient-gold">Level {to}</span> 🎉
        </p>
        <p className="text-sm text-muted-foreground">{info.name}</p>
        <button type="button" onClick={() => void confirm()} className="w-full rounded-xl bg-sidebar p-3 font-bold text-sidebar-foreground transition-transform active:scale-95">
          Reward: +{reward} Shards 🧩
        </button>
        <Button className="gradient-gold w-full font-bold" onClick={() => void confirm()}>
          Continue
        </Button>
      </DialogContent>
    </Dialog>
  );
}

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: vis } = usePlatformVisibility();
  const [moreOpen, setMoreOpen] = useState(false);
  const visibleFeatures = useVisibleFeatures();
  const { isAdmin } = useAuth();

  const hidden = vis?.hidden;
  const bar = [
    { to: "/dashboard", label: "Home", icon: Home, key: null as string | null },
    { to: "/library", label: "Library", icon: BookOpen, key: "library" },
    { to: "/battles", label: "Battles", icon: Swords, key: "battles" },
    { to: "/honor", label: "Rankings", icon: Crown, key: "honor" },
  ].filter((it) => !it.key || !hidden?.has(it.key));

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-sidebar-border bg-sidebar pb-[env(safe-area-inset-bottom)] text-sidebar-foreground lg:hidden">
        {bar.map((it) => {
          const Icon = it.icon;
          const active = pathname === it.to || (it.key && pathname.startsWith(`${it.to}/`));
          return (
            <Link
              key={it.to}
              to={it.to}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-bold transition-colors",
                active ? "text-primary" : "text-sidebar-foreground/70",
              )}
            >
              <span className={cn("rounded-xl px-2 py-0.5", active && "bg-primary/15")}>
                <Icon className={cn("size-5", active && "anim-pop")} />
              </span>
              {it.label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className={cn(
            "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-bold transition-colors",
            moreOpen ? "text-primary" : "text-sidebar-foreground/70",
          )}
        >
          <span className={cn("rounded-xl px-2 py-0.5", moreOpen && "bg-primary/15")}>
            <LayoutGrid className="size-5" />
          </span>
          More
        </button>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto rounded-t-3xl bg-sidebar text-sidebar-foreground">
          <SheetHeader className="pb-1">
            <SheetTitle className="font-display text-gradient-gold">Explore Study HUB</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-2 gap-2 pb-6 sm:grid-cols-3">
            {visibleFeatures.map((f) => {
              const Icon = f.icon;
              const active = pathname === f.to || pathname.startsWith(`${f.to}/`);
              return (
                <Link
                  key={f.to}
                  to={f.to}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    "flex items-center gap-2 rounded-2xl border border-sidebar-border bg-sidebar-accent px-3 py-3 text-sm font-bold",
                    active && "ring-2 ring-primary",
                  )}
                >
                  <Icon className={cn("size-5 shrink-0", active && "text-primary")} />
                  <span className="truncate">{f.label}</span>
                </Link>
              );
            })}
            <Link
              to="/profile"
              onClick={() => setMoreOpen(false)}
              className="flex items-center gap-2 rounded-2xl border border-sidebar-border bg-sidebar-accent px-3 py-3 text-sm font-bold"
            >
              <UserIcon className="size-5 shrink-0" /> Profile
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setMoreOpen(false)}
                className="flex items-center gap-2 rounded-2xl border border-sidebar-border bg-sidebar-accent px-3 py-3 text-sm font-bold"
              >
                <Shield className="size-5 shrink-0" /> Admin Panel
              </Link>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
