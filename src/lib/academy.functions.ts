import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/* Shared Lovable AI gateway helper (same convention as ai.functions.ts). */
const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

export async function callAI(
  messages: Array<{ role: string; content: unknown }>,
  opts?: { retries?: number },
): Promise<string> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI is not configured");
  const retries = opts?.retries ?? 1;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(GATEWAY, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "google/gemini-3.5-flash", messages }),
    });
    if (res.ok) {
      const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
      return json.choices?.[0]?.message?.content ?? "";
    }
    if (res.status === 429 && attempt < retries) {
      await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
      continue;
    }
    if (res.status === 429) throw new Error("AI rate limit reached — retry shortly.");
    if (res.status === 402) throw new Error("AI credits are exhausted.");
    const detail = await res.text();
    throw new Error(`AI error: ${detail.slice(0, 200)}`);
  }
  throw new Error("AI error");
}

async function assertStaff(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .in("role", ["admin", "owner"])
    .maybeSingle();
  if (!data) throw new Error("Forbidden: admin only");
  return supabaseAdmin;
}

export type LessonContent = {
  objectives?: string[];
  explanation?: string;
  definitions?: { term: string; meaning: string }[];
  examples?: { question: string; solution: string }[];
  equations?: string[];
  practice?: { question: string; choices: string[]; answer: string; explanation: string; difficulty: "easy" | "medium" | "hard" }[];
  references?: string[];
};

/* ---------------- AI Studio ---------------- */

const pagesSchema = z.object({
  subject: z.string().min(1).max(60),
  grade: z.string().min(1).max(40).default("Grade 1"),
  title: z.string().min(1).max(120),
  pages: z.array(z.object({ page: z.number().int().min(1), content: z.string().min(1).max(40000), unclear: z.boolean().default(false) })).min(1).max(120),
});

/** Create a book draft from uploaded page text (client extracts PDF text). */
export const academyCreateBook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => pagesSchema.parse(d))
  .handler(async ({ data, context }) => {
    const admin = await assertStaff(context.userId);
    const { data: book, error } = await admin
      .from("academy_books")
      .insert({ subject: data.subject, grade: data.grade, title: data.title, created_by: context.userId, status: "draft" })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    const { error: pagesErr } = await admin.from("academy_source_pages").insert(
      data.pages.map((p) => ({ book_id: book.id, page_number: p.page, content: p.content, unclear: p.unclear })),
    );
    if (pagesErr) throw new Error(pagesErr.message);
    return { bookId: book.id as string, unclearPages: data.pages.filter((p) => p.unclear).map((p) => p.page) };
  });

const STRUCTURE_SYSTEM = `You are an expert curriculum analyst. From the given book pages, propose the book structure: units and lessons. Detect OCR problems: if a page looks scanned/garbled/incomplete, mark it needs_review. NEVER invent missing content. Reply with ONLY valid JSON:
{"subject":"...","grade":"...","units":[{"title":"Unit title","lessons":[{"title":"Lesson title","page_start":1,"page_end":3}]}],"unclear_pages":[page numbers]}
Pages are numbered as provided.`;

