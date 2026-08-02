import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { KeyRound, Loader2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppHeader } from "@/components/AppHeader";

export const Route = createFileRoute("/connect")({
  head: () => ({
    meta: [
      { title: "חיבור למאמן — Strong Together" },
      {
        name: "description",
        content: "הזן את קוד ההזמנה בן 6 התווים שקיבלת מהמאמן כדי להתחבר אליו ולקבל את תוכנית האימונים.",
      },
      { property: "og:title", content: "חיבור למאמן — Strong Together" },
      { property: "og:description", content: "חיבור מתאמן למאמן באמצעות קוד הזמנה אישי." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ConnectPage,
});

function ConnectPage() {
  const { user, hydrated, loading, redeemInviteCode, updateProfile } = useStore();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!hydrated || loading) return;
    if (!user) navigate({ to: "/" });
    else if (user.role === "coach") navigate({ to: "/coach" });
    else if (user.coachId) navigate({ to: "/trainee" });
  }, [hydrated, loading, user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length < 4) {
      toast.error("הזן קוד תקין");
      return;
    }
    setBusy(true);
    const { error } = await redeemInviteCode(code);
    setBusy(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("התחברת למאמן בהצלחה!");
    navigate({ to: "/trainee" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader subtitle="חיבור למאמן" />
      <main className="mx-auto flex max-w-md flex-col gap-6 px-4 py-12">
        <div className="animate-fade-up text-center">
          <span className="gradient-brand glow-primary mx-auto mb-4 grid size-16 place-items-center rounded-2xl text-white">
            <KeyRound className="size-7" />
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight">קוד הזמנה</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            המאמן שלך מייצר קוד בן 6 תווים ושולח לך אותו. הזן אותו כאן כדי להתחבר.
          </p>
        </div>

        <form onSubmit={submit} className="glass-card animate-fade-up space-y-4 rounded-3xl p-5">
          <div className="space-y-2">
            <Label htmlFor="code">הקוד מהמאמן</Label>
            <Input
              id="code"
              dir="ltr"
              placeholder="ABC123"
              maxLength={10}
              className="text-center text-2xl font-bold tracking-[0.4em] uppercase"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
            />
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : "התחבר למאמן"}
          </Button>
        </form>

        <div className="animate-fade-up rounded-2xl border border-dashed border-primary/30 p-4 text-center text-sm text-muted-foreground">
          <p className="mb-2">בעצם אתה מאמן?</p>
          <Button
            variant="outline"
            onClick={async () => {
              await updateProfile({ role: "coach" });
              toast.success("החשבון עודכן למאמן");
              navigate({ to: "/coach" });
            }}
          >
            עבור לחשבון מאמן
          </Button>
        </div>
      </main>
    </div>
  );
}
