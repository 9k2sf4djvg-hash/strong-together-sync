import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Dumbbell } from "lucide-react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppHeader } from "@/components/AppHeader";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Strong Together — ניהול אימונים למאמנים ומתאמנים" },
      {
        name: "description",
        content:
          "Strong Together: בניית בלוקי אימונים, מעקב RPE והערות בין מאמן למתאמן, בעברית ובממשק מותאם לנייד.",
      },
      { property: "og:title", content: "Strong Together — ניהול אימונים" },
      {
        property: "og:description",
        content: "תכנון בלוקי אימונים למאמנים וביצוע אימונים עם מעקב RPE למתאמנים.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { login, user, hydrated } = useStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState("coach@example.com");
  const [password, setPassword] = useState("demo1234");
  const [error, setError] = useState("");

  useEffect(() => {
    if (hydrated && user) navigate({ to: user.role === "coach" ? "/coach" : "/trainee" });
  }, [hydrated, user, navigate]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return setError("יש להזין סיסמה");
    const found = login(email);
    if (!found) return setError("משתמש לא נמצא — נסה coach@example.com או dan@example.com");
    setError("");
    toast.success(`ברוך הבא, ${found.name}`);
    navigate({ to: found.role === "coach" ? "/coach" : "/trainee" });
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
        <form
          onSubmit={submit}
          className="glass-card animate-fade-up space-y-4 rounded-3xl p-5"
          style={{ animationDelay: "60ms" }}
        >
          <div className="space-y-2">
            <Label htmlFor="email">אימייל</Label>
            <Input
              id="email"
              type="email"
              dir="ltr"
              placeholder="הזן אימייל"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">סיסמה</Label>
            <Input
              id="password"
              type="password"
              dir="ltr"
              placeholder="הזן סיסמה"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" size="lg" className="w-full">
            כניסה
          </Button>
        </form>
        <div
          className="animate-fade-up rounded-2xl border border-dashed border-primary/30 p-4 text-sm text-muted-foreground"
          style={{ animationDelay: "120ms" }}
        >
          <p className="mb-2 font-semibold text-foreground">משתמשי דמו</p>
          <button
            type="button"
            className="block w-full rounded-lg px-2 py-1 text-start hover:bg-muted"
            onClick={() => setEmail("coach@example.com")}
          >
            מאמן: coach@example.com
          </button>
          <button
            type="button"
            className="block w-full rounded-lg px-2 py-1 text-start hover:bg-muted"
            onClick={() => setEmail("dan@example.com")}
          >
            מתאמן: dan@example.com
          </button>
        </div>
      </main>
    </div>
  );
}
