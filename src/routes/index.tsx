import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Dumbbell, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppHeader } from "@/components/AppHeader";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Strong Together — התחברות למערכת ניהול האימונים" },
      {
        name: "description",
        content:
          "התחברו ל-Strong Together עם גוגל, אפל או אימייל, והתחברו למאמן שלכם באמצעות קוד הזמנה אישי.",
      },
      { property: "og:title", content: "Strong Together — התחברות" },
      {
        property: "og:description",
        content: "התחברות מהירה עם גוגל או אפל, וחיבור בין מאמן למתאמן בקוד הזמנה.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

function AppleIcon() {
  return (
    <svg viewBox="0 0 384 512" className="size-4 fill-current" aria-hidden>
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="size-4" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.2.5 24 .5 14.6.5 6.5 5.9 2.6 13.7l7.8 6c1.9-5.6 7.2-10.2 13.6-10.2z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.6-4.9 7.3l7.6 5.9c4.4-4.1 7.1-10.2 7.1-17.7z" />
      <path fill="#FBBC05" d="M10.4 28.3a14.8 14.8 0 0 1 0-8.6l-7.8-6a23.5 23.5 0 0 0 0 20.6l7.8-6z" />
      <path fill="#34A853" d="M24 47.5c6.2 0 11.5-2 15.4-5.6l-7.6-5.9c-2.1 1.4-4.8 2.3-7.8 2.3-6.4 0-11.7-4.6-13.6-10.2l-7.8 6C6.5 42.1 14.6 47.5 24 47.5z" />
    </svg>
  );
}

function LoginPage() {
  const { user, hydrated, loading, coachApp } = useStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"coach" | "trainee">("trainee");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!hydrated || loading || !user) return;
    if (user.role === "coach")
      navigate({ to: coachApp?.status === "approved" ? "/coach" : "/coach/apply" });
    else if (!user.coachId) navigate({ to: "/connect" });
    else navigate({ to: "/trainee" });
  }, [hydrated, loading, user, coachApp, navigate]);

  const oauth = async (provider: "google" | "apple") => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setBusy(false);
      toast.error("ההתחברות נכשלה, נסה שוב");
      return;
    }
    if (result.redirected) return;
    setBusy(false);
  };

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) {
      toast.error("אימייל או סיסמה שגויים");
      return;
    }
    toast.success("ברוך הבא!");
  };

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("סיסמה חייבת להכיל לפחות 6 תווים");
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { name: name.trim() || email.split("@")[0], role },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (!data.session) toast.success("נשלח אליך מייל אימות — אשר אותו כדי להיכנס");
    else toast.success("החשבון נוצר!");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="mx-auto flex max-w-md flex-col gap-6 px-4 py-12">
        <div className="animate-fade-up text-center">
          <span className="gradient-brand glow-primary mx-auto mb-4 grid size-16 place-items-center rounded-2xl text-white">
            <Dumbbell className="size-7" />
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">התחברות</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            מאמנים בונים בלוקים, מתאמנים מבצעים אימונים.
          </p>
        </div>

        <div className="glass-card animate-fade-up space-y-3 rounded-3xl p-5">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full gap-2"
            disabled={busy}
            onClick={() => void oauth("google")}
          >
            <GoogleIcon /> המשך עם Google
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full gap-2"
            disabled={busy}
            onClick={() => void oauth("apple")}
          >
            <AppleIcon /> המשך עם Apple
          </Button>

          <div className="flex items-center gap-3 py-1 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            או באמצעות אימייל
            <span className="h-px flex-1 bg-border" />
          </div>

          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">כניסה</TabsTrigger>
              <TabsTrigger value="signup">הרשמה</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={signIn} className="space-y-3 pt-3">
                <div className="space-y-2">
                  <Label htmlFor="email">אימייל</Label>
                  <Input id="email" type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">סיסמה</Label>
                  <Input id="password" type="password" dir="ltr" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <Button type="submit" size="lg" className="w-full" disabled={busy}>
                  {busy ? <Loader2 className="size-4 animate-spin" /> : "כניסה"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={signUp} className="space-y-3 pt-3">
                <div className="space-y-2">
                  <Label htmlFor="su-name">שם מלא</Label>
                  <Input id="su-name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="su-email">אימייל</Label>
                  <Input id="su-email" type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="su-password">סיסמה</Label>
                  <Input id="su-password" type="password" dir="ltr" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>אני נרשם בתור</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button type="button" variant={role === "trainee" ? "default" : "outline"} onClick={() => setRole("trainee")}>
                      מתאמן
                    </Button>
                    <Button type="button" variant={role === "coach" ? "default" : "outline"} onClick={() => setRole("coach")}>
                      מאמן
                    </Button>
                  </div>
                </div>
                <Button type="submit" size="lg" className="w-full" disabled={busy}>
                  {busy ? <Loader2 className="size-4 animate-spin" /> : "יצירת חשבון"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>

        <p className="animate-fade-up text-center text-xs text-muted-foreground">
          מתאמן חדש? לאחר ההתחברות תתבקש להזין את קוד ההזמנה שקיבלת מהמאמן.
          <br />
          מאמן חדש? לאחר ההרשמה תעבור תהליך אימות קצר ואישור מנהל.
          <br />
          <Link to="/admin" className="text-primary hover:underline">
            כניסת מנהל מערכת
          </Link>
        </p>
      </main>
    </div>
  );
}
