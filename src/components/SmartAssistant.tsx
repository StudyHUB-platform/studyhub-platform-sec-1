import { useState } from "react";
import { Bot, Send, X } from "lucide-react";
import mascot from "@/assets/studyhub-mascot.png.asset.json";
import { useServerFn } from "@tanstack/react-start";
import { assistantGuide } from "@/lib/ai.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Msg = { role: "user" | "assistant"; content: string };

export function SmartAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content: "أنا المساعد الذكي 🤖 اسألني عن أي قسم في المنصة وأنا هوصلك للمكان الصح.",
    },
  ]);
  const ask = useServerFn(assistantGuide);

  const send = async () => {
    const question = input.trim();
    if (!question || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: question }]);
    setBusy(true);
    try {
      const res = await ask({ data: { question } });
      setMessages((m) => [...m, { role: "assistant", content: res.reply }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "حصلت مشكلة، جرب تاني." }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Smart Assistant"
          className="mascot-glow fixed right-5 bottom-5 z-40 flex size-16 items-center justify-center rounded-full bg-sidebar/90 p-1"
        >
          <img
            src={mascot.url}
            alt="Study HUB Assistant"
            className="mascot-float size-full object-contain drop-shadow-[0_0_10px_oklch(0.85_0.15_85/0.7)]"
          />
        </button>
      )}
      {open && (
        <div className="hub-card fixed right-4 bottom-4 z-40 flex h-[26rem] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <Bot className="size-5 text-primary" />
            <span className="font-display text-sm font-bold">Smart Assistant</span>
            <Button variant="ghost" size="icon" className="ml-auto size-8" onClick={() => setOpen(false)}>
              <X className="size-4" />
            </Button>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={
                  m.role === "user"
                    ? "gradient-gold ml-auto w-fit max-w-[85%] rounded-2xl px-3 py-2 text-sm font-medium text-primary-foreground"
                    : "w-fit max-w-[90%] rounded-2xl bg-secondary px-3 py-2 text-sm whitespace-pre-wrap text-secondary-foreground"
                }
              >
                {m.content}
              </div>
            ))}
            {busy && <p className="text-xs text-muted-foreground">جاري التفكير…</p>}
          </div>
          <div className="flex gap-2 border-t border-border p-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void send()}
              placeholder="اسأل عن أي قسم…"
            />
            <Button size="icon" onClick={() => void send()} disabled={busy}>
              <Send className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
