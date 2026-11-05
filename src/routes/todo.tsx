import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { BookOpen, Check, ChevronRight, ClipboardList, Map as MapIcon, Plus, Trash2, Trophy } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/todo")({
  head: () => ({
    meta: [
      { title: "To-Do Map — Study HUB" },
      { name: "description", content: "خريطة مهامك الدراسية: خطط، تتبّع، حقق." },
      { property: "og:title", content: "To-Do Map — Study HUB" },
      { property: "og:description", content: "Plan • Track • Achieve" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TodoPage,
});

const PRIORITIES = [
  { value: "high", label: "🔴 عالية" },
  { value: "medium", label: "🟡 متوسطة" },
  { value: "low", label: "🟢 منخفضة" },
];

type Todo = {
  id: string;
  title: string;
  priority: string;
  due_date: string | null;
  is_done: boolean;
  created_at: string;
};

/** A cartoonish station marker per task, laid out along a winding path. */
const STATION_EMOJI = ["🏆", "📖", "▶️", "📋", "✏️", "🧪", "🧮", "🌍", "⚡", "🎯"];

function TodoPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"map" | "tasks" | "create">("map");
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");
  const [due, setDue] = useState("");

  const { data: todos } = useQuery({
    queryKey: ["todos"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("todos")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Todo[];
    },
  });

  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("todos").insert({
        user_id: user!.id,
        title: title.trim(),
        priority,
        due_date: due || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setTitle("");
      setDue("");
      setTab("map");
      toast.success("أصبحت المهمة محطة جديدة على خريطتك 🗺️");
      void qc.invalidateQueries({ queryKey: ["todos"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async (t: { id: string; is_done: boolean }) => {
      const { error } = await supabase.from("todos").update({ is_done: !t.is_done }).eq("id", t.id);
      if (error) throw error;
    },
    onSuccess: async (_d, v) => {
      if (v) {
        // 20 XP comes from the DB trigger; the all-done bonus is claimed here (idempotent).
        const { data: granted } = await supabase.rpc("claim_todo_list_bonus");
        if (granted) toast.success("🎉 أكملت كل مهامك! +50 XP");
      }
      void qc.invalidateQueries({ queryKey: ["todos"] });
      void qc.invalidateQueries({ queryKey: ["my-stats"] });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("todos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["todos"] }),
  });

  const list = todos ?? [];
  const total = list.length;
  const done = list.filter((t) => t.is_done).length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  // Order the map path: pending tasks first (oldest first), completed trails behind.
  const ordered = useMemo(() => {
    const pending = list.filter((t) => !t.is_done);
    const completed = list.filter((t) => t.is_done);
    return [...pending, ...completed];
  }, [list]);

  if (!user) {
    return (
      <AppShell title="🗺️ To-Do Map" subtitle="Plan • Track • Achieve">
        <div className="hub-card mx-auto max-w-md p-8 text-center">
          <p className="font-display text-lg font-bold">سجّل الدخول لحفظ مهامك</p>
          <p className="mt-1 text-sm text-muted-foreground">
            مهامك تبقى محفوظة في حسابك ولا تُمسح مع تغيّر اليوم.
          </p>
          <Button className="gradient-gold mt-4 font-bold" onClick={() => (window.location.href = "/auth")}>
            تسجيل الدخول
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="🗺️ To-Do Map" subtitle="Plan • Track • Achieve">
      <div className="mb-4 grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => setTab("map")}
          className={cn("game-btn flex items-center justify-center gap-1.5 p-3 text-sm font-bold", tab === "map" ? "gradient-gold text-primary-foreground" : "hub-card")}
        >
          <MapIcon className="size-4" /> Map
        </button>
        <button
          type="button"
          onClick={() => setTab("tasks")}
          className={cn("game-btn flex items-center justify-center gap-1.5 p-3 text-sm font-bold", tab === "tasks" ? "gradient-gold text-primary-foreground" : "hub-card")}
        >
          <ClipboardList className="size-4" /> My Tasks
        </button>
        <button
          type="button"
          onClick={() => setTab("create")}
          className={cn("game-btn flex items-center justify-center gap-1.5 p-3 text-sm font-bold", tab === "create" ? "gradient-gold text-primary-foreground" : "hub-card")}
        >
          <Plus className="size-4" /> Create Task
        </button>
      </div>

      {tab === "map" && (
        <div className="space-y-4">
          <div className="hub-card flex items-center justify-between gap-3 p-4">
            <div>
              <p className="font-display font-bold">Your Progress</p>
              <p className="text-xs text-muted-foreground">
                {total === 0 ? "أضف أول مهمة لتبدأ رحلتك" : done === total ? "أكملت كل المحطات! 🎉" : `${total - done} محطة متبقية`}
              </p>
            </div>
            <div className="text-right">
              <p className="font-display text-2xl font-extrabold text-primary">
                ⭐ {done} / {total}
              </p>
              <p className="text-xs text-muted-foreground">💎 +50 Shards عند كل مستوى</p>
            </div>
          </div>

          <div className="relative">
            {/* winding path */}
            <div aria-hidden className="absolute inset-y-0 right-[27px] w-1 rounded-full bg-gradient-to-b from-primary/50 via-primary/25 to-primary/50" />
            <div className="space-y-4">
              {ordered.map((t, i) => {
                const emoji = STATION_EMOJI[i % STATION_EMOJI.length]!;
                return (
                  <div key={t.id} className="anim-slide-up relative flex items-center gap-3 pr-2" style={{ animationDelay: `${i * 0.05}s` }}>
                    <span
                      className={cn(
                        "relative z-10 flex size-12 shrink-0 items-center justify-center rounded-2xl border-2 text-xl shadow-card",
                        t.is_done ? "border-success bg-success/15" : "border-primary/50 bg-card",
                      )}
                    >
                      {t.is_done ? <Check className="size-6 text-success" /> : emoji}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggle.mutate({ id: t.id, is_done: t.is_done })}
                      className={cn(
                        "flex flex-1 items-center justify-between gap-3 rounded-2xl p-3 text-right transition-transform active:scale-[0.98]",
                        t.is_done ? "bg-success/10" : "tone-card tone-bluegray",
                      )}
                    >
                      <span className={cn("text-sm font-bold", t.is_done && "line-through opacity-70")}>{t.title}</span>
                      <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                        {PRIORITIES.find((p) => p.value === t.priority)?.label}
                        {t.due_date && <span>📅 {t.due_date}</span>}
                        <ChevronRight className="size-4" />
                      </span>
                    </button>
                  </div>
                );
              })}
              <div className="relative flex items-center gap-3 pr-2">
                <span className="relative z-10 flex size-12 shrink-0 items-center justify-center rounded-2xl border-2 border-dashed border-primary/60 bg-card text-xl">
                  <Trophy className="size-6 text-primary" />
                </span>
                <button
                  type="button"
                  onClick={() => setTab("create")}
                  className="game-btn flex-1 rounded-2xl bg-primary/10 p-3 text-sm font-bold text-primary"
                >
                  + Add New Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "tasks" && (
        <div className="space-y-2">
          {!total && <p className="hub-card p-6 text-center text-sm text-muted-foreground">لا توجد مهام بعد.</p>}
          {list.map((t) => (
            <div key={t.id} className="hub-card flex items-center gap-3 p-3">
              <button
                onClick={() => toggle.mutate({ id: t.id, is_done: t.is_done })}
                aria-label={t.is_done ? "إلغاء الإنجاز" : "إتمام المهمة"}
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-lg",
                  t.is_done ? "gradient-gold text-primary-foreground" : "border border-border",
                )}
              >
                {t.is_done && <Check className="size-4" />}
              </button>
              <div className="min-w-0 flex-1">
                <p className={cn("truncate text-sm font-semibold", t.is_done && "line-through opacity-60")}>{t.title}</p>
                <p className="text-xs text-muted-foreground">
                  {PRIORITIES.find((p) => p.value === t.priority)?.label}
                  {t.due_date ? ` · 📅 ${t.due_date}` : ""}
                </p>
              </div>
              <Button size="icon" variant="ghost" aria-label="حذف المهمة" onClick={() => remove.mutate(t.id)}>
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {tab === "create" && (
        <div className="hub-card grid gap-3 p-4">
          <div className="flex items-center gap-2 text-sm font-bold">
            <BookOpen className="size-4 text-primary" /> مهمة جديدة = محطة جديدة على خريطتك
          </div>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مهمة جديدة…" />
          <div className="grid grid-cols-2 gap-3">
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
          </div>
          <Button
            className="gradient-gold font-bold"
            disabled={!title.trim() || add.isPending}
            onClick={() => add.mutate()}
          >
            <Plus className="mr-1 size-4" /> إضافة المهمة
          </Button>
        </div>
      )}
    </AppShell>
  );
}
