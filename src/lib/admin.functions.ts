import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ADMIN_PASSCODE = "20121998";

async function assertAdmin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Forbidden: admin only");
  return supabaseAdmin;
}

/** Validate the secret admin passcode and grant the admin role to the caller. */
export const unlockAdminAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ passcode: z.string().max(64) }).parse(data))
  .handler(async ({ data, context }) => {
    if (data.passcode.trim() !== ADMIN_PASSCODE) throw new Error("كلمة السر غير صحيحة");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: context.userId, role: "admin" }, { onConflict: "user_id,role" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Ban or unban a student account. */
export const setStudentBanned = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ userId: z.string().uuid(), banned: z.boolean() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const admin = await assertAdmin(context.userId);
    if (data.userId === context.userId) throw new Error("لا يمكنك حظر حسابك");
    const { error } = await admin
      .from("profiles")
      .update({ is_banned: data.banned })
      .eq("id", data.userId);
    if (error) throw new Error(error.message);
    await admin.auth.admin.updateUserById(data.userId, {
      ban_duration: data.banned ? "876000h" : "none",
    });
    return { ok: true };
  });

/** Permanently delete a student account and all of its data. */
export const deleteStudent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ userId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const admin = await assertAdmin(context.userId);
    if (data.userId === context.userId) throw new Error("لا يمكنك حذف حسابك");
    const { error } = await admin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
