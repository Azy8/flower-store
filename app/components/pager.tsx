"use client";

import { t } from "@/lib/i18n";

export const PAGE_SIZE = 10;

/** Items for one page. `page` is 1-based and clamped, so a page that vanished (e.g. after a delete) still shows something. */
export function paginate<T>(items: T[], page: number, size = PAGE_SIZE) {
  const totalPages = Math.max(1, Math.ceil(items.length / size));
  const current = Math.min(Math.max(1, page), totalPages);
  return { pageItems: items.slice((current - 1) * size, current * size), current, totalPages };
}

/** Page numbers to show: all if few, else first/last + neighbours with gaps ("…"). */
function pageList(current: number, total: number): (number | "gap")[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current - 1, current, current + 1].filter((p) => p >= 1 && p <= total));
  const sorted = [...pages].sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push("gap");
    out.push(p);
  });
  return out;
}

/** ‹ 1 2 3 › — hidden when everything fits on one page. Big touch targets for phones. */
export function Pager({ current, totalPages, onChange }: { current: number; totalPages: number; onChange: (page: number) => void }) {
  if (totalPages <= 1) return null;
  const btn = "flex h-11 min-w-11 items-center justify-center rounded-full px-3 text-[15px] font-semibold";
  return (
    <nav aria-label={t.pagination} className="mt-5 flex flex-col items-center gap-2">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onChange(current - 1)}
          disabled={current === 1}
          aria-label={t.prevPage}
          className={`${btn} border-2 border-chip bg-white disabled:opacity-35`}
        >
          ‹
        </button>
        {pageList(current, totalPages).map((p, i) =>
          p === "gap" ? (
            <span key={`gap-${i}`} aria-hidden className="w-6 text-center text-soft">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              aria-current={p === current ? "page" : undefined}
              aria-label={t.pageOf(p, totalPages)}
              className={`${btn} ${p === current ? "bg-brand text-white" : "text-ink hover:bg-blush"}`}
            >
              {p}
            </button>
          ),
        )}
        <button
          type="button"
          onClick={() => onChange(current + 1)}
          disabled={current === totalPages}
          aria-label={t.nextPage}
          className={`${btn} border-2 border-chip bg-white disabled:opacity-35`}
        >
          ›
        </button>
      </div>
      <div className="text-xs text-soft">{t.pageOf(current, totalPages)}</div>
    </nav>
  );
}
