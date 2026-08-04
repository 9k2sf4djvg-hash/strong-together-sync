import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const codeSchema = z.object({ code: z.string().trim().min(4).max(64) });
const userSchema = z.object({ userId: z.string().uuid() });

/** Grants the caller the admin system role when they present the correct access code. */
export const claimAdminRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => codeSchema.parse(d))
  .handler(async ({ data, context }) => {
    const expected = process.env["ADMIN_ACCESS_CODE"];
    if (!expected) throw new Error("admin_code_not_configured");
    if (data.code !== expected) return { ok: false as const, error: "invalid_code" };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: context.userId, role: "admin" }, { onConflict: "user_id,role" });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

/** Admin-only: permanently deletes a user account and all of their data. */
export const adminDeleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => userSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_system_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");
    if (data.userId === context.userId) {
      return { ok: false as const, error: "cannot_delete_self" as const };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("blocks").delete().or(`coach_id.eq.${data.userId},trainee_id.eq.${data.userId}`);
    await supabaseAdmin.from("profiles").update({ coach_id: null }).eq("coach_id", data.userId);
    await supabaseAdmin.from("admin_logs").insert({
      admin_id: context.userId,
      action: "delete",
      target_user_id: data.userId,
      notes: "מחיקת חשבון",
    });
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

/** Coach-only: removes one of their own trainees and deletes that trainee's training data. */
export const coachRemoveTrainee = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => userSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: trainee, error: readErr } = await context.supabase
      .from("profiles")
      .select("id,coach_id,name")
      .eq("id", data.userId)
      .maybeSingle();
    if (readErr) throw new Error(readErr.message);
    if (!trainee || trainee.coach_id !== context.userId) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("blocks")
      .delete()
      .eq("coach_id", context.userId)
      .eq("trainee_id", data.userId);
    await supabaseAdmin.from("profiles").update({ coach_id: null }).eq("id", data.userId);
    await supabaseAdmin.from("notifications").insert({
      to_user_id: data.userId,
      from_user_id: context.userId,
      to_role: "trainee",
      text: "המאמן שלך הסיר אותך מהמערכת. כל האימונים איתו נמחקו.",
    });
    return { ok: true as const };
  });
