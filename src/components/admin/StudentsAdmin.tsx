import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Ban, CheckCircle2, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { deleteStudent, setStudentBanned } from "@/lib/admin.functions";
import { Section } from "./AdminSections";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export function StudentsAdmin() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const banFn = useServerFn(setStudentBanned);
  const deleteFn = useServerFn(deleteStudent);

  const { data: students, isLoading } = useQuery({
    queryKey: ["admin-students"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, created_at, is_banned")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const invalidate = () => void qc.invalidateQueries({ queryKey: ["admin-students"] });

  const ban = useMutation({
    mutationFn: (v: { userId: string; banned: boolean }) => banFn({ data: v }),
    onSuccess: (_d, v) => {
      toast.success(v.banned ? "تم حظر الحساب" : "تم إلغاء الحظر");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (userId: string) => deleteFn({ data: { userId } }),
    onSuccess: () => {
      toast.success("تم حذف الحساب");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const q = search.trim().toLowerCase();
  const rows = (students ?? []).filter(
    (s) =>
      !q ||
      (s.full_name ?? "").toLowerCase().includes(q) ||
      (s.email ?? "").toLowerCase().includes(q) ||
      (s.phone ?? "").toLowerCase().includes(q),
  );

  return (
    <Section title={`👥 Registered Students — الطلاب المسجلون (${students?.length ?? 0})`}>
      <div className="relative">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث بالاسم أو البريد أو رقم الهاتف…"
          className="pl-9"
        />
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">جاري التحميل…</p>}
      {!isLoading && !rows.length && (
        <p className="text-sm text-muted-foreground">لا يوجد طلاب مسجلون بعد.</p>
      )}

      <div className="space-y-2">
        {rows.map((s) => (
          <div key={s.id} className="rounded-xl border border-border p-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="min-w-0 flex-1 truncate text-sm font-bold">
                👤 {s.full_name ?? "بدون اسم"}
              </p>
              {s.is_banned ? (
                <Badge variant="destructive">🚫 محظور</Badge>
              ) : (
                <Badge variant="secondary">✅ نشط</Badge>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">📧 {s.email ?? "—"}</p>
            <p className="text-xs text-muted-foreground">📱 {s.phone ?? "—"}</p>
            <p className="text-xs text-muted-foreground">
              📅 {new Date(s.created_at).toLocaleDateString("ar-EG")}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {s.is_banned ? (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={ban.isPending}
                  onClick={() => ban.mutate({ userId: s.id, banned: false })}
                >
                  <CheckCircle2 className="mr-1 size-3.5" /> إلغاء الحظر
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={ban.isPending}
                  onClick={() => ban.mutate({ userId: s.id, banned: true })}
                >
                  <Ban className="mr-1 size-3.5" /> حظر الحساب
                </Button>
              )}
              <Button
                size="sm"
                variant="destructive"
                disabled={remove.isPending}
                onClick={() => {
                  if (confirm(`حذف حساب ${s.full_name ?? s.email ?? ""} نهائياً؟`))
                    remove.mutate(s.id);
                }}
              >
                <Trash2 className="mr-1 size-3.5" /> حذف
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
