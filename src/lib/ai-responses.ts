/* Lovable AI Gateway /v1/responses client (openai/gpt-6-astra, streamed SSE, strict JSON). */

const GATEWAY = "https://ai.gateway.lovable.dev/v1/responses";
const LOVABLE_AIG_RUN_ID_HEADER = "X-Lovable-AIG-Run-ID";

function createRunIdFetch(initialRunId?: string) {
  let runId = initialRunId?.trim() || undefined;
  return {
    getRunId: () => runId,
    fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      if (runId && !headers.has(LOVABLE_AIG_RUN_ID_HEADER)) headers.set(LOVABLE_AIG_RUN_ID_HEADER, runId);
      const response = await fetch(input, { ...init, headers });
      runId ??= response.headers.get(LOVABLE_AIG_RUN_ID_HEADER)?.trim() || undefined;
      return response;
    },
  };
}

type JsonSchema = Record<string, unknown>;

const RESPONSES_OPTS = {
  stream: true,
  store: false,
  reasoning: { effort: "low", summary: "auto" },
  include: ["reasoning.encrypted_content"],
};

/** One structured (strict json_schema) Responses call, streamed and accumulated. Retries once on 429/5xx. */
export async function callResponsesJson(opts: {
  system: string;
  user: string;
  schemaName: string;
  schema: JsonSchema;
  effort?: "low" | "medium";
}): Promise<string> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI is not configured");
  const input = [
    { role: "system", content: opts.system },
    { role: "user", content: opts.user },
  ];
  const body = {
    model: "openai/gpt-6-astra",
    input,
    ...RESPONSES_OPTS,
    reasoning: { ...RESPONSES_OPTS.reasoning, effort: opts.effort ?? "low" },
    text: {
      format: {
        type: "json_schema",
        name: opts.schemaName,
        strict: true,
        schema: opts.schema,
      },
    },
  };
  for (let attempt = 0; attempt <= 1; attempt++) {
    const gateway = createRunIdFetch();
    const res = await gateway.fetch(GATEWAY, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      let text = "";
      let errorEvent: string | null = null;
      const reader = res.body?.getReader();
      if (!reader) throw new Error("AI error: empty stream");
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (!payload || payload === "[DONE]") continue;
          try {
            const event = JSON.parse(payload) as {
              type?: string;
              delta?: string;
              error?: { message?: string };
              code?: string;
            };
            if (event.type === "response.output_text.delta" && event.delta) text += event.delta;
            if (event.type === "response.failed" || event.error) {
              errorEvent = event.error?.message ?? "AI stream failed";
            }
          } catch {
            /* ignore malformed keep-alive chunks */
          }
        }
      }
      if (errorEvent) throw new Error(errorEvent);
      if (!text.trim()) throw new Error("AI returned an empty result");
      return text;
    }
    const detail = await res.text();
    const retryable = res.status === 429 || res.status >= 500;
    if (retryable && attempt < 1) {
      await new Promise((r) => setTimeout(r, 1500));
      continue;
    }
    if (res.status === 429) throw new Error("AI rate limit reached — retry shortly.");
    if (res.status === 402) throw new Error("AI credits are exhausted.");
    throw new Error(`AI error: ${detail.slice(0, 200)}`);
  }
  throw new Error("AI error");
}
