import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowRight, Check, Copy, Plus, Send, Trash2 } from "lucide-react";
import { emptyExercise, newSet, uid, useStore } from "@/lib/store";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EXERCISE_LIBRARY, WORKOUT_TITLES } from "@/lib/types";
import type { Week, Workout } from "@/lib/types";

export const Route = createFileRoute("/coach/block/$blockId")({
  head: () => ({
    meta: [
      { title: "עריכת בלוק אימונים — Strong Together" },
      { name: "description", content: "בניית אימונים, תרגילים וסטים, שכפול שבועות ושליחה למתאמן." },
      { property: "og:title", content: "עריכת בלוק אימונים — Strong Together" },
      { property: "og:description", content: "בניית אימונים ושכפול שבועות עבור המתאמן." },
    ],
  }),
  component: BlockPage,
});

function BlockPage() {
  const { blockId } = Route.useParams();
  const { state, user, updateBlock, notify, hydrated } = useStore();
  const navigate = useNavigate();
  const [editing, setEditing] = useState<{ week: number; workoutId: string } | null>(null);

  useEffect(() => {
    if (hydrated && !user) navigate({ to: "/" });
  }, [hydrated, user, navigate]);

  const block = state.blocks.find((b) => b.id === blockId);
  const trainee = state.users.find((u) => u.id === block?.traineeId);

  const editingWorkout = useMemo(() => {
    if (!block || !editing) return null;
    return block.weeks.find((w) => w.weekNumber === editing.week)?.workouts.find((w) => w.id === editing.workoutId) ?? null;
  }, [block, editing]);

  if (!hydrated) return <div className="min-h-screen bg-background" />;

  if (!block) {
    return (
      <div className="min-h-screen bg-background p-6 text-foreground">
        <p>הבלוק לא נמצא.</p>
        <Link to="/coach" className="text-primary underline">
          חזרה
        </Link>
      </div>
    );
  }

  const duplicateWeek = (week: Week) => {
    if (block.weeks.length >= block.totalWeeks) {
      toast.error("הגעת למספר השבועות של הבלוק");
      return;
    }
    const copy: Week = {
      weekNumber: block.weeks.length + 1,
      published: false,
      workouts: week.workouts.map((w) => ({
        ...w,
        id: uid(),
        completedAt: null,
        exercises: w.exercises.map((e) => ({
          ...e,
          id: uid(),
          skipped: false,
          skipReason: "",
          sets: e.sets.map((s) => ({
            ...s,
            id: uid(),
            actualRpe: null,
            note: "",
            skipped: false,
            skipReason: "",
            needsUpdate: true,
          })),
        })),
      })),
    };
    updateBlock(block.id, (b) => ({ ...b, weeks: [...b.weeks, copy] }));
    toast.success(`שבוע ${copy.weekNumber} שוכפל — עדכן את השדות המסומנים באדום`);
  };

  const publishWeek = (week: Week) => {
    updateBlock(block.id, (b) => ({
      ...b,
      currentWeek: week.weekNumber,
      weeks: b.weeks.map((w) => (w.weekNumber === week.weekNumber ? { ...w, published: true } : w)),
    }));
    notify("trainee", `שבוע ${week.weekNumber} בבלוק "${block.name}" נשלח אליך`);
    toast.success(`שבוע ${week.weekNumber} נשלח ל${trainee?.name ?? "מתאמן"}`);
  };

  const markReviewed = (week: Week) => {
    updateBlock(block.id, (b) => ({
      ...b,
      weeks: b.weeks.map((w) => (w.weekNumber === week.weekNumber ? { ...w, reviewed: true } : w)),
    }));
    notify("trainee", `המאמן סקר את שבוע ${week.weekNumber}`);
    toast.success("סומן כנסקר");
  };

  const saveWorkout = (weekNumber: number, workout: Workout) => {
    updateBlock(block.id, (b) => ({
      ...b,
      weeks: b.weeks.map((w) =>
        w.weekNumber === weekNumber
          ? { ...w, workouts: w.workouts.map((x) => (x.id === workout.id ? workout : x)) }
          : w,
      ),
    }));
    setEditing(null);
    toast.success("האימון נשמר");
  };

  const addWorkout = (weekNumber: number) => {
    updateBlock(block.id, (b) => ({
      ...b,
      weeks: b.weeks.map((w) =>
        w.weekNumber === weekNumber
          ? {
              ...w,
              workouts: [...w.workouts, { id: uid(), title: `אימון ${w.workouts.length + 1}`, exercises: [] }],
            }
          : w,
      ),
    }));
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader subtitle={`בלוק: ${block.name} · ${trainee?.name ?? ""}`} />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Link to="/coach" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowRight className="size-4" /> חזרה לרשימת המתאמנים
        </Link>
        <h1 className="mb-1 text-2xl font-bold sm:text-3xl">{block.name}</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          {block.totalWeeks} שבועות · {block.workoutsPerWeek} אימונים בשבוע · שבוע נוכחי {block.currentWeek}
        </p>

        <div className="space-y-4">
          {block.weeks.map((week) => {
            const needsUpdate = week.workouts.some((w) =>
              w.exercises.some((e) => e.sets.some((s) => s.needsUpdate)),
            );
            const allDone = week.workouts.length > 0 && week.workouts.every((w) => w.completedAt);
            return (
              <section key={week.weekNumber} className="rounded-2xl border border-border bg-card p-4">
                <div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                  <h2 className="truncate text-lg font-bold">
                    שבוע {week.weekNumber}{" "}
                    {allDone && <span className="text-success">✓ הושלם</span>}
                  </h2>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {!week.published && (
                      <Button size="sm" onClick={() => publishWeek(week)}>
                        <Send className="size-4" /> שלח למתאמן
                      </Button>
                    )}
                    {allDone && !week.reviewed && (
                      <Button size="sm" variant="secondary" onClick={() => markReviewed(week)}>
                        <Check className="size-4" /> סיימתי לסקור
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => duplicateWeek(week)}>
                      <Copy className="size-4" /> הכפל שבוע
                    </Button>
                  </div>
                </div>
                {needsUpdate && (
                  <p className="mb-3 text-sm text-destructive">שדות אדומים = חובה עדכון לפני שליחה</p>
                )}
                <div className="grid gap-3 md:grid-cols-2">
                  {week.workouts.map((w) => (
                    <button
                      key={w.id}
                      onClick={() => setEditing({ week: week.weekNumber, workoutId: w.id })}
                      className="rounded-xl border border-border bg-background p-3 text-start transition-colors hover:border-primary"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate font-semibold">{w.title}</span>
                        {w.completedAt ? (
                          <Badge className="bg-success text-primary-foreground">בוצע</Badge>
                        ) : w.exercises.some((e) => e.sets.some((s) => s.needsUpdate)) ? (
                          <Badge variant="destructive">משקל 🔴</Badge>
                        ) : null}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {w.exercises.length} תרגילים ·{" "}
                        {w.exercises.reduce((n, e) => n + e.sets.length, 0)} סטים
                      </p>
                      {w.exercises.some((e) => e.sets.some((s) => s.actualRpe != null || s.note || s.skipped)) && (
                        <p className="mt-1 text-xs text-warning">יש עדכוני מתאמן לצפייה</p>
                      )}
                    </button>
                  ))}
                  <Button variant="outline" onClick={() => addWorkout(week.weekNumber)}>
                    <Plus className="size-4" /> הוסף אימון
                  </Button>
                </div>
              </section>
            );
          })}
        </div>
      </main>

      {editing && editingWorkout && (
        <WorkoutEditor
          key={editingWorkout.id}
          workout={editingWorkout}
          onClose={() => setEditing(null)}
          onSave={(w) => saveWorkout(editing.week, w)}
        />
      )}
    </div>
  );
}

function WorkoutEditor({
  workout,
  onClose,
  onSave,
}: {
  workout: Workout;
  onClose: () => void;
  onSave: (w: Workout) => void;
}) {
  const [draft, setDraft] = useState<Workout>(workout);
  const [custom, setCustom] = useState(!WORKOUT_TITLES.includes(workout.title));
  const [newExercise, setNewExercise] = useState("");

  const update = (fn: (w: Workout) => Workout) => setDraft((d) => fn(d));

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>בניית אימון</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>כותרת אימון</Label>
            <Select
              value={custom ? "custom" : draft.title}
              onValueChange={(v) => {
                if (v === "custom") setCustom(true);
                else {
                  setCustom(false);
                  update((w) => ({ ...w, title: v }));
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="בחר כותרת" />
              </SelectTrigger>
              <SelectContent>
                {WORKOUT_TITLES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
                <SelectItem value="custom">כתיבה חופשית</SelectItem>
              </SelectContent>
            </Select>
            {custom && (
              <Input
                value={draft.title}
                placeholder="כותרת חופשית"
                onChange={(e) => update((w) => ({ ...w, title: e.target.value }))}
              />
            )}
          </div>

          {draft.exercises.map((ex, exIdx) => (
            <div key={ex.id} className={`rounded-xl border border-border p-3 ${ex.skipped ? "opacity-50" : ""}`}>
              <div className="mb-2 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                <p className={`truncate font-semibold ${ex.skipped ? "line-through" : ""}`}>
                  תרגיל {exIdx + 1}: {ex.name}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="מחק תרגיל"
                  onClick={() => update((w) => ({ ...w, exercises: w.exercises.filter((e) => e.id !== ex.id) }))}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
              {ex.skipReason && <p className="mb-2 text-xs text-warning">המתאמן דילג: {ex.skipReason}</p>}

              <div className="space-y-2">
                {ex.sets.map((s, i) => (
                  <div key={s.id} className="grid grid-cols-3 gap-2 sm:grid-cols-[auto_1fr_1fr_1fr_auto] sm:items-end">
                    <span className="col-span-3 text-xs text-muted-foreground sm:col-span-1 sm:pb-2">
                      סט {i + 1}
                    </span>
                    {(["reps", "weight", "rpe"] as const).map((field) => (
                      <div key={field} className="space-y-1">
                        <Label className="text-xs">
                          {field === "reps" ? "חזרות" : field === "weight" ? 'ק"ג' : "RPE"}
                        </Label>
                        <Input
                          type="number"
                          className={s.needsUpdate ? "border-destructive text-destructive" : ""}
                          value={s[field]}
                          onChange={(e) =>
                            update((w) => ({
                              ...w,
                              exercises: w.exercises.map((x) =>
                                x.id === ex.id
                                  ? {
                                      ...x,
                                      sets: x.sets.map((y) =>
                                        y.id === s.id
                                          ? { ...y, [field]: Number(e.target.value), needsUpdate: false }
                                          : y,
                                      ),
                                    }
                                  : x,
                              ),
                            }))
                          }
                        />
                      </div>
                    ))}
                    <div className="col-span-3 text-xs sm:col-span-1">
                      {s.skipped ? (
                        <span className="text-destructive">דילג: {s.skipReason}</span>
                      ) : s.actualRpe != null ? (
                        <span className="text-warning">RPE בפועל: {s.actualRpe}</span>
                      ) : null}
                      {s.note && <span className="block text-muted-foreground">"{s.note}"</span>}
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    update((w) => ({
                      ...w,
                      exercises: w.exercises.map((x) => (x.id === ex.id ? { ...x, sets: [...x.sets, newSet()] } : x)),
                    }))
                  }
                >
                  <Plus className="size-4" /> הוסף סט
                </Button>
              </div>

              <div className="mt-3 space-y-1">
                <Label className="text-xs">הערת מאמן</Label>
                <Textarea
                  rows={2}
                  placeholder="לדוגמה: שמור על הגב ישר"
                  value={ex.coachNotes ?? ""}
                  onChange={(e) =>
                    update((w) => ({
                      ...w,
                      exercises: w.exercises.map((x) => (x.id === ex.id ? { ...x, coachNotes: e.target.value } : x)),
                    }))
                  }
                />
              </div>
            </div>
          ))}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Select value={newExercise} onValueChange={setNewExercise}>
              <SelectTrigger className="sm:flex-1">
                <SelectValue placeholder="בחר תרגיל מהרשימה" />
              </SelectTrigger>
              <SelectContent>
                {EXERCISE_LIBRARY.map((e) => (
                  <SelectItem key={e} value={e}>
                    {e}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="secondary"
              onClick={() => {
                if (!newExercise) {
                  toast.error("בחר תרגיל");
                  return;
                }
                update((w) => ({ ...w, exercises: [...w.exercises, emptyExercise(newExercise)] }));
                setNewExercise("");
              }}
            >
              <Plus className="size-4" /> הוסף תרגיל
            </Button>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            המשך לשנות
          </Button>
          <Button onClick={() => onSave(draft)}>שמור אימון</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
