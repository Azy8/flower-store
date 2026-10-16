"use client";

import { useActionState, useState } from "react";
import { t } from "@/lib/i18n";
import { loginAction } from "@/lib/admin-api";
import { getLastEmail, getRememberLogin } from "@/lib/supabase";
import { LeafIcon } from "../components/icons";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, null);
  // Only rendered in the browser (after the admin page checked the session), so storage is available.
  const [lastEmail] = useState(getLastEmail);
  const [remember] = useState(getRememberLogin);
  const inputCls = "h-13 rounded-xl border-2 border-chip bg-white px-3.5 text-base";
  return (
    <main className="mx-auto flex max-w-sm flex-col px-4 py-10">
      <LeafIcon className="h-10 w-10 text-brand" />
      <h1 className="mt-4 text-2xl font-bold">{t.loginTitle}</h1>
      <p className="mt-1 text-muted">{t.loginSubtitle}</p>
      <form action={action} className="mt-6 flex flex-col gap-3">
        <label htmlFor="email" className="text-sm font-semibold">
          {t.email}
        </label>
        <input id="email" name="email" type="email" required autoComplete="username" defaultValue={lastEmail} className={inputCls} />
        <label htmlFor="password" className="text-sm font-semibold">
          {t.password}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          autoFocus={Boolean(lastEmail)}
          className={inputCls}
        />
        <label className="flex min-h-11 items-center gap-3 text-[15px]">
          <input type="checkbox" name="remember" defaultChecked={remember} className="h-5 w-5 accent-brand" />
          {t.rememberMe}
        </label>
        {state?.error && (
          <p role="alert" className="text-sm font-medium text-brand-dark">
            {state.error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="mt-1 min-h-13 rounded-full bg-brand text-base font-semibold text-white disabled:opacity-60"
        >
          {pending ? t.loggingIn : t.loginButton}
        </button>
      </form>
    </main>
  );
}
