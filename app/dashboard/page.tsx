"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity, Flame, Scale, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/layout/empty-state";
import { MetricLineChart } from "@/components/charts/metric-line-chart";
import { WorkoutFrequencyChart } from "@/components/charts/workout-frequency-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getDashboardSummary } from "@/services/dashboard";
import { signedNumber } from "@/lib/utils";

type Summary = Awaited<ReturnType<typeof getDashboardSummary>>;

function clamp(value: number, min = 0, max = 100) {
  return Math.min(Math.max(value, min), max);
}

function MetricRing({
  label,
  value,
  detail,
  progress,
  accent = "#93B5CF"
}: {
  label: string;
  value: string;
  detail: string;
  progress: number;
  accent?: string;
}) {
  const radius = 86;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamp(progress) / 100) * circumference;

  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }}
      className="flex min-h-44 flex-col items-center justify-center px-1 py-3 sm:min-h-64 sm:px-4 sm:py-8"
    >
      <div className="relative grid h-24 w-24 place-items-center min-[390px]:h-28 min-[390px]:w-28 sm:h-48 sm:w-48 lg:h-60 lg:w-60">
        <svg viewBox="0 0 220 220" className="h-full w-full -rotate-90">
          <circle cx="110" cy="110" r={radius} fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="14" />
          <motion.circle
            cx="110"
            cy="110"
            r={radius}
            fill="none"
            stroke={accent}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="text-xl font-semibold leading-none tracking-normal text-white min-[390px]:text-2xl sm:text-4xl lg:text-5xl">
            {value}
          </p>
        </div>
      </div>
      <div className="mt-3 min-h-10 text-center sm:mt-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/55 sm:text-xs sm:tracking-[0.18em]">{label}</p>
        <p className="mt-1 text-[10px] font-medium leading-tight text-white/60 sm:text-sm">{detail}</p>
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setSummary(await getDashboardSummary());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load dashboard.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const weightChange = summary?.latest && summary.previous ? Number(summary.latest.weight) - Number(summary.previous.weight) : 0;
  const bodyFatChange =
    summary?.latest && summary.previous
      ? Number(summary.latest.body_fat_percentage) - Number(summary.previous.body_fat_percentage)
      : 0;

  return (
    <AppShell>
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted">Dashboard</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-normal text-white md:text-5xl">Performance overview</h1>
      </div>

      {error ? <p className="mb-6 rounded-md border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</p> : null}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-80" />
          ))}
        </div>
      ) : summary ? (
        <motion.div initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}>
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <MetricRing
              label="Weight"
              value={summary.latest ? Number(summary.latest.weight).toFixed(2) : "--"}
              detail={summary.previous ? `${signedNumber(weightChange, " kg", 2)} change` : "kg"}
              progress={summary.latest ? clamp((Number(summary.latest.weight) / 120) * 100, 8, 96) : 0}
            />
            <MetricRing
              label="Body Fat"
              value={summary.latest ? `${Number(summary.latest.body_fat_percentage).toFixed(1)}%` : "--"}
              detail={summary.previous ? `${signedNumber(bodyFatChange, "%")} change` : "current percentage"}
              progress={summary.latest ? clamp(100 - Number(summary.latest.body_fat_percentage) * 2.2, 12, 92) : 0}
              accent="#B7BDC1"
            />
            <MetricRing
              label="Training / Rest"
              value={`${summary.totalTrainingDays}/${summary.restDays}`}
              detail={`${summary.workoutsThisMonth} this month | ${summary.streak} streak`}
              progress={
                summary.totalTrainingDays + summary.restDays
                  ? (summary.totalTrainingDays / (summary.totalTrainingDays + summary.restDays)) * 100
                  : 0
              }
              accent="#409BF2"
            />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Weight Trend</CardTitle>
                <Scale className="h-5 w-5 text-white/50" />
              </CardHeader>
              <CardContent>
                {summary.weightTrend.length ? (
                  <MetricLineChart data={summary.weightTrend} dataKey="weight" suffix="kg" />
                ) : (
                  <EmptyState title="No weight data">Add your first weight entry to activate the trend chart.</EmptyState>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Recovery</CardTitle>
                <ShieldCheck className="h-5 w-5 text-white/50" />
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted">Rest Days Logged</p>
                  <p className="mt-2 text-4xl font-semibold">{summary.restDays}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted">Days Since Rest</p>
                  <p className="mt-2 text-4xl font-semibold">{summary.daysSinceRest ?? "--"}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Body Fat Trend</CardTitle>
                <Flame className="h-5 w-5 text-white/50" />
              </CardHeader>
              <CardContent>
                {summary.bodyFatTrend.length ? (
                  <MetricLineChart data={summary.bodyFatTrend} dataKey="bodyFat" suffix="%" />
                ) : (
                  <EmptyState title="No body fat data">Log body fat percentage to see movement over time.</EmptyState>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Workout Frequency</CardTitle>
                <Activity className="h-5 w-5 text-white/50" />
              </CardHeader>
              <CardContent>
                <WorkoutFrequencyChart data={summary.workoutFrequency} />
              </CardContent>
            </Card>
          </div>
        </motion.div>
      ) : null}
    </AppShell>
  );
}
