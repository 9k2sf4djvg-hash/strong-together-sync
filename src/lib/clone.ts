import { uid } from "./store";
import type { Week } from "./types";

/** Duplicates a week's structure, clearing trainee results and flagging sets for update. */
export function cloneWeek(week: Week, weekNumber: number, flagUpdate = true): Week {
  return {
    weekNumber,
    published: false,
    reviewed: false,
    workouts: week.workouts.map((w) => ({
      ...w,
      id: uid(),
      completedAt: null,
      exercises: w.exercises.map((e) => ({
        ...e,
        id: uid(),
        skipped: false,
        skipReason: "",
        sets: e.sets.map((s) => ({
          ...s,
          id: uid(),
          actualReps: null,
          actualWeight: null,
          actualRpe: null,
          videoId: null,
          note: "",
          skipped: false,
          skipReason: "",
          needsUpdate: flagUpdate,
        })),
      })),
    })),
  };
}
