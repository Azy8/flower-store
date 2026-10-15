"use client";

import { useCallback, useEffect, useState } from "react";
import { STORE_EVENT } from "@/lib/admin-api";
import { AUTH_EVENT, getAdmin, type AdminSession } from "@/lib/auth";
import { t } from "@/lib/i18n";
import { readStore } from "@/lib/store";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { StoreData } from "@/lib/types";
import FlowerLoader from "../components/flower-loader";
import { Message } from "../storefront";
import { Dashboard } from "./dashboard";
import { LoginForm } from "./login-form";

type State =
  | { kind: "loading" }
  | { kind: "login" }
  | { kind: "error" }
  | { kind: "ready"; admin: AdminSession; data: StoreData };

// Full check: who is signed in, are they an admin, then load everything (incl. hidden products).
async function loadAdminState(): Promise<State> {
  try {
    const admin = await getAdmin();
    if (!admin) return { kind: "login" };
    return { kind: "ready", admin, data: await readStore(supabase()) };
  } catch (e) {
    console.error(e);
    return { kind: "error" };
  }
}

/** Decides between login form and dashboard, and reloads data after every change. */
export function AdminApp() {
  const [state, setState] = useState<State>({ kind: "loading" });

  const checkAndLoad = useCallback(() => loadAdminState().then(setState), []);

  // After a save/delete: only refresh the data, keep the current screen.
  const reloadData = useCallback(async () => {
    try {
      const data = await readStore(supabase());
      setState((s) => (s.kind === "ready" ? { ...s, data } : s));
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    void checkAndLoad();
    const onAuth = () => void checkAndLoad();
    const onStore = () => void reloadData();
    window.addEventListener(AUTH_EVENT, onAuth);
    window.addEventListener(STORE_EVENT, onStore);
    return () => {
      window.removeEventListener(AUTH_EVENT, onAuth);
      window.removeEventListener(STORE_EVENT, onStore);
    };
  }, [checkAndLoad, reloadData]);

  if (!isSupabaseConfigured()) return <Message text={t.notConfiguredBody} />;
  if (state.kind === "loading") return <FlowerLoader fullScreen />;
  if (state.kind === "error") return <Message text={t.loadFailed} onRetry={() => void checkAndLoad()} />;
  if (state.kind === "login") return <LoginForm />;
  return <Dashboard data={state.data} email={state.admin.email} />;
}
