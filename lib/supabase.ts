// Browser Supabase client (static site on Firebase Hosting: there is no server).
// Only the URL + publishable key are used; they are public by design.
// What each visitor/admin may do is enforced by Row Level Security (supabase/schema.sql).
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const IMAGE_BUCKET = "product-images";

// Inlined at build time from .env.local
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export function isSupabaseConfigured(): boolean {
  return Boolean(URL && KEY);
}

let client: SupabaseClient | null = null;

/** One shared client; the admin's login session is kept in localStorage. */
export function supabase(): SupabaseClient {
  client ??= createClient(URL!, KEY!, {
    auth: { persistSession: true, autoRefreshToken: true, storageKey: "flower-store-auth" },
  });
  return client;
}
