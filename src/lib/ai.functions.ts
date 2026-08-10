import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

async function callGateway(messages: Array<{ role: string; content: unknown }>) {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI is not configured");
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "google/gemini-3.5-flash", messages }),
  });
  if (!res.ok) {
    const detail = await res.text();
    if (res.status === 429) throw new Error("Rate limit reached, please try again in a moment.");
    if (res.status === 402) throw new Error("AI credits are exhausted.");
    throw new Error(`AI error: ${detail.slice(0, 200)}`);
  }
  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return json.choices?.[0]?.message?.content ?? "";
}

const messageSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(8000),
      }),
    )
    .max(30),
  imageDataUrl: z.string().max(6_000_000).optional(),
  fileText: z.string().max(60000).optional(),
  system: z.string().max(2000).optional(),
});

export const askStudyHubAi = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => messageSchema.parse(data))
  .handler(async ({ data }) => {
    const system =
      data.system ??
      "You are Study HUB AI, a friendly and precise study assistant for Egyptian high-school students. Answer in the same language the student uses (Arabic or English). Explain step by step, keep answers well structured with short headings and bullet points.";

    const history: Array<{ role: string; content: unknown }> = [{ role: "system", content: system }];
    data.messages.forEach((m, index) => {
      const isLast = index === data.messages.length - 1;
      if (isLast && m.role === "user" && (data.imageDataUrl || data.fileText)) {
        const parts: Array<Record<string, unknown>> = [
          {
            type: "text",
            text: data.fileText ? `${m.content}\n\n--- Attached document ---\n${data.fileText}` : m.content,
          },
        ];
        if (data.imageDataUrl) parts.push({ type: "image_url", image_url: { url: data.imageDataUrl } });
        history.push({ role: "user", content: parts });
      } else {
        history.push({ role: m.role, content: m.content });
      }
    });

    return { reply: await callGateway(history) };
  });

export const translateText = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        text: z.string().min(1).max(6000),
        from: z.string().max(40),
        to: z.string().max(40),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const reply = await callGateway([
      {
        role: "system",
        content:
          "You are a professional translator. Return ONLY the translation, with no notes, no quotes and no explanations.",
      },
      {
        role: "user",
        content: `Translate from ${data.from} to ${data.to}:\n\n${data.text}`,
      },
    ]);
    return { translation: reply.trim() };
  });

export const assistantGuide = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ question: z.string().min(1).max(2000) }).parse(data))
  .handler(async ({ data }) => {
    const reply = await callGateway([
      {
        role: "system",
        content:
          "You are the Study HUB Smart Assistant. You help students navigate the platform. Available sections: Library (categories: Summaries, External Books, Evaluation Books, Monthly Reviews, Final Reviews, Guidance Models, Posters; subjects: Arabic, English, History, Math, Combined Science, Philosophy, Programming, Islamic/Christian Religious Education, English AL, French, German; file types PDF, Video, Image, Link), Study HUB AI, Exams, To-Do List, Study Focus, Notes, Translator, Best Teachers, Calculator, Community, Support, Statistics, Latest Updates. Reply briefly (max 4 lines) in the student's language and always end with the exact path to open, e.g. 'Library → Summaries → Math → PDF'.",
      },
      { role: "user", content: data.question },
    ]);
    return { reply };
  });
