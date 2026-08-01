import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowRight, Check, Copy, Pencil, Plus, Send, Trash2 } from "lucide-react";
import { emptyExercise, newSet, uid, useStore } from "@/lib/store";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SetVideoPlayer } from "@/components/SetVideo";
import type { WorkoutSet } from "@/lib/types";
import { targetText } from "@/lib/format";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Block, Week, Workout } from "@/lib/types";

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
  const { state, setState, user, updateBlock, notify, hydrated } = useStore();
  const navigate = useNavigate();
  const [editing, setEditing] = useState<{ week: number; workoutId: string } | null>(null);
  const [editBlockOpen, setEditBlockOpen] = useState(false);

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
            actualReps: null,
            actualWeight: null,
            actualRpe: null,
            videoId: null,
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

  const addWeek = () => {
    const next = block.weeks.length + 1;
    updateBlock(block.id, (b) => ({
      ...b,
      totalWeeks: Math.max(b.totalWeeks, next),
      weeks: [...b.weeks, { weekNumber: next, published: false, reviewed: false, workouts: [] }],
    }));
    toast.success(`שבוע ${next} נוסף`);
  };

  const deleteWeek = (week: Week) => {
    if (!window.confirm(`למחוק את שבוע ${week.weekNumber}? הפעולה אינה הפיכה.`)) return;
    updateBlock(block.id, (b) => {
      const weeks = b.weeks
        .filter((w) => w.weekNumber !== week.weekNumber)
        .map((w, i) => ({ ...w, weekNumber: i + 1 }));
      return {
        ...b,
        weeks,
        currentWeek: Math.min(Math.max(b.currentWeek, 1), Math.max(weeks.length, 1)),
      };
    });
    toast.success("השבוע נמחק");
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

  const deleteBlock = () => {
    if (!window.confirm(`למחוק את הבלוק "${block.name}"? הפעולה אינה הפיכה.`)) return;
    setState((s) => ({ ...s, blocks: s.blocks.filter((b) => b.id !== block.id) }));
    toast.success("הבלוק נמחק");
    navigate({ to: "/coach" });
  };

  const finishBlock = () => {
    if (!window.confirm(`לסיים את הבלוק "${block.name}"?`)) return;
    updateBlock(block.id, (b) => ({ ...b, completedAt: Date.now() }));
    notify("trainee", `הבלוק "${block.name}" הסתיים — כל הכבוד!`);
    toast.success("הבלוק הסתיים");
  };

  const reopenBlock = () => {
    updateBlock(block.id, (b) => ({ ...b, completedAt: null }));
    toast.success("הבלוק נפתח מחדש");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader subtitle={`בלוק: ${block.name} · ${trainee?.name ?? ""}`} />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Link to="/coach" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowRight className="size-4" /> חזרה לרשימת המתאמנים
        </Link>
        <h1 className="mb-1 text-2xl font-bold sm:text-3xl">{block.name}</h1>
        <p className="mb-3 text-sm text-muted-foreground">
          {block.totalWeeks} שבועות · {block.workoutsPerWeek} אימונים בשבוע · שבוע נוכחי {block.currentWeek}
        </p>
        <div className="mb-6 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setEditBlockOpen(true)}>
            <Pencil className="size-4" /> ערוך בלוק
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={deleteBlock}
          >
            <Trash2 className="size-4" /> מחק בלוק
          </Button>
        </div>

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
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteWeek(week)}
                      aria-label={`מחק שבוע ${week.weekNumber}`}
                    >
                      <Trash2 className="size-4" /> מחק שבוע
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
                {block.currentWeek === week.weekNumber && !block.completedAt && (
                  <Button size="sm" variant="secondary" className="mt-3" onClick={finishBlock}>
                    <Check className="size-4" /> סיים בלוק
                  </Button>
                )}
              </section>
            );
          })}
          <Button variant="outline" className="w-full" onClick={addWeek}>
            <Plus className="size-4" /> הוסף שבוע
          </Button>
          {block.completedAt ? (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-success/40 bg-success/10 p-4">
              <p className="font-semibold text-success">הבלוק הושלם ✓</p>
              <Button size="sm" variant="outline" onClick={reopenBlock}>
                פתח מחדש
              </Button>
            </div>
          ) : (
            <Button variant="secondary" className="w-full" onClick={finishBlock}>
              <Check className="size-4" /> סיים בלוק
            </Button>
          )}
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

      {editBlockOpen && (
        <BlockSettingsDialog
          block={block}
          trainees={state.users.filter((u) => u.role === "trainee")}
          onClose={() => setEditBlockOpen(false)}
          onSave={(patch) => {
            updateBlock(block.id, (b) => ({ ...b, ...patch }));
            setEditBlockOpen(false);
            toast.success("פרטי הבלוק עודכנו");
          }}
        />
      )}
    </div>
  );
}

