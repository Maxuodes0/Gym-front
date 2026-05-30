import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { CardioLog, Exercise, WeightLog, WorkoutWithLogs } from "@/types/domain";

const hiddenExercises = new Set(["Push A::Cable Crossover (Low to High)"]);

function reportDateStamp() {
  return new Date().toISOString().slice(0, 10);
}

function asNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function sheetDate(value: string) {
  return new Date(value).toISOString();
}

export async function downloadUserExcelReport() {
  const supabase = getSupabaseBrowserClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("No authenticated user found.");

  const [profileResult, weightResult, cardioResult, workoutsResult, exercisesResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("weight_logs").select("*").order("created_at", { ascending: true }),
    supabase.from("cardio_logs").select("*").order("created_at", { ascending: true }),
    supabase
      .from("workouts")
      .select("*, exercise_logs(*, exercises(*))")
      .order("workout_date", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase.from("exercises").select("*").order("workout_type", { ascending: true }).order("sort_order", { ascending: true })
  ]);

  const error = profileResult.error ?? weightResult.error ?? cardioResult.error ?? workoutsResult.error ?? exercisesResult.error;
  if (error) throw error;

  const profile = profileResult.data;
  const weightLogs = (weightResult.data ?? []) as WeightLog[];
  const cardioLogs = (cardioResult.data ?? []) as CardioLog[];
  const workouts = (workoutsResult.data ?? []) as unknown as WorkoutWithLogs[];
  const exercises = ((exercisesResult.data ?? []) as Exercise[]).filter(
    (exercise) => !hiddenExercises.has(`${exercise.workout_type}::${exercise.name}`)
  );

  const totalCardioMinutes = cardioLogs.reduce((sum, log) => sum + (asNumber(log.duration_minutes) ?? 0), 0);
  const trainingDays = workouts.filter((workout) => !workout.is_rest_day).length;
  const restDays = workouts.filter((workout) => workout.is_rest_day).length;
  const latestWeight = weightLogs.at(-1);
  const firstWeight = weightLogs.at(0);
  const weightChange =
    latestWeight && firstWeight ? (asNumber(latestWeight.weight) ?? 0) - (asNumber(firstWeight.weight) ?? 0) : null;

  const summaryRows = [
    { metric: "Report generated at", value: new Date().toISOString() },
    { metric: "User", value: profile?.full_name ?? user.user_metadata?.full_name ?? "Xebec" },
    { metric: "Auth email", value: user.email ?? profile?.email ?? "" },
    { metric: "Weight entries", value: weightLogs.length },
    { metric: "Latest weight kg", value: latestWeight ? asNumber(latestWeight.weight) : null },
    { metric: "Total weight change kg", value: weightChange },
    { metric: "Latest body fat percentage", value: latestWeight ? asNumber(latestWeight.body_fat_percentage) : null },
    { metric: "Training sessions", value: trainingDays },
    { metric: "Rest days", value: restDays },
    { metric: "Cardio sessions", value: cardioLogs.length },
    { metric: "Total cardio minutes", value: totalCardioMinutes }
  ];

  const weightRows = weightLogs.map((log, index) => {
    const previous = weightLogs[index - 1];
    return {
      date: sheetDate(log.created_at),
      weight_kg: asNumber(log.weight),
      body_fat_percentage: asNumber(log.body_fat_percentage),
      weight_change_from_previous_kg: previous ? (asNumber(log.weight) ?? 0) - (asNumber(previous.weight) ?? 0) : null,
      body_fat_change_from_previous: previous
        ? (asNumber(log.body_fat_percentage) ?? 0) - (asNumber(previous.body_fat_percentage) ?? 0)
        : null
    };
  });

  const cardioRows = cardioLogs.map((log) => ({
    date: sheetDate(log.created_at),
    machine_type: log.machine_type,
    duration_minutes: asNumber(log.duration_minutes)
  }));

  const workoutRows = workouts.map((workout) => ({
    workout_id: workout.id,
    workout_date: workout.workout_date,
    created_at: sheetDate(workout.created_at),
    workout_type: workout.workout_type,
    is_rest_day: workout.is_rest_day,
    logged_sets: workout.exercise_logs.length
  }));

  const exerciseSetRows = workouts.flatMap((workout) =>
    workout.exercise_logs
      .slice()
      .sort((a, b) => {
        const orderA = a.exercises?.sort_order ?? 999;
        const orderB = b.exercises?.sort_order ?? 999;
        return orderA - orderB || a.set_number - b.set_number;
      })
      .map((log) => ({
        workout_id: workout.id,
        workout_date: workout.workout_date,
        workout_type: workout.workout_type,
        exercise_name: log.exercises?.name ?? "",
        set_number: log.set_number,
        weight_used_kg: asNumber(log.weight_used),
        reps_completed: log.reps_completed,
        planned_sets: log.exercises?.sets ?? null,
        planned_reps: log.exercises?.reps ?? "",
        notes: log.exercises?.notes ?? ""
      }))
  );

  const exercisePlanRows = exercises.map((exercise) => ({
    workout_type: exercise.workout_type,
    exercise_name: exercise.name,
    planned_sets: exercise.sets,
    planned_reps: exercise.reps,
    notes: exercise.notes,
    sort_order: exercise.sort_order
  }));

  const aiContextRows = [
    {
      section: "Purpose",
      note: "Use this workbook to analyze body weight, body fat, cardio, workout consistency, progressive overload, rest days, and plateaus."
    },
    {
      section: "Key questions",
      note: "Explain why weight may be stable, what training/cardio/recovery patterns stand out, and what data is missing for better recommendations."
    },
    {
      section: "Units",
      note: "Weights are in kilograms. Cardio duration is in minutes. Dates are ISO strings unless a database date field is used."
    }
  ];

  const XLSX = await import("xlsx");
  const workbook = XLSX.utils.book_new();

  const append = (name: string, rows: Record<string, unknown>[]) => {
    const sheet = XLSX.utils.json_to_sheet(rows.length ? rows : [{ note: "No data yet" }]);
    XLSX.utils.book_append_sheet(workbook, sheet, name);
  };

  append("Summary", summaryRows);
  append("Weight Logs", weightRows);
  append("Cardio Logs", cardioRows);
  append("Workout Sessions", workoutRows);
  append("Exercise Sets", exerciseSetRows);
  append("Exercise Plan", exercisePlanRows);
  append("AI Context", aiContextRows);

  XLSX.writeFile(workbook, `tura-xebec-report-${reportDateStamp()}.xlsx`, { compression: true });
}
