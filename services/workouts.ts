import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getCurrentUserId } from "@/services/auth";
import type { Exercise, ExerciseLog, Workout, WorkoutType, WorkoutWithLogs } from "@/types/domain";

const hiddenExercises = new Set(["Push A::Cable Crossover (Low to High)"]);

export type SetInput = {
  exercise_id: string;
  set_number: number;
  weight_used: number;
  reps_completed: number;
};

export async function getExercises(workoutType: WorkoutType) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("exercises")
    .select("*")
    .eq("workout_type", workoutType)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data as Exercise[]).filter((exercise) => !hiddenExercises.has(`${exercise.workout_type}::${exercise.name}`));
}

export async function getWorkouts() {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("workouts")
    .select("*")
    .order("workout_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as Workout[];
}

export async function getWorkoutDetails(id: string) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("workouts")
    .select("*, exercise_logs(*, exercises(*))")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as unknown as WorkoutWithLogs;
}

export async function getPreviousWorkoutByType(workoutType: WorkoutType, beforeWorkoutId?: string) {
  const supabase = getSupabaseBrowserClient();
  const query = supabase
    .from("workouts")
    .select("*, exercise_logs(*, exercises(*))")
    .eq("workout_type", workoutType)
    .eq("is_rest_day", false)
    .order("workout_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(beforeWorkoutId ? 2 : 1);

  const { data, error } = await query;
  if (error) throw error;

  const rows = data as unknown as WorkoutWithLogs[];
  return beforeWorkoutId ? rows.find((row) => row.id !== beforeWorkoutId) ?? null : rows[0] ?? null;
}

export async function createWorkout(workoutType: Exclude<WorkoutType, "Rest Day">) {
  const supabase = getSupabaseBrowserClient();
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("workouts")
    .insert({
      user_id: userId,
      workout_type: workoutType,
      is_rest_day: false
    })
    .select()
    .single();

  if (error) throw error;
  return data as Workout;
}

export async function createRestDay() {
  const supabase = getSupabaseBrowserClient();
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("workouts")
    .insert({
      user_id: userId,
      workout_type: "Rest Day",
      is_rest_day: true
    })
    .select()
    .single();

  if (error) throw error;
  return data as Workout;
}

export async function upsertExerciseLogs(workoutId: string, rows: SetInput[]) {
  const supabase = getSupabaseBrowserClient();
  const payload = rows.map((row) => ({
    workout_id: workoutId,
    exercise_id: row.exercise_id,
    set_number: row.set_number,
    weight_used: row.weight_used,
    reps_completed: row.reps_completed
  }));

  const { data, error } = await supabase
    .from("exercise_logs")
    .upsert(payload, { onConflict: "workout_id,exercise_id,set_number" })
    .select();

  if (error) throw error;
  return data as ExerciseLog[];
}

export async function deleteWorkout(id: string) {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from("workouts").delete().eq("id", id);

  if (error) throw error;
}
