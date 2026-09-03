import { useEffect, useState } from "react";

import { resolveLibraryUrl } from "@/lib/storage";

/** Renders an image whose url may be a private storage pointer (sb://…). */
export function LibraryImage({
  url,
  alt = "",
  className,
}: {
  url: string;
  alt?: string;
  className?: string;
}) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void resolveLibraryUrl(url)
      .then((r) => {
        if (alive) setSrc(r);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [url]);

  if (!src) return null;
  return <img src={src} alt={alt} className={className} loading="lazy" />;
}
