"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Bed, Check, Dumbbell, Play, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/layout/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { workoutTypes } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import {
  createRestDay,
  createWorkout,
  deleteWorkout,
  getExercises,
  getPreviousWorkoutByType,
  getWorkouts,
  upsertExerciseLogs
} from "@/services/workouts";
import type { Exercise, Workout, WorkoutType, WorkoutWithLogs } from "@/types/domain";

type SetState = Record<string, Record<number, { weight: string; reps: string }>>;

function previousSetLabel(previous: WorkoutWithLogs | null, exerciseId: string, setNumber: number) {
  const row = previous?.exercise_logs.find((log) => log.exercise_id === exerciseId && log.set_number === setNumber);
  if (!row) return "Last: --";
  return `Last: ${Number(row.weight_used).toFixed(1)}kg x ${row.reps_completed}`;
}

export default function WorkoutsPage() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [selectedType, setSelectedType] = useState<Exclude<WorkoutType, "Rest Day">>("Push A");
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
  const [previousWorkout, setPreviousWorkout] = useState<WorkoutWithLogs | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [sets, setSets] = useState<SetState>({});
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function refreshHistory() {
    setWorkouts(await getWorkouts());
  }

  useEffect(() => {
    refreshHistory()
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load workouts."))
      .finally(() => setLoading(false));
  }, []);

  const trainingDays = useMemo(() => workouts.filter((workout) => !workout.is_rest_day).length, [workouts]);
  const restDays = useMemo(() => workouts.filter((workout) => workout.is_rest_day).length, [workouts]);

  async function startWorkout() {
    setError("");
    setStarting(true);

    try {
      const [workout, plan, previous] = await Promise.all([
        createWorkout(selectedType),
        getExercises(selectedType),
        getPreviousWorkoutByType(selectedType)
      ]);
      setActiveWorkout(workout);
      setExercises(plan);
      setPreviousWorkout(previous);
      setSets(
        plan.reduce<SetState>((acc, exercise) => {
          acc[exercise.id] = {};
          for (let setNumber = 1; setNumber <= exercise.sets; setNumber += 1) {
            acc[exercise.id][setNumber] = { weight: "", reps: "" };
          }
          return acc;
        }, {})
      );
      await refreshHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start workout.");
    } finally {
      setStarting(false);
    }
  }

  async function markRestDay() {
    setError("");
    setStarting(true);
    try {
      await createRestDay();
      await refreshHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to mark rest day.");
    } finally {
      setStarting(false);
    }
  }

  function updateSet(exerciseId: string, setNumber: number, field: "weight" | "reps", value: string) {
    setSets((current) => ({
      ...current,
      [exerciseId]: {
        ...current[exerciseId],
        [setNumber]: {
          ...(current[exerciseId]?.[setNumber] ?? { weight: "", reps: "" }),
          [field]: value
        }
      }
    }));
  }

  async function saveWorkout() {
    if (!activeWorkout) return;
    setError("");
    setSaving(true);

    try {
      const rows = Object.entries(sets).flatMap(([exerciseId, exerciseSets]) =>
        Object.entries(exerciseSets)
          .filter(([, values]) => values.weight !== "" && values.reps !== "")
          .map(([setNumber, values]) => ({
            exercise_id: exerciseId,
            set_number: Number(setNumber),
            weight_used: Number(values.weight),
            reps_completed: Number(values.reps)
          }))
      );

      if (!rows.length) throw new Error("Log at least one completed set.");

      await upsertExerciseLogs(activeWorkout.id, rows);
      await refreshHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save workout.");
    } finally {
      setSaving(false);
    }
  }

  async function removeWorkout(id: string) {
    setError("");
    try {
      await deleteWorkout(id);
      await refreshHistory();
      if (activeWorkout?.id === id) setActiveWorkout(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete workout.");
    }
  }

  return (
    <AppShell>
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted">Workout Tracking</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-normal text-white md:text-5xl">Training log</h1>
      </div>

      {error ? <p className="mb-6 rounded-md border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</p> : null}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-40" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[0.74fr_1.26fr]">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Start Today</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-md border border-white/10 bg-black/30 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted">Training</p>
                    <p className="mt-2 text-3xl font-semibold">{trainingDays}</p>
                  </div>
                  <div className="rounded-md border border-white/10 bg-black/30 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted">Rest</p>
                    <p className="mt-2 text-3xl font-semibold">{restDays}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="workout-type">Workout Type</Label>
                  <Select
                    id="workout-type"
                    value={selectedType}
                    onChange={(event) => setSelectedType(event.target.value as Exclude<WorkoutType, "Rest Day">)}
                  >
                    {workoutTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Button onClick={startWorkout} disabled={starting}>
                    <Play className="h-4 w-4" />
                    {starting ? "Starting..." : "Start workout"}
                  </Button>
                  <Button variant="secondary" onClick={markRestDay} disabled={starting}>
                    <Bed className="h-4 w-4" />
                    Rest Day
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Previous Workouts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {workouts.length ? (
                  workouts.map((workout, index) => (
                    <motion.div
                      key={workout.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.45, delay: index * 0.03 }}
                      className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-black/30 p-3"
                    >
                      <Link href={`/workouts/${workout.id}`} className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-white">{workout.workout_type}</p>
                          {workout.is_rest_day ? <Badge>Recovery</Badge> : null}
                        </div>
                        <p className="mt-1 text-sm text-muted">{formatDate(workout.workout_date)}</p>
                      </Link>
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/workouts/${workout.id}`}
                          className="grid h-11 w-11 place-items-center rounded-md text-muted transition hover:bg-white/[0.08] hover:text-white"
                          aria-label="View workout details"
                        >
                          <ArrowRight className="h-5 w-5" />
                        </Link>
                        <Button variant="danger" size="icon" onClick={() => removeWorkout(workout.id)} aria-label="Delete workout">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <EmptyState title="No workouts yet">Start today's session or mark a rest day to begin the history.</EmptyState>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            {activeWorkout ? (
              <Card>
                <CardHeader className="flex-row items-center justify-between">
                  <div>
                    <CardTitle>{activeWorkout.workout_type}</CardTitle>
                    <p className="mt-1 text-sm text-muted">{formatDate(activeWorkout.workout_date)}</p>
                  </div>
                  <Dumbbell className="h-6 w-6 text-white/50" />
                </CardHeader>
                <CardContent className="space-y-4">
                  {exercises.map((exercise, index) => (
                    <motion.div
                      key={exercise.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.04 }}
                      className="rounded-md border border-white/10 bg-black/35 p-4"
                    >
                      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-white">{exercise.name}</h3>
                          <p className="mt-1 text-sm text-muted">
                            {exercise.sets} sets · {exercise.reps} reps
                          </p>
                        </div>
                        <Badge>{exercise.workout_type}</Badge>
                      </div>

                      {exercise.notes ? <p className="mb-4 text-sm leading-6 text-muted">{exercise.notes}</p> : null}

                      <div className="space-y-3">
                        {Array.from({ length: exercise.sets }).map((_, setIndex) => {
                          const setNumber = setIndex + 1;
                          return (
                            <div key={setNumber} className="grid grid-cols-[3.5rem_1fr_1fr] items-end gap-2">
                              <div className="pb-3 text-sm font-semibold text-muted">Set {setNumber}</div>
                              <div className="space-y-1">
                                <Label>Kg</Label>
                                <Input
                                  type="number"
                                  inputMode="decimal"
                                  min="0"
                                  step="0.5"
                                  value={sets[exercise.id]?.[setNumber]?.weight ?? ""}
                                  onChange={(event) => updateSet(exercise.id, setNumber, "weight", event.target.value)}
                                />
                              </div>
                              <div className="space-y-1">
                                <Label>Reps</Label>
                                <Input
                                  type="number"
                                  inputMode="numeric"
                                  min="0"
                                  step="1"
                                  value={sets[exercise.id]?.[setNumber]?.reps ?? ""}
                                  onChange={(event) => updateSet(exercise.id, setNumber, "reps", event.target.value)}
                                />
                              </div>
                              <p className="col-span-3 text-xs text-muted">{previousSetLabel(previousWorkout, exercise.id, setNumber)}</p>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  ))}

                  <Button className="w-full" onClick={saveWorkout} disabled={saving}>
                    <Check className="h-4 w-4" />
                    {saving ? "Saving..." : "Save logged sets"}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <EmptyState title="Ready when you are">Choose a split to load the full exercise plan and log every set separately.</EmptyState>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
