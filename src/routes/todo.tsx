import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Check, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/todo")({
  head: () => ({
    meta: [
      { title: "قائمة المهام — Study HUB To-Do" },
      { name: "description", content: "نظّم مهامك الدراسية بالأولويات وتابع نسبة إنجازك اليومي." },
      { property: "og:title", content: "قائمة المهام — Study HUB To-Do" },
      { property: "og:description", content: "نظّم مهامك الدراسية وتابع إنجازك." },
    ],
  }),
  component: TodoPage,
});

const PRIORITIES = [
  { value: "high", label: "🔴 عالية" },
  { value: "medium", label: "🟡 متوسطة" },
  { value: "low", label: "🟢 منخفضة" },
];

function TodoPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");
  const [due, setDue] = useState("");

  const { data: todos } = useQuery({
    queryKey: ["todos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("todos")
        .select("*")
        .order("is_done")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
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
      void qc.invalidateQueries({ queryKey: ["todos"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async (t: { id: string; is_done: boolean }) => {
      const { error } = await supabase.from("todos").update({ is_done: !t.is_done }).eq("id", t.id);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["todos"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("todos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["todos"] }),
  });

  const total = todos?.length ?? 0;
  const done = todos?.filter((t) => t.is_done).length ?? 0;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <AppShell title="✅ To-Do List" subtitle="أضف مهامك وحدد الأولوية وتابع تقدمك">
      <div className="hub-card mb-5 p-4">
        <div className="flex items-center justify-between text-sm font-bold">
          <span>الإنجاز</span>
          <span className="text-primary">
            {done}/{total} · {pct}%
          </span>
        </div>
        <Progress value={pct} className="mt-2" />
      </div>

      <div className="hub-card mb-5 grid gap-2 p-4 md:grid-cols-[1fr_auto_auto_auto]">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مهمة جديدة…" />
        <Select value={priority} onValueChange={setPriority}>
          <SelectTrigger className="md:w-40">
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
        <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="md:w-40" />
        <Button
          className="gradient-gold font-bold"
          disabled={!title.trim() || add.isPending}
          onClick={() => add.mutate()}
        >
          <Plus className="mr-1 size-4" /> إضافة
        </Button>
      </div>

      <div className="space-y-2">
        {!total && <p className="hub-card p-6 text-center text-sm text-muted-foreground">لا توجد مهام بعد.</p>}
        {todos?.map((t) => (
          <div key={t.id} className="hub-card flex items-center gap-3 p-3">
            <button
              onClick={() => toggle.mutate({ id: t.id, is_done: t.is_done })}
              className={
                t.is_done
                  ? "gradient-gold flex size-7 items-center justify-center rounded-lg text-primary-foreground"
                  : "flex size-7 items-center justify-center rounded-lg border border-border"
              }
            >
              {t.is_done && <Check className="size-4" />}
            </button>
            <div className="flex-1">
              <p className={t.is_done ? "text-sm line-through opacity-60" : "text-sm font-semibold"}>
                {t.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {PRIORITIES.find((p) => p.value === t.priority)?.label}
                {t.due_date ? ` · 📅 ${t.due_date}` : ""}
              </p>
            </div>
            <Button size="icon" variant="ghost" onClick={() => remove.mutate(t.id)}>
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
