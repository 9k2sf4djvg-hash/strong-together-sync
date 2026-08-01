import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { CalendarDays, CheckCircle2, Dumbbell, Flame, Play, Trophy } from "lucide-react";
import { useStore } from "@/lib/store";
import { AppHeader } from "@/components/AppHeader";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/trainee/")({
  head: () => ({
    meta: [
      { title: "השבוע שלי — Strong Together" },
      { name: "description", content: "האימונים של השבוע הנוכחי, התקדמות אישית ומעקב RPE בפועל." },
      { property: "og:title", content: "השבוע שלי — Strong Together" },
      { property: "og:description", content: "האימונים של השבוע הנוכחי ומעקב ביצוע." },
    ],
  }),
  component: TraineeHome,
});

function TraineeHome() {
  const { state, user, hydrated } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!hydrated) return;
    if (!user) navigate({ to: "/" });
    else if (user.role !== "trainee") navigate({ to: "/coach" });
  }, [hydrated, user, navigate]);

  if (!user || user.role !== "trainee") return null;

  const block = state.blocks.find((b) => b.traineeId === user.id);
  const week = block?.weeks.find((w) => w.weekNumber === block.currentWeek && w.published);

  if (!block || !week) {
    return (
      <div className="min-h-screen text-foreground">
        <AppHeader subtitle={`מתאמן · ${user.name}`} />
        <main className="mx-auto max-w-3xl px-4 py-10">
          <div className="glass-card animate-rise rounded-2xl p-8 text-center">
            <span className="gradient-surface mx-auto mb-3 grid size-12 place-items-center rounded-2xl">
              <CalendarDays className="size-6" />
            </span>
            <p className="font-semibold">אין כרגע שבוע פעיל</p>
            <p className="mt-1 text-sm text-muted-foreground">חכה לעדכון מהמאמן — נודיע לך ברגע שהשבוע יפורסם.</p>
          </div>
        </main>
      </div>
    );
  }

  const done = week.workouts.filter((w) => w.completedAt).length;
  const total = week.workouts.length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const next = week.workouts.find((w) => !w.completedAt);
  const totalSets = week.workouts.reduce(
    (n, w) => n + w.exercises.reduce((m, e) => m + e.sets.length, 0),
    0,
  );

  return (
    <div className="min-h-screen text-foreground">
      <AppHeader subtitle={`מתאמן · ${user.name}`} />
      <main className="mx-auto max-w-3xl px-4 py-6 pb-16">
        <section className="glass-card animate-rise mb-6 overflow-hidden rounded-3xl p-5">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">בלוק "{block.name}"</p>
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                שבוע <span className="gradient-text">{week.weekNumber}</span>
              </h1>
            </div>
            <Badge className="shrink-0" variant={pct === 100 ? "default" : "secondary"}>
              {done}/{total} הושלמו
            </Badge>
          </div>
          <Progress value={pct} className="mt-4 h-2.5" />
          {next ? (
            <Button
              asChild
              className="press gradient-surface mt-4 w-full shadow-[0_0_20px_color-mix(in_oklab,var(--primary)_40%,transparent)] hover:opacity-95"
            >
              <Link to="/trainee/workout/$workoutId" params={{ workoutId: next.id }}>
                <Play className="size-4" /> המשך: {next.title}
              </Link>
            </Button>
          ) : (
            <p className="mt-4 text-sm font-semibold text-success">סיימת את כל האימונים השבוע! 🎉</p>
          )}
        </section>

        <section className="mb-6 grid grid-cols-3 gap-3">
          <StatCard icon={Flame} label="השלמה" value={`${pct}%`} trend={pct >= 50 ? "up" : "flat"} />
          <StatCard icon={Dumbbell} label="סטים השבוע" value={totalSets} delay={50} />
          <StatCard icon={Trophy} label="שבוע" value={`${week.weekNumber}/${block.totalWeeks}`} delay={100} />
        </section>

        <h2 className="mb-3 text-lg font-semibold">האימונים שלי</h2>
        <div className="space-y-3">
          {week.workouts.map((w, i) => (
            <div
              key={w.id}
              className="glass-card lift animate-rise grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl p-4"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={`grid size-10 shrink-0 place-items-center rounded-xl ${
                    w.completedAt ? "bg-success/15 text-success" : "bg-primary/15 text-primary"
                  }`}
                >
                  {w.completedAt ? <CheckCircle2 className="size-5" /> : <Dumbbell className="size-5" />}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold">
                    אימון {i + 1} · {w.title}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {w.exercises.length} תרגילים · {w.exercises.reduce((n, e) => n + e.sets.length, 0)} סטים
                  </p>
                </div>
              </div>
              <Button
                asChild
                variant={w.completedAt ? "outline" : "default"}
                size="sm"
                className="press min-h-11 shrink-0"
              >
                <Link to="/trainee/workout/$workoutId" params={{ workoutId: w.id }}>
                  {w.completedAt ? "צפה / שנה" : "התחל אימון"}
                </Link>
              </Button>
            </div>
          ))}
        </div>

        {week.workouts.every((w) => w.completedAt) && (
          <div className="glass-card mt-6 rounded-2xl border-primary/40 p-4 text-center">
            <p className="font-semibold">
              {week.reviewed ? "המאמן ראה את האימונים" : "סיימת את השבוע! ההערות נשלחו למאמן"}
            </p>
            <p className="text-sm text-muted-foreground">חכה לעדכון השבוע הבא</p>
          </div>
        )}
      </main>
    </div>
  );
}
