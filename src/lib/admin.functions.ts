import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type StaffRole = "owner" | "admin" | "user";

/**
 * Server-side role check for every admin operation. There is no shared
 * passcode: the caller's role is read from the database each time.
 */
async function assertStaff(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .in("role", ["admin", "owner"])
    .maybeSingle();
  if (!data) throw new Error("Forbidden: admin only");
  return { admin: supabaseAdmin, role: data.role as "owner" | "admin" };
}

async function assertOwner(userId: string) {
  const staff = await assertStaff(userId);
  if (staff.role !== "owner") throw new Error("Forbidden: Owner only");
  return staff;
}

async function logAdminAction(admin: NonNullable<Awaited<ReturnType<typeof assertStaff>>["admin"]>, actor: string, action: string, details: Record<string, unknown>) {
  await admin.from("admin_audit_log").insert({ actor, action, details });
}

/** Who am I on the server (owner/admin/student) — used to gate admin UI. */
export const getMyRole = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .in("role", ["admin", "owner"])
      .maybeSingle();
    return { role: (data?.role as "owner" | "admin" | undefined) ?? null };
  });

/** Owner-only: list accounts for role management. */
export const listAccountsForRoles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ search: z.string().max(80).optional(), limit: z.number().int().min(1).max(50).default(25) }).parse(data ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { admin } = await assertOwner(context.userId);
    let query = admin
      .from("profiles")
      .select("id, full_name, email, phone, is_banned, created_at, user_roles(role)")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.search?.trim()) {
      query = query.or(`full_name.ilike.%${data.search.trim()}%,email.ilike.%${data.search.trim()}%,phone.ilike.%${data.search.trim()}%`);
    }
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return rows;
  });

/** Owner-only: grant owner/admin/student role. Server enforces last-owner safety. */
export const grantAccountRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ userId: z.string().uuid(), role: z.enum(["owner", "admin", "user"]) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { admin } = await assertOwner(context.userId);
    if (data.role === "user") {
      const { error } = await admin.from("user_roles").delete().eq("user_id", data.userId).in("role", ["admin", "owner"]);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await admin.rpc("grant_role", { _user: data.userId, _role: data.role });
      if (error) throw new Error(error.message);
    }
    await logAdminAction(admin, context.userId, "grant_account_role", { target: data.userId, role: data.role });
    return { ok: true };
  });

/** Ban or unban a student account (owner or admin). */
export const setStudentBanned = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ userId: z.string().uuid(), banned: z.boolean() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { admin } = await assertStaff(context.userId);
    if (data.userId === context.userId) throw new Error("لا يمكنك حظر حسابك");
    const { error } = await admin
      .from("profiles")
      .update({ is_banned: data.banned })
      .eq("id", data.userId);
    if (error) throw new Error(error.message);
    await admin.auth.admin.updateUserById(data.userId, {
      ban_duration: data.banned ? "876000h" : "none",
    });
    await logAdminAction(admin, context.userId, data.banned ? "ban_student" : "unban_student", { target: data.userId });
    return { ok: true };
  });

/** Permanently delete a student account and all of its data. */
export const deleteStudent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ userId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { admin } = await assertStaff(context.userId);
    if (data.userId === context.userId) throw new Error("لا يمكنك حذف حسابك");
    const { error } = await admin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    await logAdminAction(admin, context.userId, "delete_student", { target: data.userId });
    return { ok: true };
  });

/** Read section-visibility + platform settings (public read). */
export const getPlatformSettings = createServerFn({ method: "GET" }).handler(async () => {
  const { createPublicClient } = await import("@/lib/public-client");
  const client = createPublicClient();
  const [{ data: sections }, { data: settings }] = await Promise.all([
    client.from("platform_sections").select("key, is_visible"),
    client.from("platform_settings").select("key, value"),
  ]);
  return {
    sections: (sections ?? []) as { key: string; is_visible: boolean }[],
    settings: (settings ?? []) as { key: string; value: string }[],
  };
});

/** Staff-only: update a section's visibility or a platform setting. */
export const setPlatformSetting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({
      kind: z.enum(["section", "setting"]),
      key: z.string().max(40),
      value: z.boolean(),
    }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { admin } = await assertStaff(context.userId);
    if (data.kind === "section") {
      const { error } = await admin
        .from("platform_sections")
        .update({ is_visible: data.value, updated_at: new Date().toISOString() })
        .eq("key", data.key);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await admin
        .from("platform_settings")
        .upsert({ key: data.key, value: data.value ? "1" : "0", updated_at: new Date().toISOString() });
      if (error) throw new Error(error.message);
    }
    await logAdminAction(admin, context.userId, "set_platform_setting", { ...data });
    return { ok: true };
  });
