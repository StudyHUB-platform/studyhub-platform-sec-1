import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SUBJECT_AR, SUBJECT_EMOJI } from "@/lib/hub";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/flashcards/$subject")({
  head: () => ({
    meta: [
      { title: "مراجعة المادة — Flash Cards" },
      { name: "description", content: "أضف كروت أسئلة وإجابات وراجعها بطريقة تفاعلية." },
      { property: "og:title", content: "مراجعة المادة — Flash Cards" },
      { property: "og:description", content: "Add Card و View Cards لكل مادة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SubjectCards,
});

type Card = { id: string; question: string; answer: string };

function FlipCard({ card, onDelete }: { card: Card; onDelete: () => void }) {
  // 0 = مقلوب، 1 = السؤال، 2 = الإجابة
  const [face, setFace] = useState(0);
  return (
    <div className="relative">
      <button
        onClick={() => setFace((f) => (f + 1) % 3)}
        className={cn(
          "flex aspect-[3/4] w-full flex-col items-center justify-center rounded-2xl p-4 text-center shadow-card transition-transform duration-300 active:scale-95",
          face === 0 && "tone-bluegray text-tone-foreground",
          face === 1 && "hub-card",
          face === 2 && "gradient-gold text-primary-foreground",
        )}
      >
        {face === 0 && (
          <>
            <span className="text-5xl">🃏</span>
            <span className="mt-2 text-xs opacity-80">اضغط لرؤية السؤال</span>
          </>
        )}
        {face === 1 && (
          <>
            <span className="text-[11px] font-bold text-primary">❓ السؤال</span>
            <span className="mt-2 text-sm font-bold whitespace-pre-wrap">{card.question}</span>
            <span className="mt-3 text-[10px] text-muted-foreground">اضغط لرؤية الإجابة</span>
          </>
        )}
        {face === 2 && (
          <>
            <span className="text-[11px] font-bold">✅ الإجابة</span>
            <span className="mt-2 text-sm font-bold whitespace-pre-wrap">{card.answer}</span>
          </>
        )}
      </button>
      <Button size="icon" variant="ghost" className="absolute top-1 left-1 size-7" onClick={onDelete} aria-label="حذف">
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  );
}

function SubjectCards() {
  const { subject } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [mode, setMode] = useState<"menu" | "add" | "view">("menu");
  const [q, setQ] = useState("");
  const [a, setA] = useState("");

  const { data: cards = [] } = useQuery({
    queryKey: ["flashcards", subject],
    queryFn: async () =>
      ((await supabase.from("flashcards").select("id, question, answer").eq("subject", subject).order("created_at", { ascending: false })).data ?? []) as Card[],
  });
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["flashcards", subject] });
    void qc.invalidateQueries({ queryKey: ["flashcards-count"] });
  };
  const add = async () => {
    if (!q.trim() || !a.trim()) { toast.error("اكتب السؤال والإجابة"); return; }
    const { error } = await supabase.from("flashcards").insert({ user_id: user!.id, subject, question: q.trim().slice(0, 1000), answer: a.trim().slice(0, 1000) });
    if (error) { toast.error(error.message); return; }
    toast.success("تمت إضافة الكارت 🃏");
    setQ(""); setA(""); refresh();
  };
  const del = async (id: string) => {
    const { error } = await supabase.from("flashcards").delete().eq("id", id);
    if (error) toast.error(error.message); else refresh();
  };

  return (
    <AppShell title={`${SUBJECT_EMOJI[subject] ?? "🃏"} ${SUBJECT_AR[subject] ?? subject}`} subtitle={`${subject} · ${cards.length} كارت`}>
      <div className="mb-4 flex flex-wrap gap-2">
        <Button variant="outline" asChild><Link to="/flashcards">← كل المواد</Link></Button>
        <Button className={mode === "add" ? "gradient-gold font-bold" : ""} variant={mode === "add" ? "default" : "outline"} onClick={() => setMode("add")}>➕ Add Card</Button>
        <Button className={mode === "view" ? "gradient-gold font-bold" : ""} variant={mode === "view" ? "default" : "outline"} onClick={() => setMode("view")}>🃏 View Cards</Button>
      </div>

      {mode === "menu" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <button onClick={() => setMode("add")} className="tone-card tone-bluegray p-8 text-center">
            <p className="text-4xl">➕</p><p className="font-display mt-2 font-bold">Add Card</p><p className="text-xs opacity-80">أضف سؤال وإجابته بسرعة</p>
          </button>
          <button onClick={() => setMode("view")} className="tone-card tone-blue p-8 text-center">
            <p className="text-4xl">🃏</p><p className="font-display mt-2 font-bold">View Cards</p><p className="text-xs opacity-80">راجع كروتك المقلوبة</p>
          </button>
        </div>
      )}

      {mode === "add" && (
        <div className="hub-card mx-auto max-w-lg space-y-3 p-5">
          <Textarea placeholder="السؤال" value={q} maxLength={1000} onChange={(e) => setQ(e.target.value)} />
          <Textarea placeholder="الإجابة" value={a} maxLength={1000} onChange={(e) => setA(e.target.value)} />
          <Button className="gradient-gold w-full font-bold" onClick={() => void add()}>حفظ الكارت</Button>
        </div>
      )}

      {mode === "view" && (
        cards.length === 0 ? (
          <p className="text-sm text-muted-foreground">لا توجد كروت بعد — أضف أول كارت.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {cards.map((c) => <FlipCard key={c.id} card={c} onDelete={() => void del(c.id)} />)}
          </div>
        )
      )}
    </AppShell>
  );
}
