import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowRight, Activity, CheckCircle2, Layers, Users } from "lucide-react";
import { useStore } from "@/lib/store";
import { AppHeader } from "@/components/AppHeader";
import { EmptyState, ProgressBar } from "@/components/StatCard";
import { Button } from "@/components/ui/button";

const META: Record<string, { title: string; desc: string }> = {
  trainees: { title: "מתאמנים פעילים", desc: "רשימת המתאמנים והבלוקים שלהם." },
  blocks: { title: "בלוקים פעילים", desc: "כל בלוקי האימונים הפעילים." },
  workouts: { title: "אימונים השבוע", desc: "כל האימונים בשבוע הנוכחי." },
  completion: { title: "אחוז השלמה", desc: "מעקב אחר השלמת האימונים." },
};

export const Route = createFileRoute("/coach/stats/$metric")({
  head: ({ params }) => {
    const m = META[params.metric] ?? { title: "נתונים", desc: "נתוני לוח המאמן." };
    return {
      meta: [
        { title: `${m.title} — Strong Together` },
        { name: "description", content: m.desc },
        { property: "og:title", content: `${m.title} — Strong Together` },
        { property: "og:description", content: m.desc },
      ],
    };
  },
  component: CoachStats,
});

function CoachStats() {
  const { metric } = Route.useParams();
  const { state, user, hydrated } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!hydrated) return;
    if (!user) navigate({ to: "/" });
    else if (user.role !== "coach") navigate({ to: "/trainee" });
  }, [hydrated, user, navigate]);

  if (!user || user.role !== "coach") return null;

  const trainees = state.users.filter((u) => u.role === "trainee");
  const allWorkouts = state.blocks.flatMap((b) =>
    b.weeks
      .filter((w) => w.weekNumber === b.currentWeek)
      .flatMap((w) => w.workouts.map((wo) => ({ workout: wo, block: b, week: w }))),
  );
  const completed = allWorkouts.filter((x) => x.workout.completedAt);
  const rate = allWorkouts.length ? Math.round((completed.length / allWorkouts.length) * 100) : 0;
  const meta = META[metric] ?? { title: "נתונים", desc: "" };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader subtitle={`מאמן · ${user.name}`} />
      <main className="mx-auto max-w-3xl px-4 py-6 pb-16">
        <Button asChild variant="ghost" className="mb-3 -mr-2">
          <Link to="/coach">
            <ArrowRight className="size-4" /> חזרה ללוח המאמן
          </Link>
        </Button>
        <h1 className="text-2xl font-extrabold sm:text-3xl">{meta.title}</h1>
        <p className="mb-5 text-sm text-muted-foreground">{meta.desc}</p>

        {metric === "completion" && allWorkouts.length > 0 && (
          <div className="glass-card mb-5 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {completed.length} מתוך {allWorkouts.length} אימונים הושלמו
              </span>
              <span className="text-2xl font-extrabold">{rate}%</span>
            </div>
            <ProgressBar value={rate} className="mt-3" />
          </div>
        )}

        <div className="space-y-3">
          {metric === "trainees" &&
            trainees.map((t) => {
              const b = state.blocks.find((x) => x.traineeId === t.id);
              return (
                <div key={t.id} className="glass-card animate-fade-up rounded-2xl p-4">
                  <p className="font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.email}</p>
                  {b ? (
                    <Link
                      to="/coach/block/$blockId"
                      params={{ blockId: b.id }}
                      className="mt-2 inline-block text-sm text-primary"
                    >
                      פתח בלוק "{b.name}" (שבוע {b.currentWeek}/{b.totalWeeks})
                    </Link>
                  ) : (
                    <p className="mt-1 text-sm text-muted-foreground">אין בלוק פעיל</p>
                  )}
                </div>
              );
            })}

          {metric === "blocks" &&
            state.blocks.map((b) => (
              <Link
                key={b.id}
                to="/coach/block/$blockId"
                params={{ blockId: b.id }}
                className="glass-card lift animate-fade-up block rounded-2xl p-4"
              >
                <p className="font-semibold">{b.name}</p>
                <p className="text-xs text-muted-foreground">
                  {state.users.find((u) => u.id === b.traineeId)?.name} · שבוע {b.currentWeek}/
                  {b.totalWeeks} · {b.workoutsPerWeek} אימונים בשבוע
                </p>
                <ProgressBar value={(b.currentWeek / Math.max(1, b.totalWeeks)) * 100} className="mt-3" />
              </Link>
            ))}

          {(metric === "workouts" || metric === "completion") &&
            allWorkouts.map(({ workout, block, week }) => (
              <Link
                key={workout.id}
                to="/coach/block/$blockId"
                params={{ blockId: block.id }}
                className="glass-card lift animate-fade-up block rounded-2xl p-4"
              >
                <p className="font-semibold">{workout.title}</p>
                <p className="text-xs text-muted-foreground">
                  {block.name} · שבוע {week.weekNumber} · {workout.exercises.length} תרגילים ·{" "}
                  {workout.completedAt ? "הושלם" : "טרם הושלם"}
                </p>
              </Link>
            ))}

          {((metric === "trainees" && trainees.length === 0) ||
            (metric === "blocks" && state.blocks.length === 0) ||
            ((metric === "workouts" || metric === "completion") && allWorkouts.length === 0)) && (
            <EmptyState
              icon={
                metric === "trainees"
                  ? Users
                  : metric === "blocks"
                    ? Layers
                    : metric === "workouts"
                      ? Activity
                      : CheckCircle2
              }
              title="אין נתונים להצגה"
              description="ברגע שיהיו נתונים רלוונטיים הם יופיעו כאן."
            />
          )}
        </div>
      </main>
    </div>
  );
}
