import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { CORE_SUBJECTS, OTHER_SUBJECTS, SUBJECT_AR, SUBJECT_EMOJI } from "@/lib/hub";
import { cn } from "@/lib/utils";

/** Large, clear subject card — shared by Study HUB Library and Study HUB Videos. */
export function SubjectCard({
  subject,
  count,
  countLabel = "ملف",
  to,
  params,
  accent = "gold",
}: {
  subject: string;
  count?: number;
  countLabel?: string;
  to: string;
  params: Record<string, string>;
  accent?: "gold" | "red";
}) {
  return (
    <Link
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      to={to as any}
      params={params}
      className={cn(
        "hub-card group flex flex-col items-center justify-center p-6 text-center transition hover:-translate-y-0.5",
        accent === "red" ? "hover:border-destructive/60" : "hover:shadow-gold",
      )}
    >
      <span
        className={cn(
          "flex size-20 items-center justify-center rounded-2xl text-5xl md:size-24 md:text-6xl",
          accent === "red" ? "tone-card tone-red" : "tone-card tone-gold",
        )}
      >
        {SUBJECT_EMOJI[subject] ?? "📘"}
      </span>
      <span className="font-display mt-4 block text-lg leading-tight font-extrabold md:text-xl">
        {SUBJECT_AR[subject] ?? subject}
      </span>
      <span className="mt-1 block text-xs font-bold text-muted-foreground">{subject}</span>
      {count !== undefined && (
        <span className="mt-3 rounded-full bg-secondary px-3 py-1 text-[11px] font-bold text-secondary-foreground">
          {count} {countLabel}
        </span>
      )}
    </Link>
  );
}

export function SubjectSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="font-display mb-3 text-sm font-extrabold">{title}</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{children}</div>
    </section>
  );
}

export function SubjectGrid({
  to,
  buildParams,
  counts,
  countLabel,
  accent,
}: {
  to: string;
  buildParams: (subject: string) => Record<string, string>;
  counts?: Record<string, number>;
  countLabel?: string;
  accent?: "gold" | "red";
}) {
  const render = (s: string) => (
    <SubjectCard
      key={s}
      subject={s}
      to={to}
      params={buildParams(s)}
      {...(counts ? { count: counts[s] ?? 0 } : {})}
      {...(countLabel ? { countLabel } : {})}
      {...(accent ? { accent } : {})}
    />
  );

  return (
    <>
      <SubjectSection title="📚 المواد الأساسية — Core Subjects">
        {CORE_SUBJECTS.map(render)}
      </SubjectSection>
      <SubjectSection title="🧩 مواد أخرى — Other Subjects">{OTHER_SUBJECTS.map(render)}</SubjectSection>
    </>
  );
}
