"use client";

import { useCallback, useEffect, useState } from "react";
import { t } from "@/lib/i18n";
import { readStore } from "@/lib/store";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { StoreData } from "@/lib/types";
import { Catalog } from "./catalog";
import FlowerLoader from "./components/flower-loader";

/** Loads visible products from Supabase, then shows the catalog. */
export function Storefront() {
  const [data, setData] = useState<StoreData | null>(null);
  const [failed, setFailed] = useState(false);

  const fetchData = useCallback(
    () =>
      readStore(supabase(), { onlyVisible: true }).then(setData, (e) => {
        console.error(e);
        setFailed(true);
      }),
    [],
  );

  useEffect(() => {
    if (isSupabaseConfigured()) void fetchData();
  }, [fetchData]);

  const retry = () => {
    setFailed(false);
    void fetchData();
  };

  if (!isSupabaseConfigured()) return <Message text={t.notConnected} />;
  if (failed) return <Message text={t.loadFailed} onRetry={retry} />;
  if (!data) return <FlowerLoader fullScreen />;
  return <Catalog settings={data.settings} categories={data.categories} products={data.products} />;
}

export function Message({ text, onRetry }: { text: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center text-muted">
      <p>{text}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="min-h-11 rounded-full border-2 border-ink px-5 font-semibold text-ink">
          {t.retry}
        </button>
      )}
    </div>
  );
}
