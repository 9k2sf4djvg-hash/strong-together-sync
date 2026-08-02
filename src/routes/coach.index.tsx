import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Activity, CheckCircle2, Copy, Plus, User, UserPlus, Users, Layers } from "lucide-react";
import { useStore, uid } from "@/lib/store";
import { AppHeader } from "@/components/AppHeader";
import { EmptyState, ProgressBar, StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Week } from "@/lib/types";

export const Route = createFileRoute("/coach/")({
  head: () => ({
    meta: [
      { title: "ממשק מאמן — Strong Together" },
      { name: "description", content: "בחירת מתאמן, יצירת בלוקי אימונים ומעקב אחר ביצועים." },
      { property: "og:title", content: "ממשק מאמן — Strong Together" },
      { property: "og:description", content: "בחירת מתאמן ויצירת בלוקי אימונים." },
    ],
  }),
  component: CoachHome,
});

function CoachHome() {
  const { state, createBlock, user, hydrated, createInviteCode } = useStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [name, setName] = useState("");
  const [weeks, setWeeks] = useState("4");
  const [perWeek, setPerWeek] = useState("3");
  const [traineeId, setTraineeId] = useState("");
  const goStat = (metric: "trainees" | "blocks" | "workouts" | "completion") =>
    navigate({ to: "/coach/stats/$metric", params: { metric } });

  useEffect(() => {
    if (!hydrated) return;
    if (!user) navigate({ to: "/" });
    else if (user.role !== "coach") navigate({ to: "/trainee" });
  }, [hydrated, user, navigate]);

  if (!user || user.role !== "coach") return null;

  const trainees = state.users.filter((u) => u.role === "trainee" && u.coachId === user.id);

  const allWorkouts = state.blocks.flatMap((b) =>
    b.weeks
      .filter((w) => w.weekNumber === b.currentWeek)
      .flatMap((w) => w.workouts.map((wo) => ({ workout: wo, block: b, week: w }))),
  );
  const completedWorkouts = allWorkouts.filter((x) => x.workout.completedAt).length;
  const completionRate = allWorkouts.length
    ? Math.round((completedWorkouts / allWorkouts.length) * 100)
    : 0;

  const openInvite = async () => {
    setInviteOpen(true);
    setInviteCode("");
    const code = await createInviteCode();
    if (!code) toast.error("יצירת הקוד נכשלה");
    setInviteCode(code);
  };

  const create = async () => {
    const w = Number(weeks);
    const p = Number(perWeek);
    if (!name.trim() || !traineeId || w < 1 || p < 1) {
      toast.error("יש למלא שם בלוק, מתאמן, מספר שבועות ואימונים בשבוע");
      return;
    }
    const week: Week = {
      weekNumber: 1,
      published: false,
      workouts: Array.from({ length: p }, (_, i) => ({
        id: uid(),
        title: `אימון ${i + 1}`,
        exercises: [],
      })),
    };
    const blockId = await createBlock({
      coachId: user.id,
      traineeId,
      name: name.trim(),
      totalWeeks: w,
      workoutsPerWeek: p,
      currentWeek: 1,
      weeks: [week],
    });
    if (!blockId) {
      toast.error("יצירת הבלוק נכשלה");
      return;
    }
    setOpen(false);
    setName("");
    toast.success("הבלוק נוצר");
    navigate({ to: "/coach/block/$blockId", params: { blockId } });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader subtitle={`מאמן · ${user.name}`} />
      <main className="mx-auto max-w-5xl px-4 py-6 pb-16">
        <div className="mb-5 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-widest text-primary uppercase">לוח מאמן</p>
            <h1 className="truncate text-2xl font-extrabold sm:text-3xl">שלום, {user.name}</h1>
          </div>
          <div className="flex items-center gap-2">
          <Button variant="outline" className="min-h-11" onClick={() => void openInvite()}>
            <UserPlus className="size-4" /> הזמן מתאמן
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="min-h-11">
                <Plus className="size-4" /> בלוק חדש
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>בלוק חדש</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
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
                <div className="space-y-2">
                  <Label>שם הבלוק</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="לדוגמה: הכנה לקיץ" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>מספר שבועות</Label>
                    <Input type="number" min={1} value={weeks} onChange={(e) => setWeeks(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>אימונים בשבוע</Label>
                    <Input type="number" min={1} value={perWeek} onChange={(e) => setPerWeek(e.target.value)} />
                  </div>
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  ביטול
                </Button>
                <Button onClick={() => void create()}>המשך</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>קוד הזמנה למתאמן</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              שלח את הקוד למתאמן. לאחר שייכנס לאפליקציה ויזין אותו, הוא יתחבר אליך אוטומטית.
            </p>
            <div className="glass-card rounded-2xl p-5 text-center">
              <span dir="ltr" className="gradient-text text-3xl font-extrabold tracking-[0.3em]">
                {inviteCode || "······"}
              </span>
            </div>
            <DialogFooter>
              <Button
                className="w-full"
                disabled={!inviteCode}
                onClick={() => {
                  void navigator.clipboard.writeText(inviteCode);
                  toast.success("הקוד הועתק");
                }}
              >
                <Copy className="size-4" /> העתק קוד
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            icon={Users}
            label="מתאמנים פעילים"
            value={trainees.length}
            index={0}
            onClick={() => goStat("trainees")}
          />
          <StatCard
            icon={Layers}
            label="בלוקים פעילים"
            value={state.blocks.length}
            tone="violet"
            index={1}
            onClick={() => goStat("blocks")}
          />
          <StatCard
            icon={Activity}
            label="אימונים השבוע"
            value={allWorkouts.length}
            tone="accent"
            index={2}
            onClick={() => goStat("workouts")}
          />
          <StatCard
            icon={CheckCircle2}
            label="אחוז השלמה"
            value={`${completionRate}%`}
            hint={`${completedWorkouts} מתוך ${allWorkouts.length}`}
            trend={completionRate >= 50 ? "up" : "down"}
            tone="success"
            index={3}
            onClick={() => goStat("completion")}
          />
        </div>

        <h2 className="mb-3 text-lg font-bold">המתאמנים שלי</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {state.blocks.map((b) => {
            const trainee = state.users.find((u) => u.id === b.traineeId);
            const weekProgress = (b.currentWeek / Math.max(1, b.totalWeeks)) * 100;
            return (
              <Link
                key={b.id}
                to="/coach/block/$blockId"
                params={{ blockId: b.id }}
                className="glass-card lift animate-fade-up rounded-2xl p-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="gradient-brand grid size-11 shrink-0 place-items-center rounded-full text-white">
                    <User className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{trainee?.name ?? "מתאמן"}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      בלוק "{b.name}" · שבוע {b.currentWeek}/{b.totalWeeks}
                    </p>
                  </div>
                </div>
                <ProgressBar value={weekProgress} className="mt-4" />
              </Link>
            );
          })}
          {state.blocks.length === 0 && (
            <EmptyState
              icon={Layers}
              title="אין עדיין בלוקים"
              description="צור בלוק אימונים ראשון כדי להתחיל לתכנן שבועות ולעקוב אחרי המתאמנים שלך."
              action={
                <Button onClick={() => setOpen(true)}>
                  <Plus className="size-4" /> בלוק חדש
                </Button>
              }
            />
          )}
        </div>
      </main>
    </div>
  );
}