/** Step 1 of AI Studio: propose the book structure (drafts only, admin approves next). */
export const academyAnalyzeStructure = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ bookId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const admin = await assertStaff(context.userId);
    const { data: pages } = await admin
      .from("academy_source_pages")
      .select("page_number, content")
      .eq("book_id", data.bookId)
      .order("page_number");
    if (!pages?.length) throw new Error("لا توجد صفحات محفوظة لهذا الكتاب");
    // Feed a bounded sample (first 60k chars) to keep the request safe.
    const text = pages
      .map((p) => `--- Page ${p.page_number} ---\n${p.content}`)
      .join("\n")
      .slice(0, 60000);
    const reply = await callAI(
      [
        { role: "system", content: STRUCTURE_SYSTEM },
        { role: "user", content: text },
      ],
      { retries: 1 },
    );
    let parsed: {
      subject?: string; grade?: string; unclear_pages?: number[];
      units?: { title: string; lessons: { title: string; page_start?: number; page_end?: number }[] }[];
    };
    try {
      parsed = JSON.parse(reply.replace(/^```json\s*|```$/g, "").trim());
    } catch {
      throw new Error("تعذر تحليل هيكل الكتاب — أعد المحاولة");
    }
    // Replace existing draft structure for this book.
    await admin.from("academy_lessons").delete().in(
      "unit_id",
      ((await admin.from("academy_units").select("id").eq("book_id", data.bookId)).data ?? []) as { id: string }[],
    );
    await admin.from("academy_units").delete().eq("book_id", data.bookId);
    const unitsToInsert = (parsed.units ?? []).map((u, i) => ({ book_id: data.bookId, title: u.title, position: i + 1 }));
    if (!unitsToInsert.length) throw new Error("الذكاء الاصطناعي لم يقترح وحدات — أعد المحاولة");
    const { data: units } = await admin.from("academy_units").insert(unitsToInsert).select("id");
    const lessonRows = (units ?? []).flatMap((u, i) =>
      (parsed.units![i]!.lessons ?? []).map((l, j) => ({
        unit_id: u.id,
        title: l.title,
        position: j + 1,
        page_start: l.page_start ?? null,
        page_end: l.page_end ?? null,
        status: "draft",
      })),
    );
    if (lessonRows.length) await admin.from("academy_lessons").insert(lessonRows);
    if (parsed.subject) {
      await admin.from("academy_books").update({ subject: parsed.subject }).eq("id", data.bookId);
    }
    if (parsed.unclear_pages?.length) {
      await admin.from("academy_source_pages").update({ unclear: true }).in("page_number", parsed.unclear_pages).eq("book_id", data.bookId);
    }
    await admin.from("academy_books").update({ status: "approved" }).eq("id", data.bookId);
    return { units: unitsToInsert.length, lessons: lessonRows.length, unclearPages: parsed.unclear_pages ?? [] };
  });

const LESSON_SYSTEM = `You write an educational lesson for Egyptian students in the subject taught, based ONLY on the provided source pages. Never invent facts beyond the pages; if the pages are unclear about something, omit it. Reply with ONLY valid JSON:
{"objectives":["..."],"explanation":"long markdown explanation","definitions":[{"term":"...","meaning":"..."}],"examples":[{"question":"...","solution":"..."}],"equations":["..."],"practice":[{"question":"...","choices":["A","B","C","D"],"answer":"A","explanation":"why","difficulty":"easy|medium|hard"}],"references":["page N"]}`;

/** Step 2: generate one lesson draft from its source pages (resumable, one lesson per call). */
export const academyGenerateLesson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ lessonId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const admin = await assertStaff(context.userId);
    const { data: lesson } = await admin
      .from("academy_lessons")
      .select("id, title, page_start, page_end, unit_id, status")
      .eq("id", data.lessonId)
      .single();
    if (!lesson) throw new Error("الدرس غير موجود");
    const { data: unit } = await admin.from("academy_units").select("book_id, title").eq("id", lesson.unit_id).single();
    if (!unit) throw new Error("الوحدة غير موجودة");
    const { data: book } = await admin.from("academy_books").select("subject, grade").eq("id", unit.book_id).single();
    let pagesQuery = admin
      .from("academy_source_pages")
      .select("page_number, content")
      .eq("book_id", unit.book_id)
      .order("page_number");
    if (lesson.page_start) pagesQuery = pagesQuery.gte("page_number", lesson.page_start);
    if (lesson.page_end) pagesQuery = pagesQuery.lte("page_number", lesson.page_end);
    const { data: pages } = await pagesQuery;
    if (!pages?.length) {
      await admin.from("academy_lessons").update({ status: "failed", error_note: "لا توجد صفحات مصدرية لهذا الدرس — عدّل نطاق الصفحات" }).eq("id", data.lessonId);
      throw new Error("لا توجد صفحات مصدرية لهذا الدرس — عدّل نطاق الصفحات ثم أعد التوليد");
    }
    const text = pages
      .map((p) => `--- Page ${p.page_number} ---\n${p.content}`)
      .join("\n")
      .slice(0, 40000);
    try {
      const reply = await callAI(
        [
          { role: "system", content: LESSON_SYSTEM },
          {
            role: "user",
            content: `Subject: ${book?.subject ?? "General"} | Grade: ${book?.grade ?? ""}\nUnit: ${unit.title}\nLesson: ${lesson.title}\n\nSource pages:\n${text}`,
          },
        ],
        { retries: 1 },
      );
      const content = JSON.parse(reply.replace(/^```json\s*|```$/g, "").trim()) as LessonContent;
      const filled = [content.explanation, content.practice?.length, content.examples?.length].filter(Boolean).length;
      const completion = Math.round((filled / 3) * 100);
      const version = Date.now(); // monotonic version stamp
      await admin.from("academy_lessons").update({
        content, status: "needs_review", completion, version, error_note: null, updated_at: new Date().toISOString(),
      }).eq("id", data.lessonId);
      await admin.from("academy_lesson_versions").insert({ lesson_id: data.lessonId, version, content, created_by: context.userId });
      return { ok: true, completion };
    } catch (e) {
      const note = e instanceof Error ? e.message : "فشل التوليد";
      await admin.from("academy_lessons").update({ status: "failed", error_note: note }).eq("id", data.lessonId);
      throw e;
    }
  });

