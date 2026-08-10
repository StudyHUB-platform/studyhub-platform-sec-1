import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/notes")({
  head: () => ({
    meta: [
      { title: "الملاحظات — Study HUB Notes" },
      { name: "description", content: "أنشئ لوحات ملاحظات منظمة لكل مادة واحفظ أفكارك ومراجعاتك." },
      { property: "og:title", content: "الملاحظات — Study HUB Notes" },
      { property: "og:description", content: "لوحات ملاحظات منظمة لكل مادة." },
    ],
  }),
  component: NotesPage,
});

function NotesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [boardName, setBoardName] = useState("");
  const [activeBoard, setActiveBoard] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const { data: boards } = useQuery({
    queryKey: ["boards"],
    queryFn: async () => {
      const { data, error } = await supabase.from("note_boards").select("*").order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const { data: notes } = useQuery({
    queryKey: ["notes", activeBoard],
    queryFn: async () => {
      let q = supabase.from("notes").select("*").order("updated_at", { ascending: false });
      if (activeBoard) q = q.eq("board_id", activeBoard);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const addBoard = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("note_boards")
        .insert({ user_id: user!.id, name: boardName.trim() });
      if (error) throw error;
    },
    onSuccess: () => {
      setBoardName("");
      void qc.invalidateQueries({ queryKey: ["boards"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addNote = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("notes").insert({
        user_id: user!.id,
        board_id: activeBoard,
        title: title.trim() || "بدون عنوان",
        content,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setTitle("");
      setContent("");
      void qc.invalidateQueries({ queryKey: ["notes"] });
      toast.success("تم حفظ الملاحظة");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delNote = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["notes"] }),
  });

  return (
    <AppShell title="🗒️ Notes" subtitle="نظّم ملاحظاتك في لوحات لكل مادة">
      <div className="hub-card mb-5 p-4">
        <p className="mb-2 text-xs font-bold text-muted-foreground">اللوحات</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveBoard(null)}
            className={
              !activeBoard
                ? "gradient-gold rounded-full px-3 py-1.5 text-xs font-bold text-primary-foreground"
                : "rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground"
            }
          >
            الكل
          </button>
          {boards?.map((b) => (
            <button
              key={b.id}
              onClick={() => setActiveBoard(b.id)}
              className={
                activeBoard === b.id
                  ? "gradient-gold rounded-full px-3 py-1.5 text-xs font-bold text-primary-foreground"
                  : "rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground"
              }
            >
              {b.name}
            </button>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <Input
            value={boardName}
            onChange={(e) => setBoardName(e.target.value)}
            placeholder="لوحة جديدة…"
          />
          <Button variant="outline" disabled={!boardName.trim()} onClick={() => addBoard.mutate()}>
            <Plus className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="hub-card space-y-3 p-4">
          <p className="font-display font-bold">ملاحظة جديدة</p>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="العنوان" />
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
            placeholder="اكتب ملاحظتك…"
          />
          <Button
            className="gradient-gold w-full font-bold"
            disabled={!content.trim() && !title.trim()}
            onClick={() => addNote.mutate()}
          >
            <Save className="mr-1 size-4" /> حفظ
          </Button>
        </div>

        <div className="space-y-3">
          {!notes?.length && (
            <p className="hub-card p-6 text-center text-sm text-muted-foreground">لا توجد ملاحظات بعد.</p>
          )}
          {notes?.map((n) => (
            <article key={n.id} className="hub-card p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="font-display font-bold">{n.title}</p>
                <Button size="icon" variant="ghost" onClick={() => delNote.mutate(n.id)}>
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
              <p className="mt-1 text-sm whitespace-pre-wrap text-muted-foreground">{n.content}</p>
              <p className="mt-2 text-[11px] text-muted-foreground">
                {new Date(n.updated_at).toLocaleString("ar-EG")}
              </p>
            </article>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
