import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import { redeemDeviceLink } from "@/lib/account.functions";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/link-device")({
  validateSearch: z.object({ t: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "ربط الجهاز — Study HUB" },
      { name: "description", content: "ادخل إلى حسابك في Study HUB من جهاز آخر عبر QR Code." },
      { property: "og:title", content: "ربط الجهاز — Study HUB" },
      { property: "og:description", content: "ربط جهاز جديد بحسابك بأمان." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LinkDevice,
});

function LinkDevice() {
  const { t } = Route.useSearch();
  const navigate = useNavigate();
  const redeem = useServerFn(redeemDeviceLink);
  const [msg, setMsg] = useState("جاري ربط الجهاز…");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    void (async () => {
      if (!t) { setMsg("رمز الربط غير موجود"); return; }
      const r = await redeem({ data: { token: t } }).catch(() => null);
      if (!r || !r.ok) { setMsg(r && !r.ok ? r.error : "تعذّر ربط الجهاز"); return; }
      await supabase.auth.signOut();
      const { error } = await supabase.auth.verifyOtp({ token_hash: r.token_hash, type: "magiclink" });
      if (error) { setMsg("تعذّر ربط الجهاز — حاول مرة أخرى"); return; }
      setMsg("✅ تم ربط الجهاز بنجاح");
      void navigate({ to: "/dashboard", replace: true });
    })();
  }, [t, redeem, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="hub-card max-w-sm p-8 text-center">
        <p className="text-4xl">📱</p>
        <p className="font-display mt-3 font-bold">{msg}</p>
        <Button className="gradient-gold mt-4 font-bold" onClick={() => navigate({ to: "/auth" })}>صفحة الدخول</Button>
      </div>
    </div>
  );
}
