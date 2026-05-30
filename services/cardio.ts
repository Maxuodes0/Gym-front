import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getCurrentUserId } from "@/services/auth";
import type { CardioLog } from "@/types/domain";

export async function getCardioLogs() {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("cardio_logs")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data as CardioLog[];
}

export async function createCardioLog(machineType: string, durationMinutes: number) {
  const supabase = getSupabaseBrowserClient();
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("cardio_logs")
    .insert({
      user_id: userId,
      machine_type: machineType.trim(),
      duration_minutes: durationMinutes
    })
    .select()
    .single();

  if (error) throw error;
  return data as CardioLog;
}

export async function updateCardioLog(id: string, values: { machine_type: string; duration_minutes: number }) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("cardio_logs")
    .update({
      machine_type: values.machine_type.trim(),
      duration_minutes: values.duration_minutes
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as CardioLog;
}

export async function deleteCardioLog(id: string) {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from("cardio_logs").delete().eq("id", id);

  if (error) throw error;
}