/** Admin: list books with per-book lesson stats. */
export const academyAdminList = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const admin = await assertStaff(context.userId);
    const { data: books } = await admin.from("academy_books").select("*").order("created_at", { ascending: false });
    const { data: units } = await admin.from("academy_units").select("id, book_id, title, position");
    const { data: lessons } = await admin
      .from("academy_lessons")
      .select("id, unit_id, title, position, status, completion, version, page_start, page_end, error_note")
      .order("position");
    return { books: books ?? [], units: units ?? [], lessons: lessons ?? [] };
  });

/** Admin: full lesson detail for review/edit. */
export const academyAdminGetLesson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ lessonId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const admin = await assertStaff(context.userId);
    const { data: lesson } = await admin.from("academy_lessons").select("*").eq("id", data.lessonId).single();
    if (!lesson) throw new Error("الدرس غير موجود");
    const { data: versions } = await admin
      .from("academy_lesson_versions")
      .select("version, created_at")
      .eq("lesson_id", data.lessonId)
      .order("version", { ascending: false })
      .limit(10);
    return { lesson, versions: versions ?? [] };
  });

const lessonPatch = z.object({
  lessonId: z.string().uuid(),
  title: z.string().max(160).optional(),
  content: z.record(z.string(), z.unknown()).optional(),
  status: z.enum(["draft", "needs_review", "approved", "published", "failed", "hidden"]).optional(),
  error_note: z.string().max(500).nullable().optional(),
  page_start: z.number().int().min(1).nullable().optional(),
  page_end: z.number().int().min(1).nullable().optional(),
});

/** Admin: edit a lesson (title/content/status/pages). Publishing requires approved status. */
export const academyUpdateLesson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => lessonPatch.parse(d))
  .handler(async ({ data, context }) => {
    const admin = await assertStaff(context.userId);
    const { data: current } = await admin.from("academy_lessons").select("status, version").eq("id", data.lessonId).single();
    if (!current) throw new Error("الدرس غير موجود");
    if (data.status === "published" && current.status !== "approved" && !data.content) {
      throw new Error("لا نشر قبل اعتماد الدرس (Approved) — عدّل ثم اعتمده أولًا");
    }
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (data.title !== undefined) patch.title = data.title;
    if (data.content !== undefined) patch.content = data.content;
    if (data.status !== undefined) patch.status = data.status;
    if (data.error_note !== undefined) patch.error_note = data.error_note;
    if (data.page_start !== undefined) patch.page_start = data.page_start;
    if (data.page_end !== undefined) patch.page_end = data.page_end;
    if (data.content !== undefined) {
      patch.version = current.version + 1;
      await admin.from("academy_lesson_versions").insert({
        lesson_id: data.lessonId, version: current.version + 1, content: data.content, created_by: context.userId,
      });
    }
    const { error } = await admin.from("academy_lessons").update(patch).eq("id", data.lessonId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Admin: hide a failed/harmful lesson temporarily without deleting it. */
export const academyHideLesson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ lessonId: z.string().uuid(), hidden: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    const admin = await assertStaff(context.userId);
    const { error } = await admin
      .from("academy_lessons")
      .update({ status: data.hidden ? "hidden" : "draft", updated_at: new Date().toISOString() })
      .eq("id", data.lessonId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Student-side: fetch one published lesson with unit/book context. */
export const academyGetPublishedLesson = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ lessonId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { createPublicClient } = await import("@/lib/public-client");
    const client = createPublicClient();
    const { data: lesson } = await client
      .from("academy_lessons")
      .select("id, title, content, unit_id, status")
      .eq("id", data.lessonId)
      .eq("status", "published")
      .maybeSingle();
    if (!lesson) throw new Error("الدرس غير منشور أو غير موجود");
    const { data: unit } = await client.from("academy_units").select("id, title, book_id").eq("id", lesson.unit_id).single();
    const { data: book } = unit
      ? await client.from("academy_books").select("id, subject, grade, title").eq("id", unit.book_id).single()
      : { data: null };
    return { lesson, unit, book };
  });
