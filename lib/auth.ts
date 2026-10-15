// Server-only: admin login via Supabase Auth. A user is an admin only if listed
// in public.admins (checked by the is_admin() SQL function), so signing up alone grants nothing.
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseServer } from "./supabase";

export type AdminSession = { sb: SupabaseClient; email: string };

/** Returns the admin's session, or null if not logged in / not an admin. */
export async function getAdmin(): Promise<AdminSession | null> {
  const sb = await supabaseServer();
  // getUser() verifies the token with Supabase (don't trust the cookie alone).
  const { data } = await sb.auth.getUser();
  if (!data.user) return null;
  const { data: isAdmin, error } = await sb.rpc("is_admin");
  if (error || isAdmin !== true) return null;
  return { sb, email: data.user.email ?? "" };
}

export type LoginResult = "ok" | "invalid" | "notAdmin" | "tooMany";

export async function login(email: string, password: string): Promise<LoginResult> {
  const sb = await supabaseServer();
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) return error.status === 429 ? "tooMany" : "invalid";
  const { data: isAdmin } = await sb.rpc("is_admin");
  if (isAdmin !== true) {
    await sb.auth.signOut();
    return "notAdmin";
  }
  return "ok";
}

export async function logout(): Promise<void> {
  await (await supabaseServer()).auth.signOut();
}
