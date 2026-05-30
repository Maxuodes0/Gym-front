import { formatShortDate } from "@/lib/utils";
import { getWeightLogs } from "@/services/weights";
import { getWorkouts } from "@/services/workouts";
import type { ChartPoint, Workout } from "@/types/domain";

function daysBetween(date: Date, end: Date) {
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor((end.setHours(0, 0, 0, 0) - date.setHours(0, 0, 0, 0)) / oneDay);
}

function buildFrequency(workouts: Workout[]): ChartPoint[] {
  const counts = new Map<string, number>();
  const now = new Date();

  for (let index = 5; index >= 0; index -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    counts.set(key, 0);
  }

  workouts.forEach((workout) => {
    if (workout.is_rest_day) return;
    const date = new Date(workout.workout_date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  return Array.from(counts.entries()).map(([key, value]) => {
    const [year, month] = key.split("-").map(Number);
    const date = new Date(year, month - 1, 1);
    return {
      date: key,
      label: new Intl.DateTimeFormat("en", { month: "short" }).format(date),
      workouts: value
    };
  });
}

function currentStreak(workouts: Workout[]) {
  const trainingDays = new Set(workouts.filter((w) => !w.is_rest_day).map((w) => w.workout_date));
  let cursor = new Date();
  let streak = 0;

  while (trainingDays.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export async function getDashboardSummary() {
  const [weights, workouts] = await Promise.all([getWeightLogs(), getWorkouts()]);
  const latest = weights.at(-1);
  const previous = weights.at(-2);
  const now = new Date();

  const workoutsThisMonth = workouts.filter((workout) => {
    const date = new Date(workout.workout_date);
    return !workout.is_rest_day && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;

  const totalTrainingDays = new Set(workouts.filter((w) => !w.is_rest_day).map((w) => w.workout_date)).size;
  const restDays = workouts.filter((w) => w.is_rest_day).length;
  const lastRest = workouts.find((w) => w.is_rest_day);
  const daysSinceRest = lastRest ? daysBetween(new Date(lastRest.workout_date), new Date()) : null;

  return {
    latest,
    previous,
    workoutsThisMonth,
    totalTrainingDays,
    streak: currentStreak(workouts),
    restDays,
    daysSinceRest,
    weightTrend: weights.map((log) => ({
      date: log.created_at,
      label: formatShortDate(log.created_at),
      weight: Number(log.weight)
    })),
    bodyFatTrend: weights.map((log) => ({
      date: log.created_at,
      label: formatShortDate(log.created_at),
      bodyFat: Number(log.body_fat_percentage)
    })),
    workoutFrequency: buildFrequency(workouts)
  };
}
