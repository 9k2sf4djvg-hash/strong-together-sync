import type { Week } from "./types";

export const DEMO_PASSWORD = "StrongDemo!2026";
export const DEMO_COACH_EMAIL = "demo.coach@strongtogether.app";
export const DEMO_TRAINEE_EMAIL = "demo.trainee@strongtogether.app";

const uid = () => crypto.randomUUID();

function set(reps: [number, number] | null, weight: number | null, rpe: number | null) {
  return {
    id: uid(),
    hasReps: reps !== null,
    repsMin: reps ? reps[0] : null,
    repsMax: reps ? reps[1] : null,
    hasWeight: weight !== null,
    weightMin: weight,
    weightMax: weight,
    hasRpe: rpe !== null,
    rpeMin: rpe,
    rpeMax: rpe === null ? null : rpe + 1,
  };
}

export function demoWeeks(): Week[] {
  const build = (weekNumber: number, published: boolean): Week => ({
    weekNumber,
    published,
    workouts: [
      {
        id: uid(),
        title: "Lower Body",
        exercises: [
          { id: uid(), name: "Back Squat", coachNotes: "עומק מלא, טמפו מבוקר", sets: [set([5, 8], 80, 7), set([5, 8], 85, 8), set([5, 8], 85, 8)] },
          { id: uid(), name: "Romanian Deadlift", sets: [set([8, 10], 60, 7), set([8, 10], 65, 8)] },
          { id: uid(), name: "Leg Curl", sets: [set([12, 15], 35, 8), set([12, 15], 35, 8)] },
        ],
      },
      {
        id: uid(),
        title: "Upper Body",
        exercises: [
          { id: uid(), name: "Bench Press", coachNotes: "שכמות אסופות", sets: [set([5, 8], 60, 7), set([5, 8], 62.5, 8), set([5, 8], 62.5, 8)] },
          { id: uid(), name: "Barbell Row", sets: [set([8, 10], 50, 8), set([8, 10], 50, 8)] },
          { id: uid(), name: "Lateral Raise", sets: [set([12, 15], 8, null), set([12, 15], 8, null)] },
        ],
      },
      {
        id: uid(),
        title: "Full Body",
        exercises: [
          { id: uid(), name: "Deadlift", sets: [set([3, 5], 100, 8), set([3, 5], 100, 8)] },
          { id: uid(), name: "Pull Up", sets: [set(null, null, 8), set(null, null, 9)] },
        ],
      },
    ],
  });
  return [build(1, true), build(2, false), build(3, false), build(4, false)];
}
