// Supabase clients using only the URL + publishable key.
// What each request may do is enforced by Row Level Security (see supabase/schema.sql).
import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export const IMAGE_BUCKET = "product-images";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export function isSupabaseConfigured(): boolean {
  return Boolean(URL && KEY);
}

let publicClient: SupabaseClient | null = null;

/** Visitor client (no login). Used by the storefront: sees only visible products. */
export function supabasePublic(): SupabaseClient {
  publicClient ??= createClient(URL!, KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
  return publicClient;
}

/** Per-request client carrying the logged-in admin's session from cookies. */
export async function supabaseServer(): Promise<SupabaseClient> {
  const store = await cookies();
  return createServerClient(URL!, KEY!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Called from a Server Component (read-only cookies): proxy.ts refreshes the session instead.
        }
      },
    },
  });
}
