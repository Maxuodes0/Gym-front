import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const usernameAliases: Record<string, string> = {
  bushrauei: "bushrauei@tura.app",
  xebec: "xebec@tura.app"
};

function normalizeLoginIdentifier(identifier: string) {
  const value = identifier.trim();
  return usernameAliases[value.toLowerCase()] ?? value;
}

export async function signInWithPassword(identifier: string, password: string) {
  const supabase = getSupabaseBrowserClient();
  const email = normalizeLoginIdentifier(identifier);
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

export async function getCurrentUserEmail() {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) throw error;
  return data.user?.email ?? null;
}
