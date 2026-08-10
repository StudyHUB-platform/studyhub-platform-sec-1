import { supabase } from "@/integrations/supabase/client";

export const STORAGE_PREFIX = "sb://";

/** Resolve a library item url into an openable link (signed for private files). */
export async function resolveLibraryUrl(url: string): Promise<string> {
  if (!url.startsWith(STORAGE_PREFIX)) return url;
  const path = url.slice(STORAGE_PREFIX.length);
  const { data, error } = await supabase.storage.from("library").createSignedUrl(path, 60 * 60);
  if (error || !data) throw new Error("تعذر فتح الملف");
  return data.signedUrl;
}

export async function uploadLibraryFile(file: File): Promise<string> {
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("library").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  return `${STORAGE_PREFIX}${path}`;
}
