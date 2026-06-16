"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Bed, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/layout/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getWorkoutDisplayType } from "@/lib/constants";
import { formatDate, signedNumber } from "@/lib/utils";
import { getCurrentUserEmail } from "@/services/auth";
import { getPreviousWorkoutByType, getWorkoutDetails } from "@/services/workouts";
import type { ExerciseLog, WorkoutWithLogs } from "@/types/domain";

function setLabel(log?: ExerciseLog) {
  if (!log) return "--";
  return `${Number(log.weight_used).toFixed(1)}kg x ${log.reps_completed}`;
}

export default function WorkoutDetailsPage() {
  const params = useParams<{ id: string }>();
  const [workout, setWorkout] = useState<WorkoutWithLogs | null>(null);
  const [previous, setPrevious] = useState<WorkoutWithLogs | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [details, email] = await Promise.all([getWorkoutDetails(params.id), getCurrentUserEmail()]);
        setUserEmail(email);
        setWorkout(details);
        if (!details.is_rest_day) {
          setPrevious(await getPreviousWorkoutByType(details.workout_type, details.id));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load workout.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [params.id]);

  const grouped = useMemo(() => {
    const map = new Map<string, { name: string; logs: ExerciseLog[] }>();
    workout?.exercise_logs.forEach((log) => {
      const name = log.exercises?.name ?? "Exercise";
      const group = map.get(log.exercise_id) ?? { name, logs: [] };
      group.logs.push(log);
      map.set(log.exercise_id, group);
    });

    return Array.from(map.entries()).map(([exerciseId, group]) => ({
      exerciseId,
      name: group.name,
      logs: group.logs.sort((a, b) => a.set_number - b.set_number)
    }));
  }, [workout]);

  function previousFor(exerciseId: string, setNumber: number) {
    return previous?.exercise_logs.find((log) => log.exercise_id === exerciseId && log.set_number === setNumber);
  }

  return (
    <AppShell>
      <Link href="/workouts" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted transition hover:text-white">
        <ArrowLeft className="h-4 w-4" />
        Back to workouts
      </Link>

      {error ? <p className="mb-6 rounded-md border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</p> : null}

      {loading ? (
        <Skeleton className="h-80" />
      ) : workout ? (
        <>
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted">Workout Details</p>
                {workout.is_rest_day ? <Badge>Recovery</Badge> : <Badge>{getWorkoutDisplayType(workout.workout_type, userEmail)}</Badge>}
              </div>
              <h1 className="mt-3 text-3xl font-semibold tracking-normal text-white md:text-5xl">{formatDate(workout.workout_date)}</h1>
            </div>
          </div>

          {workout.is_rest_day ? (
            <Card>
              <CardContent className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
                <div className="grid h-14 w-14 place-items-center rounded-md bg-white text-black">
                  <Bed className="h-7 w-7" />
                </div>
                <h2 className="mt-6 text-2xl font-semibold">Rest Day logged</h2>
                <p className="mt-3 max-w-sm text-sm leading-6 text-muted">
                  Recovery is stored with an automatic date and contributes to dashboard recovery statistics.
                </p>
              </CardContent>
            </Card>
          ) : grouped.length ? (
            <div className="space-y-4">
              {grouped.map((group, index) => (
                <motion.div
                  key={group.exerciseId}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                >
                  <Card>
                    <CardHeader className="flex-row items-center justify-between">
                      <CardTitle>{group.name}</CardTitle>
                      <TrendingUp className="h-5 w-5 text-white/50" />
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {group.logs.map((log) => {
                        const last = previousFor(group.exerciseId, log.set_number);
                        const progress = last ? Number(log.weight_used) - Number(last.weight_used) : null;
                        return (
                          <div
                            key={log.id}
                            className="grid gap-3 rounded-md border border-white/10 bg-black/30 p-3 sm:grid-cols-[5rem_1fr_1fr_7rem] sm:items-center"
                          >
                            <p className="font-semibold text-white">Set {log.set_number}</p>
                            <div>
                              <p className="text-xs uppercase tracking-[0.18em] text-muted">Last Session</p>
                              <p className="mt-1 text-sm text-white">{setLabel(last)}</p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-[0.18em] text-muted">Current</p>
                              <p className="mt-1 text-sm text-white">{setLabel(log)}</p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-[0.18em] text-muted">Progress</p>
                              <p className="mt-1 text-sm text-white">{progress === null ? "--" : signedNumber(progress, "kg")}</p>
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <EmptyState title="No sets logged">This workout exists, but no set rows have been saved yet.</EmptyState>
          )}
        </>
      ) : null}
    </AppShell>
  );
}
