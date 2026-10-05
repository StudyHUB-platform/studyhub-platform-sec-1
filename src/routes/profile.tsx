import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Copy, LogOut, Puzzle, QrCode, Save } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { LevelBadge } from "@/components/Gamification";
import { QrScanButton } from "@/components/QrScan";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMyStats } from "@/hooks/useMyStats";
import { levelInfo } from "@/lib/gamification";
import { setPhoneLogin } from "@/lib/account.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "الملف الشخصي — Study HUB" },
      { name: "description", content: "حسابك في Study HUB: الـID، المستوى، الـShards، ربط الأجهزة والدخول برقم الهاتف." },
      { property: "og:title", content: "الملف الشخصي — Study HUB" },
      { property: "og:description", content: "إدارة حسابك وبياناتك وربط أجهزتك." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProfilePage,
});

function DeviceLink() {
  const [qr, setQr] = useState<string | null>(null);
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (left <= 0) { if (qr) setQr(null); return; }
    const t = setTimeout(() => setLeft((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [left, qr]);
  const generate = async () => {
    const { data, error } = await supabase.rpc("create_device_link");
    if (error || !data) { toast.error(error?.message ?? "تعذّر إنشاء الرمز"); return; }
    const QRCode = (await import("qrcode")).default;
    setQr(await QRCode.toDataURL(`${window.location.origin}/link-device?t=${data}`, { width: 260, margin: 1 }));
    setLeft(120);
  };
  return (
    <div className="hub-card space-y-3 p-5">
      <p className="font-display font-bold">📱 ربط الجهاز</p>
      <p className="text-xs text-muted-foreground">
        اعرض الـQR Code هنا، ثم اعمل Scan من الجهاز الآخر (من صفحة الدخول أو بكاميرا الموبايل) للدخول لنفس الحساب. الرمز يُستخدم مرة واحدة وينتهي بعد دقيقتين.
      </p>
      {qr ? (
        <div className="text-center">
          <img src={qr} alt="QR Code لربط الجهاز" className="mx-auto rounded-xl bg-white p-2" />
          <p className="mt-2 text-xs text-muted-foreground">ينتهي خلال {Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}</p>
        </div>
      ) : (
        <Button className="gradient-gold w-full font-bold" onClick={() => void generate()}>
          <QrCode className="mr-1 size-4" /> إظهار QR Code
        </Button>
      )}
      <QrScanButton label="Scan — الدخول بحساب من جهاز آخر" />
    </div>
  );
}

function PhoneLogin() {
  const { data: current } = useQuery({
    queryKey: ["phone-login"],
    queryFn: async () => (await supabase.from("phone_logins").select("phone").maybeSingle()).data,
  });
  const save = useServerFn(setPhoneLogin);
  const qc = useQueryClient();
  const [phone, setPhone] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (current?.phone) setPhone(current.phone); }, [current]);
  const submit = async () => {
    if (!/^01[0125]\d{8}$/.test(phone)) { toast.error("رقم الهاتف يجب أن يكون 11 رقم صحيح (010/011/012/015)"); return; }
    if (pw.length < 6) { toast.error("كلمة المرور 6 أحرف على الأقل"); return; }
    setBusy(true);
    const r = await save({ data: { phone, password: pw } }).catch((e: Error) => ({ ok: false, error: e.message }));
    setBusy(false);
    if (!r.ok) { toast.error(r.error ?? "تعذّر الحفظ"); return; }
    toast.success("تم — يمكنك الدخول الآن برقم الهاتف وكلمة المرور");
    setPw("");
    void qc.invalidateQueries({ queryKey: ["phone-login"] });
  };
  return (
    <div className="hub-card space-y-3 p-5">
      <p className="font-display font-bold">📞 تسجيل الدخول برقم الهاتف</p>
      {current?.phone && <p className="text-xs text-primary">✅ مفعّل على الرقم {current.phone}</p>}
      <Input value={phone} dir="ltr" inputMode="numeric" maxLength={11} placeholder="01xxxxxxxxx" onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} />
      <Input type="password" value={pw} placeholder="كلمة المرور" onChange={(e) => setPw(e.target.value)} />
      <Button className="gradient-gold w-full font-bold" disabled={busy} onClick={() => void submit()}>حفظ</Button>
    </div>
  );
}

function ProfilePage() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const { data: stats } = useMyStats();
  const qc = useQueryClient();
  const [name, setName] = useState("");

  useEffect(() => { setName(profile?.full_name ?? ""); }, [profile]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("profiles").update({ full_name: name.trim().slice(0, 80) }).eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("تم حفظ البيانات"); void qc.invalidateQueries(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const info = stats ? levelInfo(stats.level) : null;

  return (
    <AppShell title="👤 Profile" subtitle="بياناتك الشخصية">
      <div className="mx-auto grid max-w-3xl gap-4 md:grid-cols-2">
        <div className="tone-card tone-blue space-y-3 p-5 md:col-span-2">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-5xl">{info?.badge ?? "🌱"}</span>
            <div className="flex-1">
              <p className="font-display text-xl font-extrabold">{profile?.full_name ?? "طالب Study HUB"}</p>
              {stats && <LevelBadge level={stats.level} className="mt-1" />}
            </div>
            <span className="flex items-center gap-1 rounded-full bg-black/25 px-3 py-1 font-display font-extrabold">
              <Puzzle className="size-4 fill-primary text-primary" /> {stats?.shards ?? 0} Shards
            </span>
          </div>
          {stats && (
            <div>
              <div className="mb-1 flex justify-between text-xs"><span>XP</span><span>{stats.xp_in_level}/{stats.xp_needed}{stats.level >= 50 ? " (أعلى مستوى)" : ""}</span></div>
              <Progress value={Math.min(100, (stats.xp_in_level / stats.xp_needed) * 100)} />
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <span className="opacity-80">ID:</span>
            <span className="font-display tracking-widest" dir="ltr">{stats?.public_id ?? "—"}</span>
            {stats && (
              <Button size="icon" variant="ghost" className="size-7" onClick={() => { void navigator.clipboard.writeText(stats.public_id); toast.success("تم نسخ الـID"); }}>
                <Copy className="size-3.5" />
              </Button>
            )}
          </div>
        </div>

        <div className="hub-card space-y-4 p-5">
          <div className="space-y-1.5"><Label>الاسم الكامل</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <p className="text-xs text-muted-foreground">نوع الحساب: {isAdmin ? "👑 Admin" : "🎓 Student"}</p>
          <Button className="gradient-gold w-full font-bold" onClick={() => save.mutate()}><Save className="mr-1 size-4" /> حفظ التغييرات</Button>
          <Button variant="outline" className="w-full" onClick={() => void signOut()}><LogOut className="mr-1 size-4" /> تسجيل الخروج</Button>
        </div>

        <PhoneLogin />
        <div className="md:col-span-2"><DeviceLink /></div>
      </div>
    </AppShell>
  );
}
