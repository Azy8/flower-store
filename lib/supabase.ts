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

// ---------- "Remember me" ----------
// Ticked  → login kept in localStorage: survives closing the browser.
// Unticked → kept in sessionStorage: gone when the browser/tab is closed.
const REMEMBER_KEY = "flower-store-remember";
const LAST_EMAIL_KEY = "flower-store-last-email";

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn(); // storage can throw in private mode or when blocked
  } catch {
    return fallback;
  }
}

export function setRememberLogin(remember: boolean) {
  safe(() => localStorage.setItem(REMEMBER_KEY, remember ? "1" : "0"), undefined);
}
export function getRememberLogin(): boolean {
  return safe(() => localStorage.getItem(REMEMBER_KEY) !== "0", true); // default: remember
}
export function saveLastEmail(email: string) {
  safe(() => localStorage.setItem(LAST_EMAIL_KEY, email), undefined);
}
export function getLastEmail(): string {
  return safe(() => localStorage.getItem(LAST_EMAIL_KEY) ?? "", "");
}

/** Session storage for Supabase Auth that follows the "remember me" choice. */
const authStorage = {
  getItem: (key: string) => safe(() => localStorage.getItem(key) ?? sessionStorage.getItem(key), null),
  setItem: (key: string, value: string) =>
    safe(() => {
      const keep = getRememberLogin() ? localStorage : sessionStorage;
      const other = keep === localStorage ? sessionStorage : localStorage;
      keep.setItem(key, value);
      other.removeItem(key);
    }, undefined),
  removeItem: (key: string) =>
    safe(() => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    }, undefined),
};

let client: SupabaseClient | null = null;

/** One shared client; the admin's login session is stored according to "remember me". */
export function supabase(): SupabaseClient {
  client ??= createClient(URL!, KEY!, {
    auth: { persistSession: true, autoRefreshToken: true, storageKey: "flower-store-auth", storage: authStorage },
  });
  return client;
}
