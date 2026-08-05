import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/** Creates (or reuses) the shared demo coach + trainee accounts and returns login credentials. */
export const startDemo = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ role: z.enum(["coach", "trainee"]) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const {
      DEMO_PASSWORD,
      DEMO_COACH_EMAIL,
      DEMO_TRAINEE_EMAIL,
      demoWeeks,
    } = await import("./demo.server");

    const ensureUser = async (email: string, name: string, role: "coach" | "trainee") => {
      const created = await supabaseAdmin.auth.admin.createUser({
        email,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: { name, role },
      });
      if (created.data.user) return created.data.user.id;
      const { data: existing } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("email", email)
        .maybeSingle();
      if (existing?.id) {
        await supabaseAdmin.auth.admin.updateUserById(existing.id, {
          password: DEMO_PASSWORD,
          email_confirm: true,
        });
        return existing.id;
      }
      throw new Error(created.error?.message ?? "demo_user_failed");
    };

    const coachId = await ensureUser(DEMO_COACH_EMAIL, "דני המאמן (דמו)", "coach");
    const traineeId = await ensureUser(DEMO_TRAINEE_EMAIL, "רון המתאמן (דמו)", "trainee");

    await supabaseAdmin
      .from("profiles")
      .update({ role: "coach", name: "דני המאמן (דמו)", coach_id: null })
      .eq("id", coachId);
    await supabaseAdmin
      .from("profiles")
      .update({ role: "trainee", name: "רון המתאמן (דמו)", coach_id: coachId })
      .eq("id", traineeId);

    const { data: app } = await supabaseAdmin
      .from("coach_applications")
      .select("id")
      .eq("user_id", coachId)
      .maybeSingle();
    if (app?.id) {
      await supabaseAdmin
        .from("coach_applications")
        .update({ status: "approved", reviewed_at: new Date().toISOString() })
        .eq("id", app.id);
    } else {
      await supabaseAdmin.from("coach_applications").insert({
        user_id: coachId,
        full_name: "דני המאמן (דמו)",
        email: DEMO_COACH_EMAIL,
        specialty: "כוח ופאוורליפטינג",
        years_experience: 8,
        bio: "חשבון דמו להתנסות במערכת.",
        status: "approved",
        reviewed_at: new Date().toISOString(),
      });
    }

    const { data: blocks } = await supabaseAdmin
      .from("blocks")
      .select("id")
      .eq("coach_id", coachId)
      .eq("trainee_id", traineeId);
    if (!blocks || blocks.length === 0) {
      await supabaseAdmin.from("blocks").insert({
        coach_id: coachId,
        trainee_id: traineeId,
        name: "בלוק דמו — כוח בסיסי",
        total_weeks: 4,
        workouts_per_week: 3,
        current_week: 1,
        weeks: demoWeeks() as unknown as never,
      });
    }

    return {
      email: data.role === "coach" ? DEMO_COACH_EMAIL : DEMO_TRAINEE_EMAIL,
      password: DEMO_PASSWORD,
    };
  });
