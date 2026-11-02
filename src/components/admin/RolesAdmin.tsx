import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Ban, Crown, Search, ShieldCheck, UserRound } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import {
  getPlatformSettings,
  grantAccountRole,
  listAccountsForRoles,
  setPlatformSetting,
  setStudentBanned,
} from "@/lib/admin.functions";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

type AccountRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  is_banned: boolean;
  created_at: string;
  user_roles: { role: string }[] | null;
};

const roleLabel: Record<string, string> = {
  owner: "👑 Owner",
  admin: "🛡️ Admin",
  user: "🎓 Student",
};

/** Owner-only role management: Owner / Admin / Student. */
export function RolesAdmin() {
  const { isOwner, userId: myId } = useMyIdentity();
  const qc = useQueryClient();
  const grant = useServerFn(grantAccountRole);
  const ban = useServerFn(setStudentBanned);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const { data, refetch, isFetching } = useQuery({
    queryKey: ["admin", "accounts", search],
    enabled: isOwner,
    queryFn: () => listAccountsForRoles({ data: { search, limit: 30 } }),
  });

  const rows = useMemo(() => (data ?? []) as AccountRow[], [data]);

  if (!isOwner) {
    return (
      <p className="text-sm text-muted-foreground">
        إدارة الأدوار متاحة للمالك (Owner) فقط.
      </p>
    );
  }

  const applyRole = async (userId: string, role: "owner" | "admin" | "user") => {
    setBusy(userId);
    try {
      await grant({ data: { userId, role } });
      toast.success("تم تحديث الدور");
      await qc.invalidateQueries({ queryKey: ["admin"] });
      refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل تحديث الدور");
    } finally {
      setBusy(null);
    }
  };

  const toggleBan = async (userId: string, banned: boolean) => {
    setBusy(userId);
    try {
      await ban({ data: { userId, banned } });
      toast.success(banned ? "تم الحظر" : "تم رفع الحظر");
      refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل التحديث");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute top-2.5 right-2 size-4 text-muted-foreground" />
          <Input
            placeholder="بحث بالاسم أو الإيميل أو الهاتف"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-8"
          />
        </div>
        <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
          تحديث
        </Button>
      </div>

      <div className="space-y-2">
        {rows.map((row) => {
          const role = row.user_roles?.some((r) => r.role === "owner")
            ? "owner"
            : row.user_roles?.some((r) => r.role === "admin")
              ? "admin"
              : "user";
          return (
            <div key={row.id} className="hub-card flex flex-wrap items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{row.full_name ?? "بدون اسم"}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {row.email ?? row.phone ?? "—"} · {new Date(row.created_at).toLocaleDateString()}
                </p>
              </div>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-bold",
                  role === "owner" && "bg-primary text-primary-foreground",
                  role === "admin" && "bg-secondary text-secondary-foreground",
                  role === "user" && "bg-muted text-muted-foreground",
                )}
              >
                {roleLabel[role]}
              </span>
              <div className="flex flex-wrap gap-1">
                <Button
                  size="sm"
                  variant={role === "owner" ? "default" : "outline"}
                  disabled={busy === row.id}
                  onClick={() => void applyRole(row.id, "owner")}
                  title="Owner"
                >
                  <Crown className="size-4" />
                </Button>
                <Button
                  size="sm"
                  variant={role === "admin" ? "default" : "outline"}
                  disabled={busy === row.id}
                  onClick={() => void applyRole(row.id, "admin")}
                  title="Admin"
                >
                  <ShieldCheck className="size-4" />
                </Button>
                <Button
                  size="sm"
                  variant={role === "user" ? "default" : "outline"}
                  disabled={busy === row.id}
                  onClick={() => void applyRole(row.id, "user")}
                  title="Student"
                >
                  <UserRound className="size-4" />
                </Button>
                <Button
                  size="sm"
                  variant={row.is_banned ? "secondary" : "outline"}
                  disabled={busy === row.id || row.id === myId}
                  onClick={() => void toggleBan(row.id, !row.is_banned)}
                  title={row.is_banned ? "رفع الحظر" : "حظر"}
                >
                  <Ban className="size-4" />
                </Button>
              </div>
            </div>
          );
        })}
        {!rows.length && !isFetching && (
          <p className="text-sm text-muted-foreground">لا نتائج.</p>
        )}
      </div>
    </div>
  );
}

