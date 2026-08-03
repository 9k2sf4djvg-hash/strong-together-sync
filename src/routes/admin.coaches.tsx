import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { ChevronLeft, ExternalLink, Loader2, ShieldX, Trash2, UserCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useStore, toCoachApp } from "@/lib/store";
import { adminDeleteUser } from "@/lib/admin.functions";
import { AppHeader } from "@/components/AppHeader";
import { EmptyState } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import type { CoachApplication, CoachStatus } from "@/lib/types";

export const Route = createFileRoute("/admin/coaches")({
  head: () => ({
    meta: [
      { title: "ניהול מאמנים — Strong Together" },
      { name: "description", content: "אישור, דחייה, חסימה ומחיקה של בקשות אימות מאמנים במערכת." },
      { property: "og:title", content: "ניהול מאמנים — Strong Together" },
      { property: "og:description", content: "טיפול בבקשות אימות של מאמנים." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminCoaches,
});

const LABEL: Record<CoachStatus, string> = {
  pending: "ממתין",
  approved: "מאושר",
  rejected: "נדחה",
  blocked: "חסום",
};

function AdminCoaches() {
  const { user, hydrated, loading, isAdmin } = useStore();
  const navigate = useNavigate();
  const removeUser = useServerFn(adminDeleteUser);
  const [apps, setApps] = useState<CoachApplication[]>([]);
  const [tab, setTab] = useState<CoachStatus>("pending");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reason, setReason] = useState<Record<string, string>>({});
  const [toDelete, setToDelete] = useState<CoachApplication | null>(null);

  const loadApps = useCallback(async () => {
    const { data } = await supabase
      .from("coach_applications")
      .select("*")
      .order("created_at", { ascending: false });
    setApps(((data ?? []) as unknown as Parameters<typeof toCoachApp>[0][]).map(toCoachApp));
  }, []);

  useEffect(() => {
    if (!hydrated || loading) return;
    if (!user) navigate({ to: "/" });
    else if (!isAdmin) navigate({ to: "/admin" });
    else void loadApps();
  }, [hydrated, loading, user, isAdmin, navigate, loadApps]);

  if (!user || !isAdmin) return null;

  const review = async (app: CoachApplication, status: CoachStatus) => {
    const why = (reason[app.id] ?? "").trim();
    if ((status === "rejected" || status === "blocked") && why.length < 5) {
      toast.error("יש לפרט סיבה (לפחות 5 תווים)");
      return;
    }
    setBusyId(app.id);
    const { error } = await supabase
      .from("coach_applications")
      .update({
        status,
        rejection_reason: status === "approved" ? null : why,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", app.id);
    if (error) {
      setBusyId(null);
      toast.error("העדכון נכשל");
      return;
    }
    await Promise.all([
      supabase.from("admin_logs").insert({
        admin_id: user.id,
        action: status,
        target_user_id: app.userId,
        notes: why,
      }),
      supabase.from("notifications").insert({
        to_user_id: app.userId,
        from_user_id: user.id,
        to_role: "coach",
        text:
          status === "approved"
            ? "בקשת האימות שלך אושרה — אפשר להתחיל לאמן!"
            : status === "rejected"
              ? `בקשת האימות נדחתה: ${why}`
              : `החשבון שלך נחסם: ${why}`,
      }),
    ]);
    setBusyId(null);
    await loadApps();
    toast.success("הבקשה עודכנה");
  };

  const openCredential = async (path: string) => {
    const { data, error } = await supabase.storage.from("coach-credentials").createSignedUrl(path, 300);
    if (error || !data) {
      toast.error("פתיחת הקובץ נכשלה");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener");
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setBusyId(toDelete.id);
    try {
      await removeUser({ data: { userId: toDelete.userId } });
      toast.success("החשבון נמחק");
      await loadApps();
    } catch {
      toast.error("המחיקה נכשלה");
    }
    setBusyId(null);
    setToDelete(null);
  };

  const list = apps.filter((a) => a.status === tab);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Link to="/admin" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="size-4" /> חזרה לפאנל
        </Link>
        <h1 className="animate-fade-up text-2xl font-extrabold sm:text-3xl">ניהול מאמנים</h1>

        <Tabs value={tab} onValueChange={(v) => setTab(v as CoachStatus)} className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            {(["pending", "approved", "rejected", "blocked"] as CoachStatus[]).map((s) => (
              <TabsTrigger key={s} value={s}>
                {LABEL[s]} ({apps.filter((a) => a.status === s).length})
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="mt-4 space-y-3">
          {list.length === 0 && (
            <EmptyState icon={UserCheck} title="אין בקשות" description="לא נמצאו מאמנים בסטטוס זה." />
          )}
          {list.map((app) => (
            <article key={app.id} className="glass-card animate-fade-up space-y-3 rounded-2xl p-4">
              <header className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-bold">{app.fullName}</h2>
                  <p dir="ltr" className="text-right text-xs text-muted-foreground">
                    {app.email}
                  </p>
                </div>
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold">{LABEL[app.status]}</span>
              </header>

              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <p className="text-muted-foreground">
                  התמחות: <span className="text-foreground">{app.specialty || "—"}</span>
                </p>
                <p className="text-muted-foreground">
                  ניסיון: <span className="text-foreground">{app.yearsExperience} שנים</span>
                </p>
              </div>
              {app.bio && <p className="rounded-xl bg-muted/30 p-3 text-sm text-muted-foreground">{app.bio}</p>}
              {app.applicantNotes && (
                <p className="text-xs text-muted-foreground">הערת המאמן: {app.applicantNotes}</p>
              )}
              {app.rejectionReason && <p className="text-xs text-destructive">סיבה: {app.rejectionReason}</p>}

              {app.credentialPath && (
                <Button variant="outline" size="sm" onClick={() => void openCredential(app.credentialPath!)}>
                  <ExternalLink className="size-4" /> צפייה בתעודה
                </Button>
              )}

              {app.status !== "approved" && (
                <Textarea
                  rows={2}
                  maxLength={500}
                  placeholder="סיבת דחייה / חסימה"
                  value={reason[app.id] ?? ""}
                  onChange={(e) => setReason({ ...reason, [app.id]: e.target.value })}
                />
              )}

              <footer className="flex flex-wrap gap-2">
                {app.status !== "approved" && (
                  <Button size="sm" disabled={busyId === app.id} onClick={() => void review(app, "approved")}>
                    {busyId === app.id ? <Loader2 className="size-4 animate-spin" /> : <UserCheck className="size-4" />}
                    אישור
                  </Button>
                )}
                {app.status === "pending" && (
                  <Button size="sm" variant="outline" disabled={busyId === app.id} onClick={() => void review(app, "rejected")}>
                    דחייה
                  </Button>
                )}
                {app.status !== "blocked" && (
                  <Button size="sm" variant="outline" disabled={busyId === app.id} onClick={() => void review(app, "blocked")}>
                    <ShieldX className="size-4" /> חסימה
                  </Button>
                )}
                <Button size="sm" variant="destructive" disabled={busyId === app.id} onClick={() => setToDelete(app)}>
                  <Trash2 className="size-4" /> מחיקת חשבון
                </Button>
              </footer>
            </article>
          ))}
        </div>
      </main>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת חשבון המאמן?</AlertDialogTitle>
            <AlertDialogDescription>
              הפעולה תמחק לצמיתות את החשבון של {toDelete?.fullName} ואת כל בלוקי האימונים שלו. לא ניתן לשחזר.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmDelete()}>מחיקה</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
