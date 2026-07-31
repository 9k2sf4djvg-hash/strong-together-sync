export type Role = "coach" | "trainee";

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
}

export interface WorkoutSet {
  id: string;
  reps: number | null;
  weight: number;
  rpe: number;
  actualRpe?: number | null;
  note?: string;
  skipped?: boolean;
  skipReason?: string;
  needsUpdate?: boolean;
}

export interface Exercise {
  id: string;
  name: string;
  coachNotes?: string;
  skipped?: boolean;
  skipReason?: string;
  sets: WorkoutSet[];
}

export interface Workout {
  id: string;
  title: string;
  exercises: Exercise[];
  completedAt?: number | null;
}

export interface Week {
  weekNumber: number;
  published?: boolean;
  reviewed?: boolean;
  workouts: Workout[];
}

export interface Block {
  id: string;
  coachId: number;
  traineeId: number;
  name: string;
  totalWeeks: number;
  workoutsPerWeek: number;
  currentWeek: number;
  weeks: Week[];
}

export interface AppNotification {
  id: string;
  to: Role;
  text: string;
  createdAt: number;
  read?: boolean;
}

export interface AppState {
  users: User[];
  blocks: Block[];
  notifications: AppNotification[];
}

export const WORKOUT_TITLES = ["Legs", "Upper Body", "Chest", "Back", "Arms", "Shoulders"];

export const EXERCISE_LIBRARY = [
  "Squat",
  "Front Squat",
  "Leg Press",
  "Romanian Deadlift",
  "Deadlift",
  "Bench Press",
  "Incline Dumbbell Press",
  "Overhead Press",
  "Pull Up",
  "Barbell Row",
  "Lat Pulldown",
  "Biceps Curl",
  "Triceps Pushdown",
  "Lateral Raise",
  "Leg Curl",
  "Calf Raise",
];
