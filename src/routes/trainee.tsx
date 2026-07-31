import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { CheckCircle2, Dumbbell } from "lucide-react";
import { useStore } from "@/lib/store";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/trainee")({
  head: () => ({
    meta: [
      { title: "השבוע שלי — Strong Together" },
      { name: "description", content: "האימונים של השבוע הנוכחי, ביצוע ומעקב RPE בפועל." },
      { property: "og:title", content: "השבוע שלי — Strong Together" },
      { property: "og:description", content: "האימונים של השבוע הנוכחי ומעקב ביצוע." },
    ],
  }),
  component: TraineeHome,
});

function TraineeHome() {
  const { state, user } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) navigate({ to: "/" });
    else if (user.role !== "trainee") navigate({ to: "/coach" });
  }, [user, navigate]);

  if (!user || user.role !== "trainee") return null;

  const block = state.blocks.find((b) => b.traineeId === user.id);
  const week = block?.weeks.find((w) => w.weekNumber === block.currentWeek && w.published);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader subtitle={`מתאמן · ${user.name}`} />
      <main className="mx-auto max-w-3xl px-4 py-6">
        {!block || !week ? (
          <p className="text-muted-foreground">אין כרגע שבוע פעיל. חכה לעדכון מהמאמן.</p>
        ) : (
          <>
            <h1 className="text-2xl font-bold sm:text-3xl">
              שבוע {week.weekNumber} / בלוק "{block.name}"
            </h1>
            <p className="mb-6 text-sm text-muted-foreground">
              {week.workouts.filter((w) => w.completedAt).length}/{week.workouts.length} אימונים הושלמו
            </p>

            <div className="space-y-3">
              {week.workouts.map((w, i) => (
                <div
                  key={w.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-border bg-card p-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted">
                      {w.completedAt ? (
                        <CheckCircle2 className="size-5 text-success" />
                      ) : (
                        <Dumbbell className="size-5" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">
                        אימון {i + 1} - {w.title}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {w.exercises.length} תרגילים · {w.exercises.reduce((n, e) => n + e.sets.length, 0)} סטים
                      </p>
                    </div>
                  </div>
                  <Button asChild variant={w.completedAt ? "outline" : "default"} size="sm">
                    <Link to="/trainee/workout/$workoutId" params={{ workoutId: w.id }}>
                      {w.completedAt ? "צפה / שנה" : "התחל אימון"}
                    </Link>
                  </Button>
                </div>
              ))}
            </div>

            {week.workouts.every((w) => w.completedAt) && (
              <div className="mt-6 rounded-2xl border border-primary/40 bg-primary/10 p-4 text-center">
                <p className="font-semibold">
                  {week.reviewed ? "המאמן ראה את האימונים" : "סיימת את השבוע! ההערות נשלחו למאמן"}
                </p>
                <p className="text-sm text-muted-foreground">חכה לעדכון השבוע הבא</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
