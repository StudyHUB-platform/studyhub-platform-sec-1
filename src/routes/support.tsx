import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { LifeBuoy, Send } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "الدعم الفني — Study HUB Support" },
      { name: "description", content: "تحدث مع فريق دعم Study HUB وأبلغ عن أي مشكلة أو اقتراح." },
      { property: "og:title", content: "الدعم الفني — Study HUB Support" },
      { property: "og:description", content: "دعم فني مباشر داخل المنصة." },
    ],
  }),
  component: SupportPage,
});

function SupportPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [subject, setSubject] = useState("");
  const [active, setActive] = useState<string | null>(null);
  const [body, setBody] = useState("");

  const { data: convos } = useQuery({
    queryKey: ["support-convos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_conversations")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: messages } = useQuery({
    queryKey: ["support-messages", active],
    enabled: !!active,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_messages")
        .select("*")
        .eq("conversation_id", active!)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!active) return;
    const channel = supabase
      .channel(`support-${active}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "support_messages" },
        () => void qc.invalidateQueries({ queryKey: ["support-messages", active] }),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [active, qc]);

  const openTicket = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("support_conversations")
        .insert({ user_id: user!.id, subject: subject.trim() })
        .select("id")
        .single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: (id) => {
      setSubject("");
      setActive(id);
      void qc.invalidateQueries({ queryKey: ["support-convos"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const send = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("support_messages").insert({
        conversation_id: active!,
        sender_id: user!.id,
        body: body.trim(),
        is_admin: false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setBody("");
      void qc.invalidateQueries({ queryKey: ["support-messages", active] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell title="🆘 Study HUB Support" subtitle="اتكلم مع فريق الدعم مباشرة">
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <div className="space-y-3">
          <div className="hub-card space-y-2 p-4">
            <p className="font-display font-bold">تذكرة جديدة</p>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="موضوع المشكلة…"
            />
            <Button
              className="gradient-gold w-full font-bold"
              disabled={!subject.trim()}
              onClick={() => openTicket.mutate()}
            >
              <LifeBuoy className="mr-1 size-4" /> فتح تذكرة
            </Button>
          </div>
          {convos?.map((c) => (
            <button
              key={c.id}
              onClick={() => setActive(c.id)}
              className={
                active === c.id
                  ? "shadow-gold w-full rounded-xl border border-primary/40 bg-primary/12 p-3 text-left"
                  : "hub-card w-full p-3 text-left"
              }
            >
              <p className="truncate text-sm font-bold">{c.subject}</p>
              <p className="text-xs text-muted-foreground">{c.status}</p>
            </button>
          ))}
        </div>

        <div className="hub-card flex h-[60vh] flex-col p-0">
          {!active ? (
            <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-muted-foreground">
              افتح تذكرة أو اختر محادثة للبدء
            </div>
          ) : (
            <>
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {messages?.map((m) => (
                  <div key={m.id} className={m.is_admin ? "flex justify-start" : "flex justify-end"}>
                    <div
                      className={
                        m.is_admin
                          ? "max-w-[80%] rounded-2xl bg-accent px-4 py-2 text-sm text-accent-foreground"
                          : "gradient-gold max-w-[80%] rounded-2xl px-4 py-2 text-sm font-medium text-primary-foreground"
                      }
                    >
                      <span className="mb-0.5 block text-[10px] font-bold opacity-70">
                        {m.is_admin ? "Support" : "You"}
                      </span>
                      {m.body}
                    </div>
                  </div>
                ))}
                {!messages?.length && (
                  <p className="text-sm text-muted-foreground">اكتب رسالتك الأولى…</p>
                )}
              </div>
              <div className="flex gap-2 border-t border-border p-3">
                <Input
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && body.trim() && send.mutate()}
                  placeholder="رسالتك…"
                />
                <Button className="gradient-gold" disabled={!body.trim()} onClick={() => send.mutate()}>
                  <Send className="size-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
