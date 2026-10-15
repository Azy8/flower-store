import { Suspense } from "react";
import { connection } from "next/server";
import { t } from "@/lib/i18n";
import { readStore } from "@/lib/store";
import { isSupabaseConfigured, supabasePublic } from "@/lib/supabase";
import { Catalog } from "./catalog";
import FlowerLoader from "./components/flower-loader";

export default function Home() {
  return (
    <Suspense fallback={<FlowerLoader fullScreen />}>
      <CatalogData />
    </Suspense>
  );
}

// Reads Supabase on every request so the owner's changes show up immediately.
async function CatalogData() {
  await connection();
  if (!isSupabaseConfigured()) {
    return <p className="p-8 text-center text-muted">{t.notConnected}</p>;
  }
  const { settings, categories, products } = await readStore(supabasePublic(), { onlyVisible: true });
  return <Catalog settings={settings} categories={categories} products={products} />;
}
