// Admin login via Supabase Auth (runs in the browser).
// A user counts as admin only if listed in public.admins (checked by the is_admin()
// SQL function). The database enforces this too, so this check is for the UI only.
import { supabase } from "./supabase";

export type AdminSession = { email: string };

/** Fired after login/logout so the admin page re-checks who is signed in. */
export const AUTH_EVENT = "flower-auth-changed";

export async function getAdmin(): Promise<AdminSession | null> {
  const sb = supabase();
  // getUser() asks Supabase to verify the token (don't trust local storage alone).
  const { data } = await sb.auth.getUser();
  if (!data.user) return null;
  const { data: isAdmin, error } = await sb.rpc("is_admin");
  if (error || isAdmin !== true) return null;
  return { email: data.user.email ?? "" };
}

export type LoginResult = "ok" | "invalid" | "notAdmin" | "tooMany";

export async function login(email: string, password: string): Promise<LoginResult> {
  const sb = supabase();
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
  await supabase().auth.signOut();
}
