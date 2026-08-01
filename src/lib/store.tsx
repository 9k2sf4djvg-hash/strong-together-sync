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

function mkSet(
  repsMin: number | null,
  repsMax: number | null,
  weightMin: number | null,
  weightMax: number | null,
  rpeMin: number | null,
  rpeMax: number | null,
): WorkoutSet {
  return {
    id: uid(),
    hasReps: repsMin != null || repsMax != null,
    repsMin,
    repsMax,
    hasWeight: weightMin != null || weightMax != null,
    weightMin,
    weightMax,
    hasRpe: rpeMin != null || rpeMax != null,
    rpeMin,
    rpeMax,
    actualReps: null,
    actualWeight: null,
    actualRpe: null,
    videoId: null,
  };
}

type LegacySet = WorkoutSet & { reps?: number | null; weight?: number | null; rpe?: number | null };

/** Migrates sets saved before ranges/toggles existed. */
function migrateState(s: AppState): AppState {
  return {
    ...s,
    blocks: (s.blocks ?? []).map((b) => ({
      ...b,
      weeks: b.weeks.map((w) => ({
        ...w,
        workouts: w.workouts.map((wo) => ({
          ...wo,
          exercises: wo.exercises.map((e) => ({
            ...e,
            sets: e.sets.map((raw) => {
              const set = raw as LegacySet;
              if ("hasReps" in set && set.hasReps !== undefined) return set as WorkoutSet;
              const { reps, weight, rpe, ...rest } = set;
              return {
                ...rest,
                hasReps: reps != null,
                repsMin: reps ?? null,
                repsMax: reps ?? null,
                hasWeight: weight != null,
                weightMin: weight ?? null,
                weightMax: weight ?? null,
                hasRpe: rpe != null,
                rpeMin: rpe ?? null,
                rpeMax: rpe ?? null,
                actualReps: null,
                actualWeight: null,
              } as WorkoutSet;
            }),
          })),
        })),
      })),
    })),
  };
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
            sets: [mkSet(5, 8, 90, 100, 7, 9), mkSet(5, 8, 90, 100, 7, 9), mkSet(3, 5, 100, 110, 8, 9)],
          },
          {
            id: uid(),
            name: "Leg Press",
            coachNotes: "",
            sets: [mkSet(8, 12, 140, 150, 7, 8), mkSet(8, 12, 140, 150, 7, 9)],
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
            sets: [mkSet(6, 8, 65, 70, 7, 8), mkSet(6, 8, 65, 70, 8, 9)],
          },
          {
            id: uid(),
            name: "Barbell Row",
            coachNotes: "",
            sets: [mkSet(8, 10, 55, 60, 7, 8), mkSet(8, 10, 55, 60, 7, 9)],
          },
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
  hydrated: boolean;
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
      if (s) setRaw(migrateState(JSON.parse(s) as AppState));
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
      hydrated,
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
    [hydrated, state, setState, user, login, logout, theme, updateBlock, notify],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

export function emptyExercise(name: string): Exercise {
  return { id: uid(), name, coachNotes: "", sets: [mkSet(8, 12, 40, 50, 7, 8)] };
}

export function newSet(): WorkoutSet {
  return mkSet(8, 12, 40, 50, 7, 8);
}
