import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Clock,
  FileUp,
  Loader2,
  ShieldX,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/lib/store";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { COACH_SPECIALTIES } from "@/lib/types";

export const Route = createFileRoute("/coach/apply")({
  head: () => ({
    meta: [
      { title: "אימות מאמן — Strong Together" },
      {
        name: "description",
        content: "תהליך אימות בן ארבעה שלבים למאמנים: פרטים אישיים, ניסיון מקצועי, תעודות ואישור מנהל.",
      },
      { property: "og:title", content: "אימות מאמן — Strong Together" },
      { property: "og:description", content: "הגשת בקשת אימות מאמן ואישור על ידי מנהל המערכת." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CoachApplyPage,
});

const MAX_FILE = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "application/pdf"];

const schema = z.object({
  fullName: z.string().trim().min(2, "שם מלא חייב להכיל לפחות 2 תווים").max(80),
  email: z.string().trim().email("אימייל לא תקין").max(255),
  specialty: z.string().trim().min(1, "יש לבחור התמחות"),
  yearsExperience: z.number().int().min(0, "ערך לא תקין").max(60, "ערך לא תקין"),
  bio: z.string().trim().min(30, "ספר על עצמך לפחות 30 תווים").max(1000),
  applicantNotes: z.string().trim().max(500),
});

const STEPS = ["פרטים אישיים", "רקע מקצועי", "תעודות", "סיכום ושליחה"];

function CoachApplyPage() {
  const { user, hydrated, loading, coachApp, refresh } = useStore();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    specialty: "",
    yearsExperience: "",
    bio: "",
    applicantNotes: "",
  });

  useEffect(() => {
    if (!hydrated || loading) return;
    if (!user) navigate({ to: "/" });
    else if (user.role !== "coach") navigate({ to: "/trainee" });
  }, [hydrated, loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    setForm((f) => ({
      ...f,
      fullName: f.fullName || coachApp?.fullName || user.name,
      email: f.email || coachApp?.email || user.email,
      specialty: f.specialty || coachApp?.specialty || "",
      yearsExperience: f.yearsExperience || String(coachApp?.yearsExperience ?? ""),
      bio: f.bio || coachApp?.bio || "",
      applicantNotes: f.applicantNotes || coachApp?.applicantNotes || "",
    }));
  }, [user, coachApp]);

  const parsed = useMemo(
    () =>
      schema.safeParse({
        ...form,
        yearsExperience: Number(form.yearsExperience || "0"),
      }),
    [form],
  );

  const stepError = (fields: string[]) => {
    if (parsed.success) return null;
    const issue = parsed.error.issues.find((i) => fields.includes(String(i.path[0])));
    return issue?.message ?? null;
  };

  const next = () => {
    const groups = [["fullName", "email"], ["specialty", "yearsExperience", "bio"], []];
    const err = stepError(groups[step] ?? []);
    if (err) {
      toast.error(err);
      return;
    }
    setStep((s) => Math.min(s + 1, 3));
  };

  const pickFile = (f: File | null) => {
    if (!f) {
      setFile(null);
      return;
    }
    if (!ALLOWED.includes(f.type)) {
      toast.error("קובץ חייב להיות JPG, PNG או PDF");
      return;
    }
    if (f.size > MAX_FILE) {
      toast.error("גודל מקסימלי 5MB");
      return;
    }
    setFile(f);
  };

  const submit = async () => {
    if (!user) return;
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "יש למלא את כל השדות");
      return;
    }
    setBusy(true);
    let credentialPath = coachApp?.credentialPath ?? null;
    if (file) {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "dat";
      const path = `${user.id}/credential-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("coach-credentials")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) {
        setBusy(false);
        toast.error("העלאת הקובץ נכשלה");
        return;
      }
      credentialPath = path;
    }

    const row = {
      user_id: user.id,
      full_name: parsed.data.fullName,
      email: parsed.data.email,
      specialty: parsed.data.specialty,
      years_experience: parsed.data.yearsExperience,
      bio: parsed.data.bio,
      applicant_notes: parsed.data.applicantNotes,
      credential_path: credentialPath,
      status: "pending" as const,
      rejection_reason: null,
    };
    const { error } = await supabase.from("coach_applications").upsert(row, { onConflict: "user_id" });
    setBusy(false);
    if (error) {
      toast.error("שליחת הבקשה נכשלה");
      return;
    }
    await refresh();
    toast.success("הבקשה נשלחה לאישור מנהל");
  };

  if (!user) return null;

  if (coachApp && (coachApp.status === "pending" || coachApp.status === "blocked" || coachApp.status === "approved")) {
    return <StatusScreen />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="animate-fade-up mb-6 text-center">
          <span className="gradient-brand glow-primary mx-auto mb-3 grid size-14 place-items-center rounded-2xl text-white">
            <BadgeCheck className="size-6" />
          </span>
          <h1 className="text-2xl font-extrabold sm:text-3xl">אימות מאמן</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            כדי לאמן מתאמנים במערכת יש להשלים אימות ולקבל אישור מנהל.
          </p>
        </div>

        {coachApp?.status === "rejected" && (
          <div className="mb-4 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm">
            <p className="flex items-center gap-2 font-semibold text-destructive">
              <ShieldX className="size-4" /> הבקשה הקודמת נדחתה
            </p>
            {coachApp.rejectionReason && <p className="mt-1 text-muted-foreground">{coachApp.rejectionReason}</p>}
            <p className="mt-1 text-muted-foreground">ניתן לתקן את הפרטים ולשלוח שוב.</p>
          </div>
        )}

        <ol className="mb-6 flex items-center gap-2">
          {STEPS.map((label, i) => (
            <li key={label} className="flex flex-1 flex-col items-center gap-1">
              <span
                className={`grid size-8 place-items-center rounded-full text-xs font-bold transition ${
                  i <= step ? "gradient-brand text-white" : "bg-muted text-muted-foreground"
                }`}
              >
                {i + 1}
              </span>
              <span className="text-center text-[11px] text-muted-foreground">{label}</span>
            </li>
          ))}
        </ol>

        <div className="glass-card animate-fade-up space-y-4 rounded-3xl p-5">
          {step === 0 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="fullName">שם מלא</Label>
                <Input
                  id="fullName"
                  value={form.fullName}
                  maxLength={80}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cemail">אימייל ליצירת קשר</Label>
                <Input
                  id="cemail"
                  type="email"
                  dir="ltr"
                  value={form.email}
                  maxLength={255}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label>תחום התמחות</Label>
                <Select value={form.specialty} onValueChange={(v) => setForm({ ...form, specialty: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר התמחות" />
                  </SelectTrigger>
                  <SelectContent>
                    {COACH_SPECIALTIES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="years">שנות ניסיון</Label>
                <Input
                  id="years"
                  type="number"
                  min={0}
                  max={60}
                  dir="ltr"
                  value={form.yearsExperience}
                  onChange={(e) => setForm({ ...form, yearsExperience: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">קצת עליי ({form.bio.trim().length}/1000)</Label>
                <Textarea
                  id="bio"
                  rows={5}
                  maxLength={1000}
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  placeholder="ניסיון, הסמכות, סוגי מתאמנים שאתה מלווה..."
                />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="cred">תעודת הסמכה (JPG, PNG או PDF, עד 5MB)</Label>
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground transition hover:border-primary hover:text-foreground">
                  <FileUp className="size-4" />
                  {file ? file.name : coachApp?.credentialPath ? "קובץ קיים — ניתן להחליף" : "בחר קובץ"}
                  <input
                    id="cred"
                    type="file"
                    className="hidden"
                    accept="image/jpeg,image/png,application/pdf"
                    onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
                  />
                </label>
                <p className="text-xs text-muted-foreground">
                  הקובץ נשמר באחסון פרטי וזמין לצפייה למנהלי המערכת בלבד.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">הערות למנהל (אופציונלי)</Label>
                <Textarea
                  id="notes"
                  rows={3}
                  maxLength={500}
                  value={form.applicantNotes}
                  onChange={(e) => setForm({ ...form, applicantNotes: e.target.value })}
                />
              </div>
            </>
          )}

          {step === 3 && (
            <dl className="space-y-2 text-sm">
              <Row label="שם מלא" value={form.fullName} />
              <Row label="אימייל" value={form.email} />
              <Row label="התמחות" value={form.specialty} />
              <Row label="שנות ניסיון" value={form.yearsExperience || "0"} />
              <Row label="תעודה" value={file ? file.name : coachApp?.credentialPath ? "קובץ קיים" : "לא צורפה"} />
              <div className="rounded-xl bg-muted/40 p-3 text-muted-foreground">{form.bio}</div>
              {!file && !coachApp?.credentialPath && (
                <p className="flex items-center gap-2 text-xs text-amber-500">
                  <AlertTriangle className="size-3.5" /> ללא תעודה האישור עלול להתעכב.
                </p>
              )}
            </dl>
          )}

          <div className="flex items-center justify-between gap-2 pt-2">
            <Button variant="outline" disabled={step === 0 || busy} onClick={() => setStep((s) => s - 1)}>
              <ArrowRight className="size-4" /> חזרה
            </Button>
            {step < 3 ? (
              <Button onClick={next}>
                המשך <ArrowLeft className="size-4" />
              </Button>
            ) : (
              <Button onClick={() => void submit()} disabled={busy}>
                {busy ? <Loader2 className="size-4 animate-spin" /> : "שליחת הבקשה"}
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/30 px-3 py-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function StatusScreen() {
  const { coachApp } = useStore();
  const navigate = useNavigate();
  if (!coachApp) return null;

  const map = {
    pending: {
      icon: <Clock className="size-6" />,
      title: "הבקשה ממתינה לאישור",
      text: "מנהל המערכת יבדוק את הפרטים והתעודות שלך. תקבל התראה כשהבקשה תאושר.",
    },
    approved: {
      icon: <CheckCircle2 className="size-6" />,
      title: "החשבון אומת",
      text: "אתה מאמן מאומת ויכול להתחיל לבנות בלוקים למתאמנים שלך.",
    },
    blocked: {
      icon: <ShieldX className="size-6" />,
      title: "החשבון חסום",
      text: coachApp.rejectionReason ?? "החשבון נחסם על ידי מנהל המערכת.",
    },
    rejected: { icon: <ShieldX className="size-6" />, title: "", text: "" },
  } as const;
  const s = map[coachApp.status];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <span className="gradient-brand glow-primary mx-auto mb-4 grid size-16 place-items-center rounded-2xl text-white">
          {s.icon}
        </span>
        <h1 className="text-2xl font-extrabold">{s.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
        {coachApp.status === "approved" && (
          <Button className="mt-6" size="lg" onClick={() => navigate({ to: "/coach" })}>
            מעבר ללוח המאמן
          </Button>
        )}
      </main>
    </div>
  );
}
