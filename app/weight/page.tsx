"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Edit3, Plus, Trash2, X } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/layout/empty-state";
import { clamp, MetricRing } from "@/components/layout/metric-ring";
import { MetricLineChart } from "@/components/charts/metric-line-chart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { createWeightLog, deleteWeightLog, getWeightLogs, updateWeightLog } from "@/services/weights";
import type { WeightLog } from "@/types/domain";
import { formatDate, formatShortDate, signedNumber } from "@/lib/utils";

function weekOfMonth(date: string) {
  const day = new Date(date).getDate();
  return Math.floor((day - 1) / 7) + 1;
}

export default function WeightPage() {
  const [logs, setLogs] = useState<WeightLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [weight, setWeight] = useState("");
  const [bodyFat, setBodyFat] = useState("");
  const [averageWeek, setAverageWeek] = useState("1");
  const [error, setError] = useState("");

  async function refresh() {
    setLogs(await getWeightLogs());
  }

  useEffect(() => {
    refresh()
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load weight logs."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const latestLog = logs.at(-1);
    if (!latestLog) return;

    const selectedWeekHasEntries = logs.some((log) => weekOfMonth(log.created_at) === Number(averageWeek));
    if (!selectedWeekHasEntries) setAverageWeek(String(weekOfMonth(latestLog.created_at)));
  }, [averageWeek, logs]);

  const latest = logs.at(-1);
  const previous = logs.at(-2);
  const weightChange = latest && previous ? Number(latest.weight) - Number(previous.weight) : 0;
  const bodyFatChange = latest && previous ? Number(latest.body_fat_percentage) - Number(previous.body_fat_percentage) : 0;

  const chartData = useMemo(
    () =>
      logs.map((log) => ({
        date: log.created_at,
        label: formatShortDate(log.created_at),
        weight: Number(log.weight),
        bodyFat: Number(log.body_fat_percentage)
      })),
    [logs]
  );

  const averageWeekData = useMemo(() => {
    const selectedWeek = Number(averageWeek);
    const points = chartData.filter((point) => weekOfMonth(point.date) === selectedWeek);
    const average = points.length ? points.reduce((sum, point) => sum + (point.weight ?? 0), 0) / points.length : 0;

    return { points, average };
  }, [averageWeek, chartData]);

  const weekOptions = [
    { value: "1", label: "First Week" },
    { value: "2", label: "Second Week" },
    { value: "3", label: "Third Week" },
    { value: "4", label: "Fourth Week" },
    { value: "5", label: "Fifth Week" }
  ];

  function startEdit(log: WeightLog) {
    setEditingId(log.id);
    setWeight(String(log.weight));
    setBodyFat(String(log.body_fat_percentage));
  }

  function resetForm() {
    setEditingId(null);
    setWeight("");
    setBodyFat("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);

    try {
      const weightValue = Number(weight);
      const bodyFatValue = Number(bodyFat);

      if (!weightValue || bodyFatValue < 0) throw new Error("Enter valid weight and body fat values.");

      if (editingId) {
        await updateWeightLog(editingId, { weight: weightValue, body_fat_percentage: bodyFatValue });
      } else {
        await createWeightLog(weightValue, bodyFatValue);
      }

      resetForm();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save entry.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    setError("");
    try {
      await deleteWeightLog(id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete entry.");
    }
  }

  return (
    <AppShell>
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted">Weight Tracking</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-normal text-white md:text-5xl">Body metrics</h1>
      </div>

      {error ? <p className="mb-6 rounded-md border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</p> : null}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-32" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Average Weight</CardTitle>
                <p className="mt-1 text-sm text-muted">
                  {averageWeekData.points.length ? `${averageWeekData.average.toFixed(2)} kg average` : "No entries in this week"}
                </p>
              </div>
              <Select className="sm:w-44" value={averageWeek} onChange={(event) => setAverageWeek(event.target.value)}>
                {weekOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                <MetricRing
                  label="Average Weight"
                  value={averageWeekData.points.length ? averageWeekData.average.toFixed(2) : "--"}
                  detail={averageWeekData.points.length ? `${averageWeekData.points.length} entries | kg` : "select another week"}
                  progress={averageWeekData.points.length ? clamp((averageWeekData.average / 120) * 100, 8, 96) : 0}
                  accent="#93B5CF"
                />
                <MetricRing
                  label="Weight"
                  value={latest ? Number(latest.weight).toFixed(2) : "--"}
                  detail={previous ? `${signedNumber(weightChange, " kg", 2)} change` : "kg"}
                  progress={latest ? clamp((Number(latest.weight) / 120) * 100, 8, 96) : 0}
                />
                <MetricRing
                  label="Body Fat"
                  value={latest ? `${Number(latest.body_fat_percentage).toFixed(1)}%` : "--"}
                  detail={previous ? `${signedNumber(bodyFatChange, "%")} change` : "current percentage"}
                  progress={latest ? clamp(100 - Number(latest.body_fat_percentage) * 2.2, 12, 92) : 0}
                  accent="#B7BDC1"
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-[0.78fr_1.22fr]">
            <div className="space-y-4">
              <Card>
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle>{editingId ? "Edit Entry" : "Add Entry"}</CardTitle>
                  {editingId ? (
                    <Button variant="ghost" size="icon" onClick={resetForm} aria-label="Cancel edit">
                      <X className="h-5 w-5" />
                    </Button>
                  ) : null}
                </CardHeader>
                <CardContent>
                  <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                      <Label htmlFor="weight">Weight</Label>
                      <Input
                        id="weight"
                        type="number"
                        min="1"
                        step="0.01"
                        inputMode="decimal"
                        placeholder={latest ? Number(latest.weight).toFixed(2) : "Weight"}
                        value={weight}
                        onChange={(event) => setWeight(event.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="body-fat">Body Fat %</Label>
                      <Input
                        id="body-fat"
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        inputMode="decimal"
                        placeholder={latest ? Number(latest.body_fat_percentage).toFixed(1) : "Body fat"}
                        value={bodyFat}
                        onChange={(event) => setBodyFat(event.target.value)}
                        required
                      />
                    </div>
                    <Button className="w-full" disabled={saving}>
                      <Plus className="h-4 w-4" />
                      {saving ? "Saving..." : editingId ? "Update entry" : "Save entry"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Weight Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  {chartData.length ? (
                    <MetricLineChart data={chartData} dataKey="weight" suffix="kg" />
                  ) : (
                    <EmptyState title="No entries yet">Add your first metric entry to start tracking progress.</EmptyState>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Body Fat Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  {chartData.length ? (
                    <MetricLineChart data={chartData} dataKey="bodyFat" suffix="%" />
                  ) : (
                    <EmptyState title="No entries yet">Your body fat trend appears after the first saved entry.</EmptyState>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>History</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {logs.length ? (
                    logs
                      .slice()
                      .reverse()
                      .map((log, index) => (
                        <motion.div
                          key={log.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.45, delay: index * 0.03 }}
                          className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-black/30 p-3"
                        >
                          <div>
                            <p className="font-medium text-white">{formatDate(log.created_at)}</p>
                            <p className="mt-1 text-sm text-muted">
                              {Number(log.weight).toFixed(2)} kg · {Number(log.body_fat_percentage).toFixed(1)}%
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" onClick={() => startEdit(log)} aria-label="Edit entry">
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button variant="danger" size="icon" onClick={() => remove(log.id)} aria-label="Delete entry">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </motion.div>
                      ))
                  ) : (
                    <EmptyState title="No history">Entries will appear here automatically with their generated date.</EmptyState>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
