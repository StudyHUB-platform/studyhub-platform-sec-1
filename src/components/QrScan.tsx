import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ScanLine } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export function QrScanButton({ label = "Scan" }: { label?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" className="w-full" onClick={() => setOpen(true)}>
        <ScanLine className="mr-1 size-4" /> {label}
      </Button>
      {open && <ScanDialog onClose={() => setOpen(false)} />}
    </>
  );
}

function ScanDialog({ onClose }: { onClose: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();
  useEffect(() => {
    let scanner: { stop: () => void; destroy: () => void } | null = null;
    let done = false;
    void (async () => {
      const { default: QrScanner } = await import("qr-scanner");
      if (!video.current) return;
      const s = new QrScanner(
        video.current,
        (res) => {
          if (done) return;
          try {
            const url = new URL(res.data);
            const t = url.searchParams.get("t");
            if (url.pathname === "/link-device" && t && /^[0-9a-f]{64}$/.test(t)) {
              done = true;
              s.stop();
              onClose();
              void navigate({ to: "/link-device", search: { t } });
              return;
            }
          } catch { /* not a URL */ }
          toast.error("هذا ليس QR Code لربط حساب Study HUB");
        },
        { preferredCamera: "environment", highlightScanRegion: true, maxScansPerSecond: 3 },
      );
      scanner = s;
      await s.start().catch(() => toast.error("تعذّر فتح الكاميرا — اسمح بالوصول للكاميرا"));
    })();
    return () => { scanner?.stop(); scanner?.destroy(); };
  }, [navigate, onClose]);
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogTitle>📷 Scan QR Code</DialogTitle>
        <p className="text-xs text-muted-foreground">وجّه الكاميرا لرمز QR الظاهر في صفحة Profile على الجهاز الأساسي.</p>
        <video ref={video} className="aspect-square w-full rounded-xl bg-black object-cover" muted playsInline />
      </DialogContent>
    </Dialog>
  );
}
