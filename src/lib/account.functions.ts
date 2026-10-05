import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const phoneRe = /^01[0125]\d{8}$/;
const phoneSchema = z.string().regex(phoneRe, "رقم الهاتف يجب أن يكون 11 رقم صحيح يبدأ بـ 010 أو 011 أو 012 أو 015");

export const phoneAvailable = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ phone: phoneSchema }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin.from("phone_logins").select("phone").eq("phone", data.phone).maybeSingle();
    return { available: !row };
  });

export const signInWithPhone = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ phone: z.string().regex(/^\d{11}$/), password: z.string().min(1).max(200) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let email = `${data.phone}@studyhub.app`;
    const { data: row } = await supabaseAdmin.from("phone_logins").select("user_id").eq("phone", data.phone).maybeSingle();
    if (row) {
      const { data: u } = await supabaseAdmin.auth.admin.getUserById(row.user_id);
      if (u.user?.email) email = u.user.email;
    }
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["SUPABASE_ANON_KEY"]!;
    const pub = createClient(process.env["SUPABASE_URL"]!, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: s, error } = await pub.auth.signInWithPassword({ email, password: data.password });
    if (error || !s.session) return { ok: false as const };
    return { ok: true as const, access_token: s.session.access_token, refresh_token: s.session.refresh_token };
  });

export const setPhoneLogin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ phone: phoneSchema, password: z.string().min(6, "كلمة المرور 6 أحرف على الأقل").max(72) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin.from("phone_logins").select("user_id").eq("phone", data.phone).maybeSingle();
    if (row && row.user_id !== context.userId) return { ok: false, error: "رقم الهاتف مسجّل لحساب آخر" };
    const { error: e1 } = await supabaseAdmin.auth.admin.updateUserById(context.userId, { password: data.password });
    if (e1) return { ok: false, error: e1.message };
    await supabaseAdmin.from("phone_logins").delete().eq("user_id", context.userId);
    const { error: e2 } = await supabaseAdmin.from("phone_logins").insert({ phone: data.phone, user_id: context.userId });
    if (e2) return { ok: false, error: "رقم الهاتف مسجّل لحساب آخر" };
    await supabaseAdmin.from("profiles").update({ phone: data.phone }).eq("id", context.userId);
    return { ok: true, error: null };
  });

export const redeemDeviceLink = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: z.string().regex(/^[0-9a-f]{64}$/) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const hash = createHash("sha256").update(data.token).digest("hex");
    const { data: row } = await supabaseAdmin
      .from("device_link_tokens")
      .update({ used_at: new Date().toISOString() })
      .eq("token_hash", hash)
      .is("used_at", null)
      .gt("expires_at", new Date().toISOString())
      .select("user_id")
      .maybeSingle();
    if (!row) return { ok: false as const, error: "رمز الربط غير صالح أو منتهي — أنشئ رمزاً جديداً" };
    const { data: u } = await supabaseAdmin.auth.admin.getUserById(row.user_id);
    if (!u.user?.email) return { ok: false as const, error: "تعذّر ربط الحساب" };
    const { data: link, error } = await supabaseAdmin.auth.admin.generateLink({ type: "magiclink", email: u.user.email });
    if (error || !link.properties?.hashed_token) return { ok: false as const, error: "تعذّر ربط الحساب" };
    return { ok: true as const, token_hash: link.properties.hashed_token };
  });
