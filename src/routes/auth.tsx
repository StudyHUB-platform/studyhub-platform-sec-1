import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Mail, Phone } from "lucide-react";

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
      { name: "description", content: "أنشئ حسابك في Study HUB بالبريد أو رقم الهاتف أو Google." },
      { property: "og:title", content: "تسجيل الدخول — Study HUB" },
      { property: "og:description", content: "أنشئ حسابك في Study HUB وابدأ الدراسة." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const search = Route.useSearch();
  const [tab, setTab] = useState(search.mode === "signin" ? "signin" : "signup");
  const [busy, setBusy] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  useEffect(() => {
    if (!loading && session) void navigate({ to: "/dashboard", replace: true });
  }, [loading, session, navigate]);

  const signUp = async () => {
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin, data: { full_name: name } },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (!data.session) toast.success("تم إنشاء الحساب! راجع بريدك لتأكيد الحساب.");
  };

  const signIn = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) toast.error(error.message);
  };

  const google = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) toast.error("تعذر تسجيل الدخول بجوجل");
  };

  const sendOtp = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({ phone });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setOtpSent(true);
    toast.success("تم إرسال كود التحقق");
  };

  const verifyOtp = async () => {
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({ phone, token: otp, type: "sms" });
    setBusy(false);
    if (error) toast.error(error.message);
  };

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
              <div className="space-y-1.5">
                <Label>البريد الإلكتروني</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>كلمة المرور</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button className="gradient-gold w-full font-bold" disabled={busy} onClick={() => void signUp()}>
                <Mail className="mr-2 size-4" /> Create Account
              </Button>
            </TabsContent>

            <TabsContent value="signin" className="mt-5 space-y-3">
              <div className="space-y-1.5">
                <Label>البريد الإلكتروني</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
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

          <div className="mt-4 space-y-2 rounded-xl border border-border p-3">
            <p className="flex items-center gap-2 text-sm font-bold">
              <Phone className="size-4 text-primary" /> Phone Number
            </p>
            {!otpSent ? (
              <div className="flex gap-2">
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+201234567890"
                />
                <Button variant="secondary" disabled={busy} onClick={() => void sendOtp()}>
                  إرسال
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="كود التحقق" />
                <Button variant="secondary" disabled={busy} onClick={() => void verifyOtp()}>
                  تأكيد
                </Button>
              </div>
            )}
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          © Study HUB | Developed by Ahmed Shaaban &amp; Retaj Mohamed
        </p>
      </div>
    </div>
  );
}
