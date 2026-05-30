export type WorkoutType = "Push A" | "Pull A" | "Legs" | "Push B" | "Pull B" | "Rest Day";

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  updated_at: string;
};

export type WeightLog = {
  id: string;
  user_id: string;
  weight: number;
  body_fat_percentage: number;
  created_at: string;
};

export type Workout = {
  id: string;
  user_id: string;
  workout_type: WorkoutType;
  workout_date: string;
  is_rest_day: boolean;
  created_at: string;
};

export type Exercise = {
  id: string;
  workout_type: WorkoutType;
  name: string;
  sets: number;
  reps: string;
  notes: string | null;
  sort_order: number;
  created_at: string;
};

export type ExerciseLog = {
  id: string;
  workout_id: string;
  exercise_id: string;
  set_number: number;
  weight_used: number;
  reps_completed: number;
  created_at: string;
};

export type WorkoutWithLogs = Workout & {
  exercise_logs: Array<ExerciseLog & { exercises: Exercise | null }>;
};

export type MetricCard = {
  label: string;
  value: string;
  change?: string;
};

export type ChartPoint = {
  date: string;
  label: string;
  weight?: number;
  bodyFat?: number;
  workouts?: number;
};
