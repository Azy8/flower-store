"use client";

import { useActionState } from "react";
import { t } from "@/lib/i18n";
import { loginAction } from "./actions";
import { LeafIcon } from "../components/icons";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, null);
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
        <input id="email" name="email" type="email" required autoComplete="username" className={inputCls} />
        <label htmlFor="password" className="text-sm font-semibold">
          {t.password}
        </label>
        <input id="password" name="password" type="password" required autoComplete="current-password" className={inputCls} />
        {state?.error && (
          <p role="alert" className="text-sm font-medium text-brand-dark">
            {state.error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="mt-2 min-h-13 rounded-full bg-brand text-base font-semibold text-white disabled:opacity-60"
        >
          {pending ? t.loggingIn : t.loginButton}
        </button>
      </form>
    </main>
  );
}
