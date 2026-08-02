export type Role = "coach" | "trainee";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  coachId?: string | null;
}

export interface WorkoutSet {
  id: string;
  hasReps: boolean;
  repsMin: number | null;
  repsMax: number | null;
  hasWeight: boolean;
  weightMin: number | null;
  weightMax: number | null;
  hasRpe: boolean;
  rpeMin: number | null;
  rpeMax: number | null;
  actualReps?: number | null;
  actualWeight?: number | null;
  actualRpe?: number | null;
  videoId?: string | null;
  videoName?: string | null;
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
  coachId: string;
  traineeId: string;
  name: string;
  totalWeeks: number;
  workoutsPerWeek: number;
  currentWeek: number;
  completedAt?: number | null;
  weeks: Week[];
}

export interface AppNotification {
  id: string;
  to: Role;
  toUserId?: string | undefined;
  fromUserId?: string | undefined;
  text: string;
  createdAt: number;
  read?: boolean;
  dismissed?: boolean;
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
