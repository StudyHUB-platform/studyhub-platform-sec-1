import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowLeftRight, Copy, Languages } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { translateText } from "@/lib/ai.functions";
import { TRANSLATE_LANGUAGES } from "@/lib/hub";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/translator")({
  head: () => ({
    meta: [
      { title: "المترجم — Study HUB Translator" },
      { name: "description", content: "ترجم بين أكثر من 25 لغة بدقة عالية داخل Study HUB." },
      { property: "og:title", content: "المترجم — Study HUB Translator" },
      { property: "og:description", content: "ترجمة فورية بين أكثر من 25 لغة." },
    ],
  }),
  component: TranslatorPage,
});

function TranslatorPage() {
  const translate = useServerFn(translateText);
  const [from, setFrom] = useState("English");
  const [to, setTo] = useState("Arabic");
  const [text, setText] = useState("");
  const [out, setOut] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (!text.trim()) return;
    setBusy(true);
    try {
      const res = await translate({ data: { text, from, to } });
      setOut(res.translation);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "تعذر الترجمة");
    } finally {
      setBusy(false);
    }
  };

  const swap = () => {
    setFrom(to);
    setTo(from);
    setText(out);
    setOut(text);
  };

  return (
    <AppShell title="🌐 Translator" subtitle="ترجمة بين أكثر من 25 لغة">
      <div className="hub-card space-y-4 p-4">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <p className="mb-1 text-xs font-bold text-muted-foreground">From</p>
            <Select value={from} onValueChange={setFrom}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRANSLATE_LANGUAGES.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="icon" onClick={swap}>
            <ArrowLeftRight className="size-4" />
          </Button>
          <div className="flex-1">
            <p className="mb-1 text-xs font-bold text-muted-foreground">To</p>
            <Select value={to} onValueChange={setTo}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRANSLATE_LANGUAGES.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            placeholder="اكتب النص المطلوب ترجمته…"
          />
          <div className="relative">
            <Textarea value={out} readOnly rows={8} placeholder="الترجمة تظهر هنا…" />
            {out && (
              <Button
                size="icon"
                variant="outline"
                className="absolute top-2 right-2"
                onClick={() => {
                  void navigator.clipboard.writeText(out);
                  toast.success("تم النسخ");
                }}
              >
                <Copy className="size-3.5" />
              </Button>
            )}
          </div>
        </div>

        <Button className="gradient-gold w-full font-bold" disabled={busy} onClick={() => void run()}>
          <Languages className="mr-2 size-4" /> ترجم
        </Button>
      </div>
    </AppShell>
  );
}
