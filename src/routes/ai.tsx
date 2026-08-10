import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { Bot, ImagePlus, Paperclip, Send, User, X } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { askStudyHubAi } from "@/lib/ai.functions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/ai")({
  head: () => ({
    meta: [
      { title: "Study HUB AI — مساعد الدراسة الذكي" },
      {
        name: "description",
        content: "اسأل Study HUB AI أي سؤال دراسي، وارفع صور أو ملفات نصية ليحللها ويشرحها لك.",
      },
      { property: "og:title", content: "Study HUB AI — مساعد الدراسة الذكي" },
      { property: "og:description", content: "مساعد ذكاء اصطناعي يشرح ويحل أسئلتك الدراسية." },
    ],
  }),
  component: AiPage,
});

type Msg = { role: "user" | "assistant"; content: string };

function AiPage() {
  const ask = useServerFn(askStudyHubAi);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [image, setImage] = useState<{ name: string; dataUrl: string } | null>(null);
  const [fileText, setFileText] = useState<{ name: string; text: string } | null>(null);
  const imgRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const pickImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setImage({ name: file.name, dataUrl: String(reader.result) });
    reader.readAsDataURL(file);
  };

  const pickFile = async (file: File) => {
    const text = await file.text();
    setFileText({ name: file.name, text: text.slice(0, 60000) });
  };

  const send = async () => {
    const content = input.trim();
    if (!content || busy) return;
    const next = [...messages, { role: "user" as const, content }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const res = await ask({
        data: {
          messages: next.slice(-20),
          ...(image ? { imageDataUrl: image.dataUrl } : {}),
          ...(fileText ? { fileText: fileText.text } : {}),
        },
      });
      setMessages([...next, { role: "assistant", content: res.reply }]);
      setImage(null);
      setFileText(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "حصلت مشكلة");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell title="🤖 Study HUB AI" subtitle="اسأل أي سؤال دراسي — واتكلم بالعربي أو الإنجليزي">
      <div className="hub-card flex h-[70vh] flex-col p-0">
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {!messages.length && (
            <div className="mt-10 text-center">
              <Bot className="mx-auto size-10 text-primary" />
              <p className="font-display mt-3 font-bold">ابدأ المحادثة</p>
              <p className="mt-1 text-sm text-muted-foreground">
                مثال: "اشرحلي قوانين نيوتن" أو ارفع صورة سؤال وقوله حلّه.
              </p>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
              <div
                className={
                  m.role === "user"
                    ? "gradient-gold max-w-[85%] rounded-2xl px-4 py-2.5 text-sm font-medium text-primary-foreground"
                    : "max-w-[85%] rounded-2xl bg-accent px-4 py-2.5 text-sm whitespace-pre-wrap text-accent-foreground"
                }
              >
                <span className="mb-1 flex items-center gap-1.5 text-[10px] font-bold opacity-70">
                  {m.role === "user" ? <User className="size-3" /> : <Bot className="size-3" />}
                  {m.role === "user" ? "You" : "Study HUB AI"}
                </span>
                {m.content}
              </div>
            </div>
          ))}
          {busy && <p className="text-sm text-muted-foreground">Study HUB AI بيكتب…</p>}
        </div>

        <div className="border-t border-border p-3">
          {(image || fileText) && (
            <div className="mb-2 flex flex-wrap gap-2">
              {image && (
                <span className="flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs">
                  🖼️ {image.name}
                  <button onClick={() => setImage(null)}>
                    <X className="size-3" />
                  </button>
                </span>
              )}
              {fileText && (
                <span className="flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs">
                  📄 {fileText.name}
                  <button onClick={() => setFileText(null)}>
                    <X className="size-3" />
                  </button>
                </span>
              )}
            </div>
          )}
          <div className="flex items-end gap-2">
            <input
              ref={imgRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => e.target.files?.[0] && pickImage(e.target.files[0])}
            />
            <input
              ref={fileRef}
              type="file"
              accept=".txt,.md,.csv,.json"
              hidden
              onChange={(e) => e.target.files?.[0] && void pickFile(e.target.files[0])}
            />
            <Button variant="outline" size="icon" onClick={() => imgRef.current?.click()}>
              <ImagePlus className="size-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => fileRef.current?.click()}>
              <Paperclip className="size-4" />
            </Button>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              rows={1}
              placeholder="اكتب سؤالك…"
              className="min-h-10 flex-1 resize-none"
            />
            <Button className="gradient-gold" disabled={busy} onClick={() => void send()}>
              <Send className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
