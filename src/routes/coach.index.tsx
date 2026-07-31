import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, User } from "lucide-react";
import { useStore, uid } from "@/lib/store";
import { AppHeader } from "@/components/AppHeader";
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
import type { Block, Week } from "@/lib/types";

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
  const { state, setState, user } = useStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [weeks, setWeeks] = useState("4");
  const [perWeek, setPerWeek] = useState("3");
  const [traineeId, setTraineeId] = useState("");

  useEffect(() => {
    if (!user) navigate({ to: "/" });
    else if (user.role !== "coach") navigate({ to: "/trainee" });
  }, [user, navigate]);

  if (!user || user.role !== "coach") return null;

  const trainees = state.users.filter((u) => u.role === "trainee");

  const create = () => {
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
    const block: Block = {
      id: uid(),
      coachId: user.id,
      traineeId: Number(traineeId),
      name: name.trim(),
      totalWeeks: w,
      workoutsPerWeek: p,
      currentWeek: 1,
      weeks: [week],
    };
    setState((s) => ({ ...s, blocks: [...s.blocks, block] }));
    setOpen(false);
    setName("");
    toast.success("הבלוק נוצר");
    navigate({ to: "/coach/block/$blockId", params: { blockId: block.id } });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader subtitle={`מאמן · ${user.name}`} />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold sm:text-3xl">בחר מתאמן</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
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
                <Button onClick={create}>המשך</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {state.blocks.map((b) => {
            const trainee = state.users.find((u) => u.id === b.traineeId);
            return (
              <Link
                key={b.id}
                to="/coach/block/$blockId"
                params={{ blockId: b.id }}
                className="rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-muted">
                    <User className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{trainee?.name ?? "מתאמן"}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      בלוק: "{b.name}" (שבוע {b.currentWeek}/{b.totalWeeks})
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
          {state.blocks.length === 0 && (
            <p className="text-sm text-muted-foreground">אין עדיין בלוקים. צור בלוק חדש כדי להתחיל.</p>
          )}
        </div>
      </main>
    </div>
  );
}