function BlockSettingsDialog({
  block,
  trainees,
  onClose,
  onSave,
}: {
  block: Block;
  trainees: { id: number; name: string }[];
  onClose: () => void;
  onSave: (patch: Partial<Block>) => void;
}) {
  const [name, setName] = useState(block.name);
  const [totalWeeks, setTotalWeeks] = useState(String(block.totalWeeks));
  const [perWeek, setPerWeek] = useState(String(block.workoutsPerWeek));
  const [currentWeek, setCurrentWeek] = useState(String(block.currentWeek));
  const [traineeId, setTraineeId] = useState(String(block.traineeId));

  const submit = () => {
    const tw = Number(totalWeeks);
    const pw = Number(perWeek);
    const cw = Number(currentWeek);
    if (!name.trim() || tw < 1 || pw < 1 || cw < 1) {
      toast.error("יש למלא שם בלוק ומספרים חוקיים");
      return;
    }
    if (tw < block.weeks.length) {
      toast.error(`בבלוק כבר ${block.weeks.length} שבועות — מחק שבועות תחילה`);
      return;
    }
    onSave({
      name: name.trim(),
      totalWeeks: tw,
      workoutsPerWeek: pw,
      currentWeek: Math.min(cw, Math.max(block.weeks.length, 1)),
      traineeId: Number(traineeId),
    });
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>עריכת פרטי בלוק</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>שם הבלוק</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="לדוגמה: הכנה לקיץ" />
          </div>
          <div className="space-y-2">
            <Label>מתאמן</Label>
            <Select value={traineeId} onValueChange={setTraineeId}>
              <SelectTrigger>
                <SelectValue placeholder="בחר מתאמן" />
              </SelectTrigger>
              <SelectContent>
                {trainees.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>מספר שבועות</Label>
              <Input type="number" min={1} value={totalWeeks} onChange={(e) => setTotalWeeks(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>אימונים בשבוע</Label>
              <Input type="number" min={1} value={perWeek} onChange={(e) => setPerWeek(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>שבוע נוכחי</Label>
            <Input type="number" min={1} value={currentWeek} onChange={(e) => setCurrentWeek(e.target.value)} />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            ביטול
          </Button>
          <Button onClick={submit}>שמור</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const FIELDS = [
  { key: "weight", label: 'משקל (ק"ג)', has: "hasWeight", min: "weightMin", max: "weightMax" },
  { key: "reps", label: "חזרות", has: "hasReps", min: "repsMin", max: "repsMax" },
  { key: "rpe", label: "RPE (1-10)", has: "hasRpe", min: "rpeMin", max: "rpeMax" },
] as const;

type FieldMode = "range" | "single" | "off";

const MODES: { value: FieldMode; label: string }[] = [
  { value: "range", label: "טווח" },
  { value: "single", label: "ערך יחיד" },
  { value: "off", label: "לא רלוונטי" },
];

function SetEditorRow({
  set,
  index,
  onPatch,
  onDuplicate,
  onDelete,
}: {
  set: WorkoutSet;
  index: number;
  onPatch: (patch: Partial<WorkoutSet>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-xl border border-border p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">סט {index + 1}</p>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={onDuplicate} aria-label="שכפל סט">
            <Copy className="size-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={onDelete} aria-label="מחק סט">
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {FIELDS.map((f) => {
          const enabled = set[f.has];
          const min = set[f.min];
          const max = set[f.max];
          const mode: FieldMode = !enabled ? "off" : min === max ? "single" : "range";
          const setMode = (m: FieldMode) => {
            if (m === "off") {
              onPatch({ [f.has]: false } as Partial<WorkoutSet>);
            } else if (m === "single") {
              const v = min ?? max ?? null;
              onPatch({ [f.has]: true, [f.min]: v, [f.max]: v, needsUpdate: false } as Partial<WorkoutSet>);
            } else {
              const v = min ?? max ?? null;
              onPatch({ [f.has]: true, [f.min]: v, [f.max]: v == null ? null : v } as Partial<WorkoutSet>);
            }
          };
          return (
            <div key={f.key} className="space-y-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-medium">{f.label}</span>
                <div className="flex overflow-hidden rounded-lg border border-border">
                  {MODES.map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setMode(m.value)}
                      className={`px-2 py-1 text-[11px] transition-colors ${
                        mode === m.value
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
              {mode === "single" ? (
                <Input
                  type="number"
                  inputMode="numeric"
                  className={`font-mono ${set.needsUpdate ? "border-destructive text-destructive" : ""}`}
                  value={min ?? ""}
                  onChange={(e) => {
                    const v = e.target.value === "" ? null : Number(e.target.value);
                    onPatch({ [f.min]: v, [f.max]: v, needsUpdate: false } as Partial<WorkoutSet>);
                  }}
                />
              ) : mode === "range" ? (
                <div className="grid grid-cols-2 gap-2">
                  {([f.min, f.max] as const).map((k, idx) => (
                    <div key={k} className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">
                        {idx === 0 ? "מינימום" : "מקסימום"}
                      </Label>
                      <Input
                        type="number"
                        inputMode="numeric"
                        className={`font-mono ${set.needsUpdate ? "border-destructive text-destructive" : ""}`}
                        value={set[k] ?? ""}
                        onChange={(e) =>
                          onPatch({
                            [k]: e.target.value === "" ? null : Number(e.target.value),
                            needsUpdate: false,
                          } as Partial<WorkoutSet>)
                        }
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="font-mono text-muted-foreground">————</p>
              )}
            </div>
          );
        })}
      </div>

      {(set.skipped || set.actualReps != null || set.actualWeight != null || set.actualRpe != null || set.note || set.videoId) && (
        <div className="mt-3 rounded-lg bg-muted/50 p-2 text-xs">
          {set.skipped ? (
            <p className="text-destructive">המתאמן דילג: {set.skipReason}</p>
          ) : (
            <p className="font-mono text-warning">
              בפועל — משקל: {set.actualWeight ?? "—"} · חזרות: {set.actualReps ?? "—"} · RPE: {set.actualRpe ?? "—"}
            </p>
          )}
          {set.note && <p className="text-muted-foreground">"{set.note}"</p>}
          <SetVideoPlayer videoId={set.videoId} />
        </div>
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
  if (workout.completedAt) return <CompletedWorkoutView workout={workout} onClose={onClose} />;
  return <WorkoutEditorInner workout={workout} onClose={onClose} onSave={onSave} />;
}

function CompletedWorkoutView({ workout, onClose }: { workout: Workout; onClose: () => void }) {
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{workout.title} — בוצע ✓</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {workout.exercises.map((ex) => (
            <section
              key={ex.id}
              className={`rounded-xl border border-border p-3 ${ex.skipped ? "opacity-60" : ""}`}
            >
              <p className={`font-semibold ${ex.skipped ? "line-through" : ""}`}>{ex.name}</p>
              {ex.coachNotes && <p className="mt-1 text-xs text-warning">הערת מאמן: {ex.coachNotes}</p>}
              {ex.skipped && <p className="mt-1 text-xs text-destructive">המתאמן דילג: {ex.skipReason}</p>}
              <div className="mt-2 space-y-2">
                {ex.sets.map((s, i) => (
                  <div key={s.id} className="rounded-lg border border-border p-2 text-sm">
                    <p className="mb-1 text-xs font-semibold">סט {i + 1}</p>
                    {s.skipped ? (
                      <p className="text-destructive">דילוג: {s.skipReason}</p>
                    ) : (
                      <div className="grid gap-1 font-mono text-xs sm:grid-cols-3">
                        <p>
                          משקל: <span className="text-muted-foreground">{targetText(s, "weight")}</span> →{" "}
                          <span className="text-accent">{s.actualWeight ?? "—"}</span>
                        </p>
                        <p>
                          חזרות: <span className="text-muted-foreground">{targetText(s, "reps")}</span> →{" "}
                          <span className="text-accent">{s.actualReps ?? "—"}</span>
                        </p>
                        <p>
                          RPE: <span className="text-muted-foreground">{targetText(s, "rpe")}</span> →{" "}
                          <span className="text-accent">{s.actualRpe ?? "—"}</span>
                        </p>
                      </div>
                    )}
                    {s.note && <p className="mt-1 text-xs text-muted-foreground">"{s.note}"</p>}
                    <SetVideoPlayer videoId={s.videoId} />
                  </div>
                ))}
              </div>
            </section>
          ))}
          {workout.exercises.length === 0 && <p className="text-muted-foreground">אין תרגילים באימון זה.</p>}
        </div>
        <DialogFooter>
          <Button onClick={onClose}>סגור</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function WorkoutEditorInner({
  workout,
  onClose,
  onSave,
}: {
  workout: Workout;
  onClose: () => void;
  onSave: (w: Workout) => void;
}) {
  const [draft, setDraft] = useState<Workout>(workout);
  const [newExercise, setNewExercise] = useState("");

  const update = (fn: (w: Workout) => Workout) => setDraft((d) => fn(d));

  if (workout.completedAt) return <CompletedWorkoutView workout={workout} onClose={onClose} />;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>בניית אימון</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>כותרת אימון</Label>
            <Input
              value={draft.title}
              placeholder="לדוגמה: רגליים"
              onChange={(e) => update((w) => ({ ...w, title: e.target.value }))}
            />
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
                  <SetEditorRow
                    key={s.id}
                    set={s}
                    index={i}
                    onPatch={(patch) =>
                      update((w) => ({
                        ...w,
                        exercises: w.exercises.map((x) =>
                          x.id === ex.id
                            ? { ...x, sets: x.sets.map((y) => (y.id === s.id ? { ...y, ...patch } : y)) }
                            : x,
                        ),
                      }))
                    }
                    onDuplicate={() =>
                      update((w) => ({
                        ...w,
                        exercises: w.exercises.map((x) =>
                          x.id === ex.id
                            ? {
                                ...x,
                                sets: [
                                  ...x.sets,
                                  {
                                    ...s,
                                    id: uid(),
                                    actualReps: null,
                                    actualWeight: null,
                                    actualRpe: null,
                                    videoId: null,
                                    note: "",
                                    skipped: false,
                                    skipReason: "",
                                  },
                                ],
                              }
                            : x,
                        ),
                      }))
                    }
                    onDelete={() =>
                      update((w) => ({
                        ...w,
                        exercises: w.exercises.map((x) =>
                          x.id === ex.id ? { ...x, sets: x.sets.filter((y) => y.id !== s.id) } : x,
                        ),
                      }))
                    }
                  />
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
            <Input
              className="sm:flex-1"
              placeholder="שם התרגיל"
              value={newExercise}
              onChange={(e) => setNewExercise(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newExercise.trim()) {
                  e.preventDefault();
                  update((w) => ({ ...w, exercises: [...w.exercises, emptyExercise(newExercise.trim())] }));
                  setNewExercise("");
                }
              }}
            />
            <Button
              variant="secondary"
              onClick={() => {
                if (!newExercise.trim()) {
                  toast.error("הזן שם תרגיל");
                  return;
                }
                update((w) => ({ ...w, exercises: [...w.exercises, emptyExercise(newExercise.trim())] }));
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
