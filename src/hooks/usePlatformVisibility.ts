import { useQuery } from "@tanstack/react-query";
import { useLocation } from "@tanstack/react-router";

import { supabase } from "@/integrations/supabase/client";
import { FEATURES } from "@/lib/hub";

export type SectionKey =
  | "library" | "videos" | "ai" | "exams" | "flashcards" | "focus" | "todo"
  | "notes" | "translator" | "teachers" | "calculator" | "community"
  | "statistics" | "updates" | "champions" | "academy" | "battles"
  | "support" | "honor";

/** Route prefix → section key (nested routes share the section). */
const SECTION_BY_PREFIX: [string, SectionKey][] = [
  ["/library", "library"],
  ["/videos", "videos"],
  ["/ai", "ai"],
  ["/exams", "exams"],
  ["/flashcards", "flashcards"],
  ["/focus", "focus"],
  ["/todo", "todo"],
  ["/notes", "notes"],
  ["/translator", "translator"],
  ["/teachers", "teachers"],
  ["/calculator", "calculator"],
  ["/community", "community"],
  ["/statistics", "statistics"],
  ["/updates", "updates"],
  ["/champions", "champions"],
  ["/academy", "academy"],
  ["/battles", "battles"],
  ["/support", "support"],
  ["/honor", "honor"],
];

export function sectionKeyForPath(pathname: string): SectionKey | null {
  for (const [prefix, key] of SECTION_BY_PREFIX) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) return key;
  }
  return null;
}

export function usePlatformVisibility() {
  return useQuery({
    queryKey: ["platform-visibility"],
    staleTime: 30_000,
    queryFn: async () => {
      const [sections, settings] = await Promise.all([
        supabase.from("platform_sections").select("key, is_visible"),
        supabase.from("platform_settings").select("key, value"),
      ]);
      const hidden = new Set<string>(
        (sections.data ?? []).filter((s) => !s.is_visible).map((s) => s.key),
      );
      const values: Record<string, string> = {};
      for (const s of settings.data ?? []) values[s.key] = s.value;
      return { hidden, values };
    },
  });
}

/** Is the section for this path visible? Defaults to visible while loading. */
export function useSectionVisible(pathname: string) {
  const { data } = usePlatformVisibility();
  const key = sectionKeyForPath(pathname);
  if (!key) return { visible: true, loading: false };
  return { visible: !data?.hidden.has(key), loading: !data };
}

/** FEATURES filtered by admin visibility settings. */
export function useVisibleFeatures() {
  const { data } = usePlatformVisibility();
  return FEATURES.filter((f) => {
    const key = sectionKeyForPath(f.to);
    return !key || !data?.hidden.has(key);
  });
}
