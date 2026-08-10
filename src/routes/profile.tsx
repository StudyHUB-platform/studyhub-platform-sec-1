import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { LogOut, Save } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "الملف الشخصي — Study HUB" },
      { name: "description", content: "حدّث بياناتك الشخصية في Study HUB وأدر حسابك." },
      { property: "og:title", content: "الملف الشخصي — Study HUB" },
      { property: "og:description", content: "إدارة حسابك وبياناتك." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    setName(profile?.full_name ?? "");
    setPhone(profile?.phone ?? "");
  }, [profile]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: name, phone })
        .eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم حفظ البيانات");
      void qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell title="👤 Profile" subtitle="بياناتك الشخصية">
      <div className="hub-card mx-auto max-w-md space-y-4 p-5">
        <div className="space-y-1.5">
          <Label>الاسم الكامل</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>رقم الهاتف</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>البريد الإلكتروني</Label>
          <Input value={user?.email ?? ""} readOnly />
        </div>
        <p className="text-xs text-muted-foreground">
          نوع الحساب: {isAdmin ? "👑 Admin" : "🎓 Student"}
        </p>
        <Button className="gradient-gold w-full font-bold" onClick={() => save.mutate()}>
          <Save className="mr-1 size-4" /> حفظ التغييرات
        </Button>
        <Button variant="outline" className="w-full" onClick={() => void signOut()}>
          <LogOut className="mr-1 size-4" /> تسجيل الخروج
        </Button>
      </div>
    </AppShell>
  );
}
