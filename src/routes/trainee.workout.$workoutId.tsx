import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import { useStore } from "@/lib/store";
import type { Workout } from "@/lib/types";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/trainee/workout/$workoutId")({
  head: () => ({
    meta: [
      { title: "ביצוע אימון — Strong Together" },
      { name: "description", content: "עדכון RPE בפועל, הערות אישיות ודילוג על סטים ותרגילים." },
      { property: "og:title", content: "ביצוע אימון — Strong Together" },
      { property: "og:description", content: "עדכון RPE בפועל והערות במהלך האימון." },
    ],
  }),
  component: PerformWorkout,
});

function PerformWorkout() {
  const { workoutId } = Route.useParams();
  const { state, user, updateBlock, notify, hydrated } = useStore();
  const navigate = useNavigate();
  const [skipTarget, setSkipTarget] = useState<{ exId: string; setId?: string } | null>(null);
  const [skipReason, setSkipReason] = useState("");

  useEffect(() => {
    if (hydrated && !user) navigate({ to: "/" });
  }, [hydrated, user, navigate]);

  const block = state.blocks.find((b) =>
    b.weeks.some((w) => w.workouts.some((x) => x.id === workoutId)),
  );
  const week = block?.weeks.find((w) => w.workouts.some((x) => x.id === workoutId));
  const workout = week?.workouts.find((x) => x.id === workoutId);

  if (!block || !week || !workout) {
    return (
      <div className="min-h-screen bg-background p-6 text-foreground">
        <p>האימון לא נמצא.</p>
        <Link to="/trainee" className="text-primary underline">
          חזרה
        </Link>
      </div>
    );
  }

  const editable =
    !workout.completedAt || Date.now() - (workout.completedAt ?? 0) < 24 * 60 * 60 * 1000;

  const current: Workout = workout;
  const patchWorkout = (fn: (w: Workout) => Workout) =>
    updateBlock(block.id, (b) => ({
      ...b,
      weeks: b.weeks.map((wk) =>
        wk.weekNumber === week.weekNumber
          ? { ...wk, workouts: wk.workouts.map((x) => (x.id === current.id ? fn(x) : x)) }
          : wk,
      ),
    }));

  const setSetField = (exId: string, setId: string, patch: Record<string, unknown>) =>
    patchWorkout((w) => ({
      ...w,
      exercises: w.exercises.map((e) =>
        e.id === exId ? { ...e, sets: e.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)) } : e,
      ),
    }));

  const confirmSkip = () => {
    if (!skipTarget) return;
    if (!skipReason.trim()) {
      toast.error("יש להסביר מדוע דילגת");
      return;
    }
    if (skipTarget.setId) {
      setSetField(skipTarget.exId, skipTarget.setId, { skipped: true, skipReason, needsUpdate: false });
    } else {
      patchWorkout((w) => ({
        ...w,
        exercises: w.exercises.map((e) =>
          e.id === skipTarget.exId
            ? {
                ...e,
                skipped: true,
                skipReason,
                sets: e.sets.map((s) => ({ ...s, skipped: true, skipReason, needsUpdate: false })),
              }
            : e,
        ),
      }));
    }
    setSkipTarget(null);
    setSkipReason("");
    toast.success("סומן כדילוג");
  };

  const allSetsHandled = workout.exercises.every((e) =>
    e.skipped ? true : e.sets.every((s) => s.skipped || s.actualRpe != null),
  );
  const totalSets = workout.exercises.reduce((n, e) => n + e.sets.length, 0);
  const doneSets = workout.exercises.reduce(
    (n, e) => n + e.sets.filter((s) => s.actualRpe != null).length,
    0,
  );

  const finish = () => {
    if (!allSetsHandled) {
      toast.error("יש לעדכן RPE בפועל או לדלג בכל הסטים");
      return;
    }
    patchWorkout((w) => ({ ...w, completedAt: Date.now() }));
    notify("coach", `${user?.name} סיים את האימון "${workout.title}" (שבוע ${week.weekNumber})`);
    const others = week.workouts.filter((w) => w.id !== workout.id);
    if (others.every((w) => w.completedAt)) {
      notify("coach", `${user?.name} סיים את שבוע ${week.weekNumber} בבלוק "${block.name}"`);
    }
    toast.success("אימון הושלם בהצלחה!");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader subtitle={`שבוע ${week.weekNumber} · ${block.name}`} />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <Link to="/trainee" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowRight className="size-4" /> חזור לשבוע
        </Link>
        <h1 className="mb-1 text-2xl font-bold sm:text-3xl">{workout.title}</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          סטים: {doneSets}/{totalSets}
        </p>

        {workout.completedAt && (
          <div className="mb-6 rounded-2xl border border-primary/40 bg-primary/10 p-4">
            <p className="font-semibold">אימון הושלם בהצלחה! ✓</p>
            <p className="text-sm text-muted-foreground">
              {editable ? "ניתן לשנות עד 24 שעות מסיום האימון." : "חלון העריכה (24 שעות) נסגר."}
            </p>
          </div>
        )}

        <div className="space-y-4">
          {workout.exercises.map((ex) => (
            <section
              key={ex.id}
              className={`rounded-2xl border border-border bg-card p-4 ${ex.skipped ? "opacity-50" : ""}`}
            >
              <div className="mb-2 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                <h2 className={`truncate text-lg font-bold ${ex.skipped ? "line-through" : ""}`}>{ex.name}</h2>
                {editable && !ex.skipped && (
                  <Button size="sm" variant="outline" onClick={() => setSkipTarget({ exId: ex.id })}>
                    דילגתי
                  </Button>
                )}
              </div>
              {ex.coachNotes && <p className="mb-3 text-sm text-warning">הערת מאמן: {ex.coachNotes}</p>}
              {ex.skipped && <p className="mb-3 text-sm text-destructive">דילוג: {ex.skipReason}</p>}

              <div className="space-y-3">
                {ex.sets.map((s, i) => (
                  <div
                    key={s.id}
                    className={`rounded-xl border border-border p-3 ${s.skipped ? "opacity-50 line-through" : ""}`}
                  >
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold">
                        סט {i + 1}: {s.reps} חזרות, {s.weight} ק"ג, RPE מטרה: {s.rpe}
                      </p>
                      {s.actualRpe != null && !s.skipped && <span className="text-success">✓</span>}
                    </div>
                    {!s.skipped && (
                      <div className="grid gap-2 sm:grid-cols-[120px_1fr_auto] sm:items-end">
                        <div className="space-y-1">
                          <Label className="text-xs">RPE בפועל</Label>
                          <Input
                            type="number"
                            min={1}
                            max={10}
                            disabled={!editable}
                            className={s.actualRpe == null ? "border-destructive" : "border-accent text-accent"}
                            value={s.actualRpe ?? ""}
                            onChange={(e) =>
                              setSetField(ex.id, s.id, {
                                actualRpe: e.target.value === "" ? null : Number(e.target.value),
                              })
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">הערות</Label>
                          <Input
                            disabled={!editable}
                            placeholder="הערה אישית"
                            value={s.note ?? ""}
                            onChange={(e) => setSetField(ex.id, s.id, { note: e.target.value })}
                          />
                        </div>
                        {editable && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSkipTarget({ exId: ex.id, setId: s.id })}
                          >
                            דילגתי
                          </Button>
                        )}
                      </div>
                    )}
                    {s.skipped && <p className="text-sm text-destructive">דילוג: {s.skipReason}</p>}
                  </div>
                ))}
              </div>
            </section>
          ))}
          {workout.exercises.length === 0 && (
            <p className="text-muted-foreground">המאמן עוד לא הוסיף תרגילים לאימון הזה.</p>
          )}
        </div>

        <div className="sticky bottom-0 mt-6 flex flex-wrap gap-2 bg-background/90 py-4 backdrop-blur">
          <Button onClick={finish} disabled={!editable || !allSetsHandled} className="flex-1 sm:flex-none">
            {workout.completedAt ? "שמור שינויים" : "סיים אימון"}
          </Button>
          <Button asChild variant="outline">
            <Link to="/trainee">חזור לשבוע</Link>
          </Button>
        </div>
      </main>

      <AlertDialog open={!!skipTarget} onOpenChange={(o) => !o && setSkipTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>לדלג?</AlertDialogTitle>
            <AlertDialogDescription>הסבר קצר מדוע דילגת — המאמן יראה את ההסבר.</AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            rows={3}
            placeholder="לדוגמה: כאב בברך"
            value={skipReason}
            onChange={(e) => setSkipReason(e.target.value)}
          />
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSkip}>אישור</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
