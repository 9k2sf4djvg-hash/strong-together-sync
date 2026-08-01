import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Activity, ChevronLeft, Dumbbell, Plus, Search, Target, User, Users } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useStore, uid } from "@/lib/store";
import { AppHeader } from "@/components/AppHeader";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
      { title: "לוח בקרה למאמן — Strong Together" },
      { name: "description", content: "סטטיסטיקות מתאמנים, בלוקי אימונים ומעקב ביצועים בזמן אמת." },
      { property: "og:title", content: "לוח בקרה למאמן — Strong Together" },
      { property: "og:description", content: "סטטיסטיקות, בלוקים ומעקב ביצועים למאמן." },
    ],
  }),
  component: CoachHome,
});

function CoachHome() {
  const { state, setState, user, hydrated } = useStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [weeks, setWeeks] = useState("4");
  const [perWeek, setPerWeek] = useState("3");
  const [traineeId, setTraineeId] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!hydrated) return;
    if (!user) navigate({ to: "/" });
    else if (user.role !== "coach") navigate({ to: "/trainee" });
  }, [hydrated, user, navigate]);

  const stats = useMemo(() => {
    const blocks = state.blocks;
    let total = 0;
    let done = 0;
    const perBlock: { name: string; הושלמו: number; סהכ: number }[] = [];
    for (const b of blocks) {
      const week = b.weeks.find((w) => w.weekNumber === b.currentWeek);
      const t = week?.workouts.length ?? 0;
      const d = week?.workouts.filter((w) => w.completedAt).length ?? 0;
      total += t;
      done += d;
      perBlock.push({ name: b.name, הושלמו: d, סהכ: t });
    }
    const finishedWeek = blocks.filter((b) => {
      const week = b.weeks.find((w) => w.weekNumber === b.currentWeek);
      return week ? week.workouts.length > 0 && week.workouts.every((w) => w.completedAt) : false;
    }).length;
    return {
      trainees: new Set(blocks.map((b) => b.traineeId)).size,
      total,
      done,
      finishedWeek,
      rate: total ? Math.round((done / total) * 100) : 0,
      perBlock,
    };
  }, [state.blocks]);

  if (!user || user.role !== "coach") return null;

  const trainees = state.users.filter((u) => u.role === "trainee");
  const visibleBlocks = state.blocks.filter((b) => {
    const t = state.users.find((u) => u.id === b.traineeId);
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return b.name.toLowerCase().includes(q) || (t?.name ?? "").toLowerCase().includes(q);
  });

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
    <div className="min-h-screen text-foreground">
      <AppHeader subtitle={`מאמן · ${user.name}`} />
      <main className="mx-auto max-w-5xl px-4 py-6 pb-16">
        <section className="animate-rise mb-6">
          <p className="text-sm text-muted-foreground">שלום, {user.name}</p>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            לוח <span className="gradient-text">הבקרה</span> שלך
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            סקירה חיה של המתאמנים, האימונים והתקדמות השבוע.
          </p>
        </section>

        <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard icon={Users} label="מתאמנים פעילים" value={stats.trainees} trend="up" delay={0} />
          <StatCard icon={Dumbbell} label="אימונים השבוע" value={stats.total} delay={50} />
          <StatCard
            icon={Target}
            label="סיימו את השבוע"
            value={stats.finishedWeek}
            trend={stats.finishedWeek > 0 ? "up" : "flat"}
            delay={100}
          />
          <StatCard
            icon={Activity}
            label="אחוז השלמה"
            value={`${stats.rate}%`}
            hint={`${stats.done}/${stats.total} אימונים`}
            trend={stats.rate >= 50 ? "up" : "down"}
            delay={150}
          />
        </section>

        {stats.perBlock.length > 0 && (
          <section className="glass-card animate-rise mb-6 rounded-2xl p-4" style={{ animationDelay: "180ms" }}>
            <h2 className="mb-3 text-lg font-semibold">השלמת אימונים לפי בלוק</h2>
            <div className="h-56 w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.perBlock} barGap={6}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
                  <RTooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      color: "var(--popover-foreground)",
                    }}
                  />
                  <Bar dataKey="סהכ" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="הושלמו" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        <div className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="relative min-w-0">
            <Search className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="חיפוש מתאמן או בלוק"
              aria-label="חיפוש"
              className="pe-9"
            />
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="press gradient-surface shrink-0 shadow-[0_0_20px_color-mix(in_oklab,var(--primary)_40%,transparent)] hover:opacity-95">
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
          {visibleBlocks.map((b, i) => {
            const trainee = state.users.find((u) => u.id === b.traineeId);
            const week = b.weeks.find((w) => w.weekNumber === b.currentWeek);
            const total = week?.workouts.length ?? 0;
            const done = week?.workouts.filter((w) => w.completedAt).length ?? 0;
            const pct = total ? Math.round((done / total) * 100) : 0;
            return (
              <Link
                key={b.id}
                to="/coach/block/$blockId"
                params={{ blockId: b.id }}
                className="glass-card lift animate-rise group rounded-2xl p-4"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="gradient-surface grid size-10 shrink-0 place-items-center rounded-full font-bold">
                      {trainee?.name?.slice(0, 1) ?? <User className="size-5" />}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{trainee?.name ?? "מתאמן"}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {b.name} · שבוע {b.currentWeek}/{b.totalWeeks}
                      </p>
                    </div>
                  </div>
                  <ChevronLeft className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:-translate-x-1" />
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <Progress value={pct} className="h-2" />
                  <Badge variant={pct === 100 ? "default" : "secondary"} className="shrink-0">
                    {pct}%
                  </Badge>
                </div>
              </Link>
            );
          })}
          {visibleBlocks.length === 0 && (
            <div className="glass-card animate-rise col-span-full rounded-2xl p-8 text-center">
              <span className="gradient-surface mx-auto mb-3 grid size-12 place-items-center rounded-2xl">
                <Dumbbell className="size-6" />
              </span>
              <p className="font-semibold">אין בלוקים להצגה</p>
              <p className="mt-1 text-sm text-muted-foreground">צור בלוק חדש כדי להתחיל לתכנן אימונים.</p>
            </div>
          )}
        </div>

        {state.notifications.filter((n) => n.to === "coach").length > 0 && (
          <section className="glass-card mt-6 rounded-2xl p-4">
            <h2 className="mb-3 text-lg font-semibold">פעילות אחרונה</h2>
            <ul className="space-y-3">
              {state.notifications
                .filter((n) => n.to === "coach")
                .slice(0, 6)
                .map((n) => (
                  <li key={n.id} className="flex items-start gap-3 text-sm">
                    <span className="mt-1.5 size-2 shrink-0 animate-pulse rounded-full bg-primary" />
                    <span className="min-w-0">{n.text}</span>
                  </li>
                ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
