import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { Layers, Loader2, ShieldCheck, UserCheck, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/lib/store";
import { claimAdminRole } from "@/lib/admin.functions";
import { AppHeader } from "@/components/AppHeader";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "פאנל ניהול — Strong Together" },
      { name: "description", content: "לוח בקרה למנהלי המערכת: אישור מאמנים, נתוני משתמשים ומעקב פעילות." },
      { property: "og:title", content: "פאנל ניהול — Strong Together" },
      { property: "og:description", content: "אישור מאמנים וניהול משתמשי המערכת." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminHome,
});

function AdminHome() {
  const { user, hydrated, loading, isAdmin, refresh } = useStore();
  const navigate = useNavigate();
  const claim = useServerFn(claimAdminRole);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [stats, setStats] = useState({ users: 0, coaches: 0, pending: 0, blocks: 0 });

  useEffect(() => {
    if (!hydrated || loading) return;
    if (!user) navigate({ to: "/" });
  }, [hydrated, loading, user, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    void (async () => {
      const [u, c, p, b] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("coach_applications").select("id", { count: "exact", head: true }).eq("status", "approved"),
        supabase.from("coach_applications").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("blocks").select("id", { count: "exact", head: true }),
      ]);
      setStats({ users: u.count ?? 0, coaches: c.count ?? 0, pending: p.count ?? 0, blocks: b.count ?? 0 });
    })();
  }, [isAdmin]);

  if (!user) return null;

  if (!isAdmin) {
    const submit = async (e: React.FormEvent) => {
      e.preventDefault();
      setBusy(true);
      try {
        const res = await claim({ data: { code: code.trim() } });
        if (!res.ok) toast.error("קוד ניהול שגוי");
        else {
          await refresh();
          toast.success("גישת מנהל אושרה");
        }
      } catch {
        toast.error("שגיאה, נסה שוב");
      }
      setBusy(false);
    };
    return (
      <div className="min-h-screen bg-background text-foreground">
        <AppHeader />
        <main className="mx-auto max-w-sm px-4 py-16">
          <div className="glass-card animate-fade-up rounded-3xl p-6 text-center">
            <span className="gradient-brand glow-primary mx-auto mb-4 grid size-14 place-items-center rounded-2xl text-white">
              <ShieldCheck className="size-6" />
            </span>
            <h1 className="text-xl font-extrabold">גישת מנהל</h1>
            <p className="mt-1 text-sm text-muted-foreground">הזן את קוד הניהול כדי להיכנס לפאנל.</p>
            <form onSubmit={submit} className="mt-5 space-y-3 text-right">
              <div className="space-y-2">
                <Label htmlFor="admin-code">קוד ניהול</Label>
                <Input
                  id="admin-code"
                  dir="ltr"
                  value={code}
                  maxLength={64}
                  onChange={(e) => setCode(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={busy}>
                {busy ? <Loader2 className="size-4 animate-spin" /> : "אישור"}
              </Button>
            </form>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="animate-fade-up text-2xl font-extrabold sm:text-3xl">פאנל ניהול</h1>
        <p className="mb-6 text-sm text-muted-foreground">סקירה כללית וניהול מאמני המערכת.</p>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard icon={Users} label="משתמשים" value={stats.users} />
          <StatCard icon={UserCheck} label="מאמנים מאושרים" value={stats.coaches} />
          <StatCard icon={ShieldCheck} label="ממתינים לאישור" value={stats.pending} />
          <StatCard icon={Layers} label="בלוקים" value={stats.blocks} />
        </div>

        <div className="glass-card mt-6 flex flex-wrap items-center justify-between gap-3 rounded-3xl p-5">
          <div>
            <h2 className="font-bold">ניהול מאמנים</h2>
            <p className="text-sm text-muted-foreground">אישור, דחייה, חסימה ומחיקה של מאמנים.</p>
          </div>
          <Button asChild>
            <Link to="/admin/coaches">לניהול מאמנים</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
