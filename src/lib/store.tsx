import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { AppState, Block, Exercise, Role, User, Workout, WorkoutSet } from "./types";

const STATE_KEY = "st_state_v1";
const SESSION_KEY = "st_session_v1";
const THEME_KEY = "st_theme_v1";

export const uid = () => Math.random().toString(36).slice(2, 10);

const users: User[] = [
  { id: 1, name: "אלכס כהן", email: "coach@example.com", role: "coach" },
  { id: 2, name: "דן לוי", email: "dan@example.com", role: "trainee" },
  { id: 3, name: "נועה ברק", email: "noa@example.com", role: "trainee" },
];

function mkSet(reps: number, weight: number, rpe: number): WorkoutSet {
  return { id: uid(), reps, weight, rpe, actualRpe: null };
}

function seedBlock(): Block {
  const week1 = {
    weekNumber: 1,
    published: true,
    reviewed: true,
    workouts: [
      {
        id: uid(),
        title: "Legs",
        exercises: [
          {
            id: uid(),
            name: "Squat",
            coachNotes: "שמור על הגב ישר",
            sets: [mkSet(5, 100, 8), mkSet(5, 100, 8), mkSet(5, 100, 9)],
          },
          {
            id: uid(),
            name: "Leg Press",
            coachNotes: "",
            sets: [mkSet(10, 150, 7), mkSet(10, 150, 8)],
          },
        ],
      },
      {
        id: uid(),
        title: "Upper Body",
        exercises: [
          {
            id: uid(),
            name: "Bench Press",
            coachNotes: "טמפו איטי בירידה",
            sets: [mkSet(6, 70, 8), mkSet(6, 70, 8)],
          },
          { id: uid(), name: "Barbell Row", coachNotes: "", sets: [mkSet(8, 60, 7), mkSet(8, 60, 8)] },
        ],
      },
    ] as Workout[],
  };
  const week2 = {
    weekNumber: 2,
    published: true,
    reviewed: false,
    workouts: week1.workouts.map((w) => ({
      ...w,
      id: uid(),
      exercises: w.exercises.map((e) => ({
        ...e,
        id: uid(),
        sets: e.sets.map((s) => ({ ...s, id: uid(), actualRpe: null, needsUpdate: true })),
      })),
    })),
  };
  return {
    id: uid(),
    coachId: 1,
    traineeId: 2,
    name: "הכנה לקיץ",
    totalWeeks: 8,
    workoutsPerWeek: 2,
    currentWeek: 2,
    weeks: [week1, week2],
  };
}

const initialState = (): AppState => ({
  users,
  blocks: [seedBlock()],
  notifications: [],
});

interface Ctx {
  state: AppState;
  setState: (fn: (s: AppState) => AppState) => void;
  user: User | null;
  login: (email: string) => User | null;
  logout: () => void;
  theme: "dark" | "light";
  toggleTheme: () => void;
  updateBlock: (blockId: string, fn: (b: Block) => Block) => void;
  notify: (to: Role, text: string) => void;
}

const StoreContext = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setRaw] = useState<AppState>(initialState);
  const [user, setUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const s = localStorage.getItem(STATE_KEY);
      if (s) setRaw(JSON.parse(s) as AppState);
      const sess = localStorage.getItem(SESSION_KEY);
      if (sess) setUser(JSON.parse(sess) as User);
      const t = localStorage.getItem(THEME_KEY) as "dark" | "light" | null;
      if (t) setTheme(t);
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STATE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.lang = "he";
    document.documentElement.dir = "rtl";
    if (hydrated) localStorage.setItem(THEME_KEY, theme);
  }, [theme, hydrated]);

  const setState = useCallback((fn: (s: AppState) => AppState) => setRaw(fn), []);

  const login = useCallback(
    (email: string) => {
      const found = state.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
      if (found) {
        setUser(found);
        localStorage.setItem(SESSION_KEY, JSON.stringify(found));
      }
      return found ?? null;
    },
    [state.users],
  );

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
  }, []);

  const updateBlock = useCallback(
    (blockId: string, fn: (b: Block) => Block) =>
      setRaw((s) => ({ ...s, blocks: s.blocks.map((b) => (b.id === blockId ? fn(b) : b)) })),
    [],
  );

  const notify = useCallback(
    (to: Role, text: string) =>
      setRaw((s) => ({
        ...s,
        notifications: [{ id: uid(), to, text, createdAt: Date.now() }, ...s.notifications],
      })),
    [],
  );

  const value = useMemo(
    () => ({
      state,
      setState,
      user,
      login,
      logout,
      theme,
      toggleTheme: () => setTheme((t) => (t === "dark" ? "light" : "dark")),
      updateBlock,
      notify,
    }),
    [state, setState, user, login, logout, theme, updateBlock, notify],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

export function emptyExercise(name: string): Exercise {
  return { id: uid(), name, coachNotes: "", sets: [mkSet(5, 50, 8)] };
}

export function newSet(): WorkoutSet {
  return mkSet(5, 50, 8);
}
