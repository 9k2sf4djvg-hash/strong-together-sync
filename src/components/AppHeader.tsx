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
    <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur">
      <div className="mx-auto grid max-w-5xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Dumbbell className="size-5" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-base font-bold">Strong Together</span>
            {subtitle ? (
              <span className="block truncate text-xs text-muted-foreground">{subtitle}</span>
            ) : null}
          </span>
        </Link>
        <div className="flex shrink-0 items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="התראות" className="relative">
                <Bell className="size-5" />
                {myNotifications.length > 0 && (
                  <Badge className="absolute -top-1 -left-1 h-4 min-w-4 justify-center px-1 text-[10px]">
                    {myNotifications.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-72">
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
          <Button variant="ghost" size="icon" aria-label="החלף מצב תצוגה" onClick={toggleTheme}>
            {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </Button>
          {user && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="התנתקות"
              onClick={() => {
                logout();
                navigate({ to: "/" });
              }}
            >
              <LogOut className="size-5" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
