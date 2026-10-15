import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { getAdmin } from "@/lib/auth";
import { t } from "@/lib/i18n";
import { readStore } from "@/lib/store";
import { isSupabaseConfigured } from "@/lib/supabase";
import FlowerLoader from "../components/flower-loader";
import { LoginForm } from "./login-form";
import { Dashboard } from "./dashboard";

export const metadata: Metadata = {
  title: "ຈັດການຮ້ານ",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <div className="flex-1 bg-cream">
      <Suspense fallback={<FlowerLoader fullScreen />}>
        <AdminGate />
      </Suspense>
    </div>
  );
}

async function AdminGate() {
  // Render per request: the Supabase login check reads the clock (token expiry),
  // which Next.js won't allow during prerendering.
  await connection();
  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <h1 className="text-2xl font-bold">{t.notConfiguredTitle}</h1>
        <p className="mt-3 leading-relaxed text-muted">{t.notConfiguredBody}</p>
      </div>
    );
  }
  const admin = await getAdmin();
  if (!admin) return <LoginForm />;
  const data = await readStore(admin.sb);
  return <Dashboard data={data} email={admin.email} />;
}