function useMyIdentity() {
  const { isOwner, session } = useAuth();
  return { isOwner, userId: session?.user?.id ?? null };
}

/** Staff-only: show/hide every platform section + the Developers footer. */
export function PlatformSettingsAdmin() {
  const qc = useQueryClient();
  const save = useServerFn(setPlatformSetting);
  const { data } = useQuery({
    queryKey: ["platform", "settings"],
    queryFn: () => getPlatformSettings(),
  });

  const sections = data?.sections ?? [];
  const devFooter = data?.settings.find((s) => s.key === "developers_footer")?.value !== "0";

  const sectionLabels: Record<string, string> = {
    library: "📚 Study HUB Library",
    videos: "🎬 Videos",
    ai: "🤖 Study HUB AI",
    exams: "📝 Exams",
    flashcards: "🃏 Flash Cards",
    focus: "⏱️ Study Focus",
    todo: "🗺️ To-Do Map",
    notes: "📓 Notes",
    translator: "🌍 Translator",
    teachers: "👨‍🏫 Best Teachers",
    calculator: "🧮 Calculator",
    community: "👥 Community",
    statistics: "📊 Statistics",
    updates: "📰 Latest Updates",
    champions: "🏆 Champions League",
    academy: "🎓 Study HUB Academy",
    battles: "⚔️ Battles",
    support: "🆘 Support",
    honor: "👑 Top 10",
  };

  const toggle = async (kind: "section" | "setting", key: string, value: boolean) => {
    // Optimistic: flip in cache immediately, revert on failure.
    qc.setQueryData(["platform", "settings"], (old: Awaited<ReturnType<typeof getPlatformSettings>> | undefined) => {
      if (!old) return old;
      if (kind === "section") {
        return {
          ...old,
          sections: old.sections.map((s) => (s.key === key ? { ...s, is_visible: value } : s)),
        };
      }
      return {
        ...old,
        settings: old.settings.map((s) => (s.key === key ? { ...s, value: value ? "1" : "0" } : s)),
      };
    });
    try {
      await save({ data: { kind, key, value } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل الحفظ");
      qc.invalidateQueries({ queryKey: ["platform", "settings"] });
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        إخفاء قسم يزيله من تنقّل الطلاب ويمنع الوصول إليه دون حذف بياناته. الإعدادات تُطبَّق على كل الصفحات.
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {sections.map((s) => (
          <label key={s.key} className="hub-card flex items-center justify-between gap-3 p-3">
            <span className="truncate text-sm font-semibold">{sectionLabels[s.key] ?? s.key}</span>
            <Switch
              checked={s.is_visible}
              onCheckedChange={(v) => void toggle("section", s.key, v)}
            />
          </label>
        ))}
      </div>
      <label className="hub-card flex items-center justify-between gap-3 p-3">
        <span className="text-sm font-semibold">©️ تذييل Developers أسفل الصفحات</span>
        <Switch checked={devFooter} onCheckedChange={(v) => void toggle("setting", "developers_footer", v)} />
      </label>
    </div>
  );
}

/** Audit trail for admin actions (staff read). */
export function AuditLogAdmin() {
  const { data } = useQuery({
    queryKey: ["admin", "audit"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_audit_log")
        .select("id, actor, action, details, created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });
  if (!data?.length) return <p className="text-sm text-muted-foreground">لا سجلات بعد.</p>;
  return (
    <div className="space-y-1">
      {data.map((row) => (
        <div key={row.id} className="hub-card flex items-center justify-between gap-3 p-2 text-xs">
          <span className="font-bold">{row.action}</span>
          <span className="truncate text-muted-foreground">{JSON.stringify(row.details)}</span>
          <span className="shrink-0 text-muted-foreground">
            {new Date(row.created_at).toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}
