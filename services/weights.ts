import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getCurrentUserId } from "@/services/auth";
import type { WeightLog } from "@/types/domain";

export async function getWeightLogs() {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("weight_logs")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data as WeightLog[];
}

export async function createWeightLog(weight: number, bodyFatPercentage: number) {
  const supabase = getSupabaseBrowserClient();
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("weight_logs")
    .insert({
      user_id: userId,
      weight,
      body_fat_percentage: bodyFatPercentage
    })
    .select()
    .single();

  if (error) throw error;
  return data as WeightLog;
}

export async function updateWeightLog(
  id: string,
  values: { weight: number; body_fat_percentage: number }
) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("weight_logs")
    .update(values)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as WeightLog;
}

export async function deleteWeightLog(id: string) {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from("weight_logs").delete().eq("id", id);

  if (error) throw error;
}
