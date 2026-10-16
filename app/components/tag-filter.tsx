"use client";

import { t } from "@/lib/i18n";
import type { Product } from "@/lib/types";

export const ALL_TAGS = "";

/** Tags actually used by these products: the standard ones first (in their usual order), then any others. */
export function usedTags(products: Product[]): string[] {
  const used = new Set(products.map((p) => p.tag).filter(Boolean));
  return [...t.tags.filter((tag) => used.has(tag)), ...[...used].filter((tag) => !t.tags.includes(tag))];
}

export const matchesTag = (p: Product, tag: string) => tag === ALL_TAGS || p.tag === tag;

/** Dropdown under the category buttons: "all tags" or one tag (ຂາຍດີ, ແນະນຳ, …). Hidden when no product has a tag. */
export function TagFilter({
  tags,
  value,
  onChange,
  counts,
}: {
  tags: string[];
  value: string;
  onChange: (tag: string) => void;
  counts?: Record<string, number>;
}) {
  if (tags.length === 0) return null;
  const label = (tag: string) => (counts ? `${tag} (${counts[tag] ?? 0})` : tag);
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="tag-filter" className="flex-none text-sm font-semibold text-muted">
        {t.tagFilterLabel}
      </label>
      <select
        id="tag-filter"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`h-11 min-w-0 max-w-full flex-1 rounded-full border-2 bg-white pl-4 pr-8 text-[15px] font-semibold sm:flex-none ${
          value ? "border-brand text-brand" : "border-chip text-ink"
        }`}
      >
        <option value={ALL_TAGS}>{t.allTags}</option>
        {tags.map((tag) => (
          <option key={tag} value={tag}>
            {label(tag)}
          </option>
        ))}
      </select>
    </div>
  );
}
