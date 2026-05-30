import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export async function signInWithPassword(email: string, password: string) {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) throw error;
}

export async function getCurrentUserId() {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) throw error;
  if (!data.user) throw new Error("No authenticated user found.");

  return data.user.id;
}
