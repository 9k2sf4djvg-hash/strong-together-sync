export type Role = "coach" | "trainee";

export type CoachStatus = "pending" | "approved" | "rejected" | "blocked";

export interface CoachApplication {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  specialty: string;
  yearsExperience: number;
  bio: string;
  credentialPath: string | null;
  applicantNotes: string;
  status: CoachStatus;
  adminNotes: string;
  rejectionReason: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export const COACH_SPECIALTIES = [
  "כוח ופאוורליפטינג",
  "בניית שריר",
  "כושר גופני כללי",
  "אתלטיקה וספורט תחרותי",
  "שיקום ופציעות",
  "אימון נשים",
] as const;

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
  "סקוואט (Squat)",
  "סקוואט קדמי (Front Squat)",
  "לחיצת רגליים (Leg Press)",
  "מכרעים (Lunges)",
  "האק סקוואט (Hack Squat)",
  "דדליפט (Deadlift)",
  "דדליפט רומני (RDL)",
  "כפיפת ברכיים (Leg Curl)",
  "פשיטת ברכיים (Leg Extension)",
  "היפ ת'ראסט (Hip Thrust)",
  "עליות עגלים (Calf Raise)",
  "לחיצת חזה (Bench Press)",
  "לחיצת חזה בשיפוע (Incline Press)",
  "מקבילים (Dips)",
  "פרפר (Chest Fly)",
  "לחיצת כתפיים (Overhead Press)",
  "הרחקת כתפיים לצדדים (Lateral Raise)",
  "מתח (Pull Up)",
  "חתירה במוט (Barbell Row)",
  "חתירה בפולי (Seated Row)",
  "פולי עליון (Lat Pulldown)",
  "כפיפת מרפקים (Biceps Curl)",
  "פשיטת מרפקים בפולי (Triceps Pushdown)",
  "פלאנק (Plank)",
  "כפיפות בטן (Crunch)",
];
