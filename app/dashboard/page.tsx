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
      className="flex min-h-80 flex-col items-center justify-center rounded-lg border border-white/10 bg-[#20292e] px-4 py-8 shadow-premium"
    >
      <div className="relative grid h-64 w-64 place-items-center">
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
          <p className="max-w-[11rem] text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">{label}</p>
          <p className="mt-2 text-5xl font-semibold leading-none tracking-normal text-white md:text-6xl">{value}</p>
          <p className="mt-3 text-sm font-medium text-white/50">{detail}</p>
        </div>
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
          <div className="grid gap-4 md:grid-cols-3">
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
