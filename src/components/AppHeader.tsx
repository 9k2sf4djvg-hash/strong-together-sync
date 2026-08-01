import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, Dumbbell, LogOut, Moon, Sun } from "lucide-react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export function AppHeader({ subtitle }: { subtitle?: string }) {
  const { user, logout, theme, toggleTheme, state } = useStore();
  const navigate = useNavigate();
  const myNotifications = state.notifications.filter((n) => n.to === (user?.role ?? "coach"));

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/70 shadow-[0_8px_32px_oklch(0_0_0/0.25)] backdrop-blur-xl">
      <div className="mx-auto grid max-w-5xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <span className="gradient-surface grid size-9 shrink-0 place-items-center rounded-xl shadow-[0_0_20px_color-mix(in_oklab,var(--primary)_45%,transparent)] transition-transform duration-300 hover:rotate-12">
            <Dumbbell className="size-5" />
          </span>
          <span className="min-w-0">
            <span className="gradient-text block truncate text-base font-extrabold tracking-tight">
              Strong Together
            </span>
            {subtitle ? (
              <span className="block truncate text-xs text-muted-foreground">{subtitle}</span>
            ) : null}
          </span>
        </Link>
        <div className="flex shrink-0 items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="התראות" className="press relative">
                <Bell className="size-5" />
                {myNotifications.length > 0 && (
                  <Badge className="absolute -top-1 -left-1 h-4 min-w-4 animate-pulse justify-center px-1 text-[10px]">
                    {myNotifications.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-72 border-border bg-popover/90 backdrop-blur-xl">
              <DropdownMenuLabel>התראות</DropdownMenuLabel>
              {myNotifications.length === 0 && (
                <DropdownMenuItem disabled>אין התראות חדשות</DropdownMenuItem>
              )}
              {myNotifications.slice(0, 8).map((n) => (
                <DropdownMenuItem key={n.id} className="whitespace-normal text-sm">
                  {n.text}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="icon" aria-label="החלף מצב תצוגה" className="press" onClick={toggleTheme}>
            {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </Button>
          {user && (
            <>
              <span
                aria-hidden
                className="gradient-surface ms-1 hidden size-8 place-items-center rounded-full text-xs font-bold sm:grid"
              >
                {user.name.slice(0, 1)}
              </span>
              <Button
                variant="ghost"
                size="icon"
                aria-label="התנתקות"
                className="press"
                onClick={() => {
                  logout();
                  navigate({ to: "/" });
                }}
              >
                <LogOut className="size-5" />
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
