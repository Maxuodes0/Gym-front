"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Edit3, HeartPulse, Plus, Timer, Trash2, X } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/layout/empty-state";
import { clamp, MetricRing } from "@/components/layout/metric-ring";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { createCardioLog, deleteCardioLog, getCardioLogs, updateCardioLog } from "@/services/cardio";
import type { CardioLog } from "@/types/domain";
import { formatDate } from "@/lib/utils";

export default function CardioPage() {
  const [logs, setLogs] = useState<CardioLog[]>([]);
  const [machineType, setMachineType] = useState("");
  const [duration, setDuration] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function refresh() {
    setLogs(await getCardioLogs());
  }

  useEffect(() => {
    refresh()
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load cardio logs."))
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const totalMinutes = logs.reduce((sum, log) => sum + Number(log.duration_minutes), 0);
    const latest = logs.at(-1);
    const uniqueMachines = new Set(logs.map((log) => log.machine_type.trim().toLowerCase())).size;

    return {
      totalMinutes,
      sessions: logs.length,
      latest,
      uniqueMachines
    };
  }, [logs]);

  function resetForm() {
    setEditingId(null);
    setMachineType("");
    setDuration("");
  }

  function startEdit(log: CardioLog) {
    setEditingId(log.id);
    setMachineType(log.machine_type);
    setDuration(String(log.duration_minutes));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);

    try {
      const durationValue = Number(duration);
      if (!machineType.trim()) throw new Error("Enter the cardio machine type.");
      if (!durationValue || durationValue <= 0) throw new Error("Enter a valid duration.");

      if (editingId) {
        await updateCardioLog(editingId, {
          machine_type: machineType,
          duration_minutes: durationValue
        });
      } else {
        await createCardioLog(machineType, durationValue);
      }

      resetForm();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save cardio entry.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    setError("");
    try {
      await deleteCardioLog(id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete cardio entry.");
    }
  }

  return (
    <AppShell>
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted">Cardio Tracking</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-normal text-white md:text-5xl">Cardio log</h1>
      </div>

      {error ? <p className="mb-6 rounded-md border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</p> : null}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-32" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[0.78fr_1.22fr]">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <MetricRing
                label="Total Time"
                value={stats.totalMinutes.toFixed(0)}
                detail="minutes"
                progress={clamp((stats.totalMinutes / 300) * 100, 8, 96)}
                accent="#409BF2"
              />
              <MetricRing
                label="Sessions"
                value={`${stats.sessions}`}
                detail={`${stats.uniqueMachines} machines`}
                progress={clamp((stats.sessions / 12) * 100, 8, 96)}
                accent="#B7BDC1"
              />
            </div>

            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>{editingId ? "Edit Cardio" : "Add Cardio"}</CardTitle>
                {editingId ? (
                  <Button variant="ghost" size="icon" onClick={resetForm} aria-label="Cancel edit">
                    <X className="h-5 w-5" />
                  </Button>
                ) : null}
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <Label htmlFor="machine-type">Cardio Machine</Label>
                    <Input
                      id="machine-type"
                      type="text"
                      placeholder="Treadmill"
                      value={machineType}
                      onChange={(event) => setMachineType(event.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">Time Minutes</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="1"
                      step="0.5"
                      inputMode="decimal"
                      placeholder="30"
                      value={duration}
                      onChange={(event) => setDuration(event.target.value)}
                      required
                    />
                  </div>
                  <Button className="w-full" disabled={saving}>
                    <Plus className="h-4 w-4" />
                    {saving ? "Saving..." : editingId ? "Update cardio" : "Save cardio"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>History</CardTitle>
              <HeartPulse className="h-5 w-5 text-white/50" />
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
                      <div className="min-w-0">
                        <p className="truncate font-medium text-white">{log.machine_type}</p>
                        <p className="mt-1 flex items-center gap-2 text-sm text-muted">
                          <Timer className="h-4 w-4" />
                          {Number(log.duration_minutes).toFixed(1)} min · {formatDate(log.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => startEdit(log)} aria-label="Edit cardio entry">
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button variant="danger" size="icon" onClick={() => remove(log.id)} aria-label="Delete cardio entry">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))
              ) : (
                <EmptyState title="No cardio yet">Add the machine and time to build a clean cardio history.</EmptyState>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </AppShell>
  );
}
