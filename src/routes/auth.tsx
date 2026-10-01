import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Phone, UserPlus } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";
import { StudyHubLogo } from "@/components/StudyHubLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  validateSearch: z.object({ mode: z.enum(["signup", "signin"]).optional() }),
  head: () => ({
    meta: [
      { title: "تسجيل الدخول — Study HUB" },
      { name: "description", content: "أنشئ حسابك في Study HUB برقم الهاتف والاسم وكلمة المرور." },
      { property: "og:title", content: "تسجيل الدخول — Study HUB" },
      { property: "og:description", content: "أنشئ حسابك في Study HUB وابدأ الدراسة." },
    ],
  }),
  component: AuthPage,
});

/* رقم الهاتف هو هوية الحساب — نحوّله لبريد داخلي ثابت للمصادقة. */
const PHONE_DOMAIN = "studyhub.app";
const normalizePhone = (value: string) => value.replace(/\D/g, "");
const phoneToEmail = (value: string) => `${normalizePhone(value)}@${PHONE_DOMAIN}`;
const phoneSchema = z
  .string()
  .transform(normalizePhone)
  .refine((v) => /^\d{11}$/.test(v), { message: "رقم الهاتف يجب أن يكون 11 رقم بالظبط" });

function AuthPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const search = Route.useSearch();
  const [tab, setTab] = useState(search.mode === "signin" ? "signin" : "signup");
  const [busy, setBusy] = useState(false);

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (!loading && session) void navigate({ to: "/dashboard", replace: true });
  }, [loading, session, navigate]);

  const signUp = async () => {
    const parsed = phoneSchema.safeParse(phone);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]!.message);
      return;
    }
    if (name.trim().length < 2) {
      toast.error("اكتب اسمك الكامل");
      return;
    }
    if (password.length < 6) {
      toast.error("كلمة المرور لازم تكون 6 أحرف على الأقل");
      return;
    }
    setBusy(true);
    const digits = parsed.data;
    const { data, error } = await supabase.auth.signUp({
      email: phoneToEmail(digits),
      password,
      options: { data: { full_name: name.trim(), phone: digits } },
    });
    setBusy(false);
    if (error) {
      const msg = error.message.toLowerCase();
      toast.error(
        msg.includes("already") || msg.includes("registered") || msg.includes("exists")
          ? "رقم الهاتف مسجّل بالفعل — سجّل الدخول بدل إنشاء حساب جديد"
          : error.message,
      );
      return;
    }
    /* الحساب موجود مسبقًا: Supabase يرجع يوزر بدون identities */
    if (data.user && (data.user.identities?.length ?? 0) === 0) {
      toast.error("رقم الهاتف مسجّل بالفعل — سجّل الدخول بدل إنشاء حساب جديد");
      return;
    }
    if (!data.session) toast.success("تم إنشاء الحساب! سجّل الدخول برقم هاتفك.");
    else toast.success("تم إنشاء الحساب بنجاح 🎉");
  };

  const signIn = async () => {
    const parsed = phoneSchema.safeParse(phone);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]!.message);
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: phoneToEmail(parsed.data),
      password,
    });
    setBusy(false);
    if (error) toast.error("رقم الهاتف أو كلمة المرور غير صحيحة");
  };

  const google = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) toast.error("تعذر تسجيل الدخول بجوجل");
  };

  const phoneField = (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5">
        <Phone className="size-3.5 text-primary" /> رقم الهاتف (11 رقم)
      </Label>
      <Input
        type="tel"
        inputMode="numeric"
        maxLength={11}
        dir="ltr"
        value={phone}
        onChange={(e) => setPhone(normalizePhone(e.target.value).slice(0, 11))}
        placeholder="01xxxxxxxxx"
      />
    </div>
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <StudyHubLogo secretAccess />
        </div>
        <div className="hub-card p-6">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signup">🚀 حساب جديد</TabsTrigger>
              <TabsTrigger value="signin">تسجيل الدخول</TabsTrigger>
            </TabsList>

            <TabsContent value="signup" className="mt-5 space-y-3">
              <div className="space-y-1.5">
                <Label>الاسم</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="اسمك الكامل" />
              </div>
              {phoneField}
              <div className="space-y-1.5">
                <Label>كلمة المرور</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button className="gradient-gold w-full font-bold" disabled={busy} onClick={() => void signUp()}>
                <UserPlus className="mr-2 size-4" /> إنشاء الحساب
              </Button>
              <p className="text-center text-[11px] text-muted-foreground">
                كل رقم هاتف يُسجّل مرة واحدة فقط.
              </p>
            </TabsContent>

            <TabsContent value="signin" className="mt-5 space-y-3">
              {phoneField}
              <div className="space-y-1.5">
                <Label>كلمة المرور</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button className="gradient-gold w-full font-bold" disabled={busy} onClick={() => void signIn()}>
                تسجيل الدخول
              </Button>
            </TabsContent>
          </Tabs>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> أو <span className="h-px flex-1 bg-border" />
          </div>

          <Button variant="outline" className="w-full font-semibold" onClick={() => void google()}>
            Continue with Google
          </Button>
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          © Study HUB | Developed by Ahmed Shaaban &amp; Retaj Mohamed
        </p>
      </div>
    </div>
  );
}
