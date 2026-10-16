"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { Category, Product, Settings } from "@/lib/types";
import { contactLinks, telLink, type ContactLink } from "@/lib/contact";
import { t, type Dict } from "@/lib/i18n";
import { formatPrice } from "@/lib/price";
import { ChatIcon, CloseIcon, LeafIcon, PhoneIcon, PinIcon } from "./components/icons";
import { AnimatedHeadline } from "./components/animated-headline";
import { Pager, paginate } from "./components/pager";
import { ProductImage } from "./components/product-image";
import { useReveal } from "./components/use-reveal";
import { ALL_TAGS, matchesTag, TagFilter, usedTags } from "./components/tag-filter";

type Props = { settings: Settings; categories: Category[]; products: Product[] };

const HASH_PREFIX = "#p-";

/** Full link that opens this product's detail sheet, e.g. https://shop.web.app/#p-<id>. */
function productLink(id: string): string {
  return `${window.location.origin}${window.location.pathname}${HASH_PREFIX}${id}`;
}

export function Catalog({ settings, categories, products }: Props) {
  const [cat, setCat] = useState("all");
  const [tag, setTag] = useState(ALL_TAGS);
  const [page, setPage] = useState(1);
  const listTop = useRef<HTMLElement>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  // Tabs: only categories that have products at all (so they don't jump around),
  // but the numbers count only products matching the selected tag.
  const tabs = useMemo(() => {
    const hasAny = new Set(products.map((p) => p.categoryId));
    const counts = new Map<string, number>();
    const tagged = products.filter((p) => matchesTag(p, tag));
    for (const p of tagged) counts.set(p.categoryId, (counts.get(p.categoryId) ?? 0) + 1);
    return [
      { id: "all", name: t.all, count: tagged.length },
      ...categories.filter((c) => hasAny.has(c.id)).map((c) => ({ ...c, count: counts.get(c.id) ?? 0 })),
    ];
  }, [categories, products, tag]);

  const catName = (id: string) => categories.find((c) => c.id === id)?.name ?? "";
  const inCategory = cat === "all" ? products : products.filter((p) => p.categoryId === cat);
  const shown = inCategory.filter((p) => matchesTag(p, tag));
  const tags = useMemo(() => usedTags(products), [products]);
  const tagCounts = Object.fromEntries(tags.map((tg) => [tg, inCategory.filter((p) => p.tag === tg).length]));
  const { pageItems, current, totalPages } = paginate(shown, page);
  const gridRef = useRef<HTMLUListElement>(null);
  useReveal(gridRef, pageItems.map((p) => p.id).join());

  const pickCategory = (id: string) => {
    setCat(id);
    setPage(1); // a new category starts on its first page
  };
  const pickTag = (value: string) => {
    setTag(value);
    setPage(1);
  };
  const goToPage = (p: number) => {
    setPage(p);
    listTop.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const open = products.find((p) => p.id === openId) ?? null;

  // A link like https://shop/#p-<id> opens that product directly (handy to send in chat).
  useEffect(() => {
    const sync = () => {
      const h = window.location.hash;
      setOpenId(h.startsWith(HASH_PREFIX) ? h.slice(HASH_PREFIX.length) : null);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const close = () => {
    setOpenId(null);
    if (window.location.hash.startsWith(HASH_PREFIX))
      history.replaceState(null, "", window.location.pathname + window.location.search);
  };

  const chatLinks = contactLinks(settings, t.greeting).filter((l) => l.kind !== "phone");
  const tel = telLink(settings.phone);

  return (
    <div className="flex-1 bg-white">
      <header className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 pt-5">
        <div className="flex min-w-0 items-center gap-2.5">
          <LeafIcon className="h-7 w-7 flex-none text-brand" />
          <div className="min-w-0">
            <div className="truncate pt-1 text-xl font-bold leading-normal">{settings.shopName}</div>
            {settings.tagline && <div className="truncate text-xs leading-normal text-soft">{settings.tagline}</div>}
          </div>
        </div>
        <div className="flex flex-none gap-2">
          {tel && (
            <a href={tel} aria-label={t.callShop} className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-chip">
              <PhoneIcon className="h-5 w-5" />
            </a>
          )}
          {chatLinks[0] && (
            <a
              href={chatLinks[0].href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t.chatShopVia(chatLinks[0].label)}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-brand text-white"
            >
              <ChatIcon className="h-5 w-5" />
            </a>
          )}
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 pb-2 pt-6">
        <AnimatedHeadline text={settings.headline} subtitle={t.hint} />
      </section>

      <nav aria-label={t.categoriesNav} className="sticky top-0 z-10 mt-3 border-b border-line bg-white/95 py-3 backdrop-blur">
        <div className="no-scrollbar mx-auto flex max-w-5xl gap-2 overflow-x-auto px-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              aria-pressed={cat === tab.id}
              onClick={() => pickCategory(tab.id)}
              className={`min-h-11 flex-none whitespace-nowrap rounded-full border-2 px-4 text-[15px] font-semibold transition-colors ${
                cat === tab.id ? "border-brand bg-brand text-white" : "border-chip bg-white text-ink"
              } ${tab.count === 0 && cat !== tab.id ? "opacity-45" : ""}`}
            >
              {tab.name} <span className="font-normal opacity-80">({tab.count})</span>
            </button>
          ))}
        </div>
        <div className="mx-auto mt-2.5 max-w-5xl px-4">
          <TagFilter tags={tags} value={tag} onChange={pickTag} counts={tagCounts} />
        </div>
      </nav>

      <main ref={listTop} className="mx-auto max-w-5xl scroll-mt-16 px-4 pb-2 pt-4">
        {shown.length === 0 ? (
          <p className="rounded-2xl bg-cream px-4 py-12 text-center text-muted">{tag ? t.noTagMatch : t.empty}</p>
        ) : (
          <ul ref={gridRef} className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {pageItems.map((p, i) => (
              // rises in when scrolled into view; cards in the same row follow each other slightly
              <li key={p.id} className="card-rise" style={{ "--rise-delay": `${(i % 4) * 70}ms` } as CSSProperties}>
                <a
                  href={`${HASH_PREFIX}${p.id}`}
                  className="block overflow-hidden rounded-2xl border border-line bg-white transition duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.97]"
                >
                  <div className="relative aspect-[4/5] bg-blush">
                    <ProductImage image={p.image} alt={p.name} sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 260px" />
                    {p.tag && (
                      <span className="absolute left-2 top-2 rounded-full bg-brand px-2.5 py-0.5 text-xs font-semibold text-white">
                        {p.tag}
                      </span>
                    )}
                  </div>
                  <div className="px-3 pb-3 pt-2.5">
                    <div className="truncate text-xs leading-normal text-soft">
                      {catName(p.categoryId)}
                    </div>
                    <div className="mt-0.5 line-clamp-2 font-semibold leading-snug">{p.name}</div>
                    {formatPrice(p.price) && <div className="mt-1 font-bold text-brand">{formatPrice(p.price)}</div>}
                  </div>
                </a>
              </li>
            ))}
          </ul>
        )}
        <Pager current={current} totalPages={totalPages} onChange={goToPage} />
      </main>

      <ContactSection settings={settings} t={t} />

      {open && <ProductDialog product={open} categoryName={catName(open.categoryId)} settings={settings} t={t} onClose={close} />}
    </div>
  );
}

function ContactButton({ link, primary, compact, t }: { link: ContactLink; primary?: boolean; compact?: boolean; t: Dict }) {
  const isPhone = link.kind === "phone";
  return (
    <a
      href={link.href}
      {...(isPhone ? {} : { target: "_blank", rel: "noopener noreferrer" })}
      className={`flex min-h-12 items-center justify-center gap-2 rounded-full px-5 text-[15px] font-semibold ${
        primary ? "bg-brand text-white" : "border-2 border-ink text-ink"
      }`}
    >
      {isPhone ? <PhoneIcon className="h-5 w-5" /> : <ChatIcon className="h-5 w-5" />}
      {isPhone ? (compact ? t.call : t.callNumber(link.label)) : t.chatVia(link.label)}
    </a>
  );
}

function ContactSection({ settings, t }: { settings: Settings; t: Dict }) {
  const links = contactLinks(settings, t.greeting);
  return (
    <section id="contact" className="mx-auto mt-6 w-full max-w-5xl px-4 pb-10">
      <div className="flex flex-col gap-3.5 rounded-3xl border border-line bg-blush px-5 py-6">
        <h2 className="text-[22px] font-bold">{t.contactTitle}</h2>
        <p className="text-[15px] leading-relaxed text-muted">{t.contactText}</p>
        {links.length > 0 ? (
          <div className="flex flex-wrap gap-2.5">
            {links.map((l, i) => (
              <ContactButton key={l.kind} link={l} primary={i === 0} t={t} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-soft">{t.noContact}</p>
        )}
        {(settings.address || settings.hours) && (
          <div className="flex items-start gap-2.5 text-sm leading-relaxed text-muted">
            <PinIcon className="mt-0.5 h-5 w-5 flex-none" />
            <div className="whitespace-pre-line">
              {settings.address}
              {settings.address && settings.hours && "\n"}
              {settings.hours && `${t.hoursLabel}: ${settings.hours}`}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function ProductDialog({
  product,
  categoryName,
  settings,
  t,
  onClose,
}: {
  product: Product;
  categoryName: string;
  settings: Settings;
  t: Dict;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  // Native <dialog> gives us focus trapping and Esc-to-close for free.
  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const links = contactLinks(settings, t.interest(product.name, formatPrice(product.price), productLink(product.id)));

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-labelledby="product-title"
      className="m-0 mt-auto max-h-[92dvh] w-full max-w-none overflow-y-auto rounded-t-3xl bg-white p-0 text-ink sm:m-auto sm:max-w-lg sm:rounded-3xl"
    >
      <div className="relative aspect-[4/5] max-h-[55dvh] w-full bg-blush">
        <ProductImage image={product.image} alt={product.name} sizes="(max-width: 640px) 100vw, 512px" />
        <button
          type="button"
          onClick={onClose}
          aria-label={t.close}
          className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/95 shadow"
        >
          <CloseIcon className="h-5 w-5" />
        </button>
        {product.tag && (
          <span className="absolute left-3 top-4 rounded-full bg-brand px-3 py-1 text-[13px] font-semibold text-white">{product.tag}</span>
        )}
      </div>
      <div className="px-5 pb-4 pt-4">
        <div className="text-[13px] text-soft">{categoryName}</div>

        <div className="mt-0.5 flex items-baseline justify-between gap-3">
          <h2 id="product-title" className="text-2xl font-bold leading-snug">
            {product.name}
          </h2>
          {formatPrice(product.price) && <div className="flex-none text-xl font-bold text-brand">{formatPrice(product.price)}</div>}
        </div>
        {product.description && (
          <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-muted">{product.description}</p>
        )}
      </div>
      <div className="sticky bottom-0 flex flex-col gap-2.5 border-t border-line bg-white px-4 pb-6 pt-3.5">
        {links.length > 0 ? (
          <>
            <div className="text-center text-[13px] text-soft">{t.tellShop(product.name)}</div>
            <div className="flex flex-wrap gap-2.5 [&>a]:flex-1">
              {links.map((l, i) => (
                <ContactButton key={l.kind} link={l} primary={i === 0} compact t={t} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center text-sm text-soft">{t.noContact}</div>
        )}
      </div>
    </dialog>
  );
}
