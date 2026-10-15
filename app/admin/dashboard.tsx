"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import type { ActionResult, Category, Product, StoreData } from "@/lib/types";
import { t } from "@/lib/i18n";
import { formatPrice, groupDigits } from "@/lib/price";
import {
  addCategoryAction,
  deleteCategoryAction,
  deleteProductAction,
  logoutAction,
  moveCategoryAction,
  renameCategoryAction,
  saveProductAction,
  saveSettingsAction,
  setProductVisibleAction,
} from "@/lib/admin-api";
import { CheckIcon, CloseIcon, EditIcon, EyeIcon, ImageIcon, LeafIcon, LogoutIcon, PlusIcon, SearchIcon, TrashIcon } from "../components/icons";
import { ProductImage } from "../components/product-image";

type Tab = "products" | "categories" | "settings";

// Phone-first: 16px inputs (no iOS zoom), 44px touch targets, one-row list items.
const inputCls = "w-full rounded-xl border-2 border-chip bg-white px-3 text-base text-ink";
const labelCls = "text-sm font-semibold";
const primaryBtn =
  "flex min-h-12 items-center justify-center gap-2 rounded-full bg-brand px-5 font-semibold text-white disabled:opacity-60";
const iconBtn = "flex h-11 w-11 flex-none items-center justify-center rounded-xl disabled:opacity-30";
const errorCls = "rounded-xl bg-blush p-3 text-sm font-medium text-brand-dark";

export function Dashboard({ data, email }: { data: StoreData; email: string }) {
  const [tab, setTab] = useState<Tab>("products");
  const tabs: [Tab, string][] = [
    ["products", `${t.tabProducts} (${data.products.length})`],
    ["categories", `${t.tabCategories} (${data.categories.length})`],
    ["settings", t.tabSettings],
  ];

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-line bg-white">
        <div className="mx-auto flex max-w-2xl items-center gap-2 px-3 pt-2">
          <LeafIcon className="h-6 w-6 flex-none text-brand" />
          <div className="min-w-0 flex-1">
            <div className="truncate pt-0.5 font-bold leading-normal">{data.settings.shopName}</div>
            <div className="truncate text-xs leading-normal text-soft">{email}</div>
          </div>
          <Link href="/" target="_blank" aria-label={t.viewShop} title={t.viewShop} className={`${iconBtn} text-ink hover:bg-blush`}>
            <EyeIcon className="h-5 w-5" />
          </Link>
          <form action={logoutAction}>
            <button type="submit" aria-label={t.logout} title={t.logout} className={`${iconBtn} text-muted hover:bg-blush`}>
              <LogoutIcon className="h-5 w-5" />
            </button>
          </form>
        </div>
        <nav aria-label={t.adminMenu} className="mx-auto grid max-w-2xl grid-cols-3 px-1">
          {tabs.map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={tab === id}
              onClick={() => setTab(id)}
              className={`min-h-11 border-b-[3px] px-1 text-sm font-semibold ${
                tab === id ? "border-brand text-brand" : "border-transparent text-muted"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-2xl px-3 pb-28 pt-4">
        {tab === "products" && <ProductsTab products={data.products} categories={data.categories} />}
        {tab === "categories" && <CategoriesTab categories={data.categories} products={data.products} />}
        {tab === "settings" && <SettingsTab data={data} />}
      </main>
    </>
  );
}

// ================= Products =================

function ProductsTab({ products, categories }: { products: Product[]; categories: Category[] }) {
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Product | "new" | null>(null);

  const catName = (id: string) => categories.find((c) => c.id === id)?.name ?? t.noCategory;
  const q = query.trim().toLowerCase();
  const list = [...products]
    .filter((p) => filter === "all" || p.categoryId === filter)
    // search by code ("F0001", "f1", "0001") or by name
    .filter((p) => !q || p.code.toLowerCase().includes(q) || p.name.toLowerCase().includes(q))
    .sort((a, b) => b.createdAt - a.createdAt);
  const shownCount = products.filter((p) => p.visible).length;

  return (
    <>
      <h1 className="text-xl font-bold leading-normal">{t.manageProducts}</h1>
      <div className="text-xs text-muted">{t.productSummary(products.length, shownCount)}</div>

      {categories.length === 0 && <p className={`mt-3 ${errorCls}`}>{t.needCategoryFirst}</p>}

      <div role="search" className="relative mt-3">
        <label htmlFor="psearch" className="sr-only">
          {t.searchLabel}
        </label>
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-soft" />
        <input
          id="psearch"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.searchPh}
          autoComplete="off"
          enterKeyHint="search"
          className={`${inputCls} h-12 pl-10 pr-11 [&::-webkit-search-cancel-button]:hidden`}
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label={t.clearSearch}
            className="absolute right-0.5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-soft"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="no-scrollbar -mx-3 mt-2.5 flex gap-2 overflow-x-auto px-3">
        {[{ id: "all", name: t.all }, ...categories].map((c) => (
          <button
            key={c.id}
            type="button"
            aria-pressed={filter === c.id}
            onClick={() => setFilter(c.id)}
            className={`min-h-10 flex-none whitespace-nowrap rounded-full border-2 px-3.5 text-sm font-semibold ${
              filter === c.id ? "border-brand bg-brand text-white" : "border-chip bg-white"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      <ul className="mt-3 flex flex-col gap-2">
        {list.length === 0 && (
          <li className="rounded-2xl bg-white p-8 text-center text-sm text-muted">{q ? t.noResults(query.trim()) : t.noProducts}</li>
        )}
        {list.map((p) => (
          <li key={p.id} className="flex items-center gap-1 rounded-2xl border border-line bg-white pr-2">
            {/* the whole row opens the editor */}
            <button
              type="button"
              onClick={() => setEditing(p)}
              aria-label={t.editAria(p.name)}
              className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl p-2 text-left"
            >
              <span className={`relative h-14 w-14 flex-none overflow-hidden rounded-xl bg-blush ${p.visible ? "" : "opacity-45"}`}>
                <ProductImage image={p.image} alt="" sizes="56px" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold leading-normal">{p.name}</span>
                <span className="block truncate text-xs leading-normal text-soft">
                  {p.code && <span className="font-semibold text-muted">{p.code} · </span>}
                  {catName(p.categoryId)}
                  {formatPrice(p.price) && ` · ${formatPrice(p.price)}`}
                </span>
              </span>
            </button>
            <VisibleSwitch key={`${p.id}-${p.visible}`} product={p} />
          </li>
        ))}
      </ul>

      {/* Floating "add" button, reachable with the thumb */}
      <button
        type="button"
        onClick={() => setEditing("new")}
        disabled={categories.length === 0}
        className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-10 flex h-14 items-center gap-2 rounded-full bg-brand pl-4 pr-5 font-semibold text-white shadow-lg shadow-brand/30 disabled:opacity-50"
      >
        <PlusIcon className="h-6 w-6" />
        {t.addShort}
      </button>

      {editing && (
        <ProductDialog
          key={editing === "new" ? "new" : editing.id}
          product={editing === "new" ? null : editing}
          categories={categories}
          defaultCategory={filter !== "all" ? filter : categories[0]?.id}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}

function VisibleSwitch({ product }: { product: Product }) {
  const [on, setOn] = useState(product.visible);
  const [, startTransition] = useTransition();
  const toggle = () => {
    const next = !on;
    setOn(next); // optimistic
    startTransition(async () => {
      const res = await setProductVisibleAction(product.id, next);
      if (!res.ok) setOn(!next); // undo the optimistic flip
    });
  };
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={t.showAria(product.name)}
      onClick={toggle}
      className="flex min-h-11 flex-none flex-col items-center justify-center gap-0.5 px-1"
    >
      <span className={`relative h-6 w-11 rounded-full transition-colors ${on ? "bg-brand" : "bg-[#B7A6AE]"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${on ? "left-5.5" : "left-0.5"}`} />
      </span>
      <span className="text-[11px] leading-none text-muted">{on ? t.shown : t.hidden}</span>
    </button>
  );
}

/** Number-only price box: shows "500.000" while typing, with ₭ fixed on the right. */
function PriceInput({ defaultValue }: { defaultValue: string }) {
  const [value, setValue] = useState(() => groupDigits(defaultValue));
  return (
    <div className="relative">
      <input
        id="pprice"
        name="price"
        inputMode="numeric"
        autoComplete="off"
        value={value}
        onChange={(e) => setValue(groupDigits(e.target.value))}
        placeholder={t.pricePh}
        className={`${inputCls} h-12 pr-10`}
      />
      <span aria-hidden className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 font-semibold text-muted">
        ₭
      </span>
    </div>
  );
}

/** Shrinks phone photos (often 4–8MB) to ~1600px JPEG before upload. */
async function resizeImage(file: File, max = 1600): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff"; // transparent PNGs become white, not black
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("resize failed"))), "image/jpeg", 0.85),
  );
}

function ProductDialog({
  product,
  categories,
  defaultCategory,
  onClose,
}: {
  product: Product | null;
  categories: Category[];
  defaultCategory?: string;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [state, formAction, pending] = useActionState(saveProductAction, null);
  const [deleting, startDelete] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  useEffect(() => {
    if (ref.current && !ref.current.open) ref.current.showModal();
  }, []);
  useEffect(() => {
    if (state?.ok) onClose();
  }, [state, onClose]);
  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  const pickPhoto = async (file: File | undefined) => {
    setPhotoError(null);
    if (!file) return;
    try {
      const blob = await resizeImage(file);
      setPhoto(blob);
      setPreview(URL.createObjectURL(blob));
      setRemoveImage(false);
    } catch {
      // Browser couldn't decode it (e.g. HEIC on desktop): send the original, server validates it.
      setPhoto(file);
      setPreview(null);
      setPhotoError(t.photoPreviewFail);
    }
  };

  const submit = (fd: FormData) => {
    if (photo) fd.set("image", photo, "photo.jpg");
    if (removeImage) fd.set("removeImage", "on");
    formAction(fd);
  };

  const remove = () => {
    if (!product || !confirm(t.confirmDelete(product.name))) return;
    startDelete(async () => {
      const res = await deleteProductAction(product.id);
      if (res.ok) onClose();
      else setDeleteError(res.error ?? t.errSaveFailed);
    });
  };

  const hasImage = Boolean(preview) || (Boolean(product?.image) && !removeImage);
  // Keep an older tag value selectable when editing.
  const tagOptions = ["", ...t.tags, ...(product?.tag && !t.tags.includes(product.tag) ? [product.tag] : [])];
  const error = state?.error ?? deleteError;

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="pform-title"
      className="m-0 mt-auto max-h-[96dvh] w-full max-w-none overflow-y-auto rounded-t-3xl bg-cream p-0 text-ink sm:m-auto sm:max-w-lg sm:rounded-3xl"
    >
      <form action={submit} className="flex flex-col gap-3.5 px-4 pt-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 id="pform-title" className="text-lg font-bold leading-normal">
              {product ? t.editProduct : t.addProduct}
            </h2>
            <p className="text-xs leading-normal text-soft">
              {product?.code ? (
                <>
                  {t.codeLabel}: <span className="font-semibold text-ink">{product.code}</span>
                </>
              ) : (
                t.codeAuto
              )}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label={t.close} className={`${iconBtn} bg-white`}>
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>
        {product && <input type="hidden" name="id" value={product.id} />}

        {/* Photo: big tap area showing the current picture */}
        <div className="flex flex-col gap-1.5">
          <span className={labelCls}>{t.photo}</span>
          <div className="flex items-stretch gap-3">
            <label className="relative h-32 w-28 flex-none cursor-pointer overflow-hidden rounded-xl border-2 border-dashed border-[#C98AA3] bg-blush focus-within:outline-3 focus-within:outline-brand">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element -- local blob preview
                <img src={preview} alt="" className="h-full w-full object-cover" />
              ) : hasImage ? (
                <ProductImage image={product?.image ?? null} alt="" sizes="112px" />
              ) : (
                <span className="flex h-full flex-col items-center justify-center gap-1 text-muted">
                  <ImageIcon className="h-7 w-7" />
                </span>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/*"
                aria-label={hasImage ? t.changePhoto : t.pickPhoto}
                className="absolute inset-0 cursor-pointer opacity-0"
                onChange={(e) => pickPhoto(e.target.files?.[0])}
              />
            </label>
            <div className="flex flex-col justify-center gap-1 text-sm">
              <span className="font-semibold">{hasImage ? t.changePhoto : t.pickPhoto}</span>
              {hasImage && (
                <button
                  type="button"
                  onClick={() => {
                    setPhoto(null);
                    setPreview(null);
                    setRemoveImage(true);
                  }}
                  className="min-h-11 text-left text-muted underline"
                >
                  {t.removePhoto}
                </button>
              )}
            </div>
          </div>
          {photoError && <p className="text-sm text-muted">{photoError}</p>}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="pname" className={labelCls}>
            {t.name}
          </label>
          <input id="pname" name="name" required maxLength={120} defaultValue={product?.name} placeholder={t.namePh} className={`${inputCls} h-12`} />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="flex min-w-0 flex-col gap-1">
            <label htmlFor="pcat" className={labelCls}>
              {t.category}
            </label>
            <select id="pcat" name="categoryId" required defaultValue={product?.categoryId ?? defaultCategory} className={`${inputCls} h-12`}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <label htmlFor="ptag" className={labelCls}>
              {t.tag}
            </label>
            <select id="ptag" name="tag" defaultValue={product?.tag ?? ""} className={`${inputCls} h-12`}>
              {tagOptions.map((tag) => (
                <option key={tag} value={tag}>
                  {tag || t.noTag}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="pprice" className={labelCls}>
            {t.price}
          </label>
          <PriceInput defaultValue={product?.price ?? ""} />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="pdesc" className={labelCls}>
            {t.description}
          </label>
          <textarea
            id="pdesc"
            name="description"
            rows={3}
            maxLength={2000}
            defaultValue={product?.description}
            placeholder={t.descriptionPh}
            className={`${inputCls} resize-y py-2.5 leading-relaxed`}
          />
        </div>

        <label className="flex min-h-11 items-center gap-3 text-[15px] font-medium">
          <input type="checkbox" name="visible" defaultChecked={product?.visible ?? true} className="h-5 w-5 accent-brand" />
          {t.visibleLabel}
        </label>

        {error && (
          <p role="alert" className={errorCls}>
            {error}
          </p>
        )}

        <div className="sticky bottom-0 -mx-4 flex gap-2 border-t border-line bg-cream px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          {product && (
            <button
              type="button"
              onClick={remove}
              disabled={deleting}
              aria-label={t.deleteProduct}
              title={t.deleteProduct}
              className="flex h-12 w-12 flex-none items-center justify-center rounded-full border-2 border-brand-dark text-brand-dark disabled:opacity-50"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          )}
          <button type="button" onClick={onClose} className="min-h-12 flex-1 rounded-full border-2 border-ink font-semibold">
            {t.cancel}
          </button>
          <button type="submit" disabled={pending || deleting} className={`${primaryBtn} flex-[1.6]`}>
            {pending ? t.saving : t.save}
          </button>
        </div>
      </form>
    </dialog>
  );
}

// ================= Categories =================

function CategoriesTab({ categories, products }: { categories: Category[]; products: Product[] }) {
  const [addState, addAction, adding] = useActionState(addCategoryAction, null);
  const [message, setMessage] = useState<ActionResult | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (addState?.ok) formRef.current?.reset();
  }, [addState]);

  const run = (fn: () => Promise<ActionResult>, after?: () => void) =>
    startTransition(async () => {
      const res = await fn();
      setMessage(res);
      if (res.ok) after?.();
    });
  const count = (id: string) => products.filter((p) => p.categoryId === id).length;

  return (
    <>
      <h1 className="text-xl font-bold leading-normal">{t.categoriesTitle}</h1>
      <p className="text-xs text-muted">{t.categoriesHint}</p>

      <ul className={`mt-3 flex flex-col gap-2 ${pending ? "opacity-60" : ""}`}>
        {categories.map((c, i) => (
          <li key={c.id} className="flex items-center gap-1 rounded-2xl border border-line bg-white py-1 pl-3 pr-1">
            {editingId === c.id ? (
              <form
                className="flex min-w-0 flex-1 items-center gap-1"
                action={(fd) => run(() => renameCategoryAction(c.id, String(fd.get("name") ?? "")), () => setEditingId(null))}
              >
                <label htmlFor={`cat-${c.id}`} className="sr-only">
                  {t.categoryName}
                </label>
                <input id={`cat-${c.id}`} name="name" defaultValue={c.name} required maxLength={60} autoFocus className={`${inputCls} h-11 min-w-0 flex-1`} />
                <button type="submit" aria-label={t.save} className={`${iconBtn} bg-brand text-white`}>
                  <CheckIcon className="h-5 w-5" />
                </button>
                <button type="button" onClick={() => setEditingId(null)} aria-label={t.cancel} className={iconBtn}>
                  <CloseIcon className="h-5 w-5" />
                </button>
              </form>
            ) : (
              <>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold leading-normal">{c.name}</div>
                  <div className="text-xs leading-normal text-soft">{t.itemsCount(count(c.id))}</div>
                </div>
                <button type="button" disabled={i === 0} onClick={() => run(() => moveCategoryAction(c.id, -1))} aria-label={t.moveUp(c.name)} className={`${iconBtn} text-lg hover:bg-blush`}>
                  ↑
                </button>
                <button type="button" disabled={i === categories.length - 1} onClick={() => run(() => moveCategoryAction(c.id, 1))} aria-label={t.moveDown(c.name)} className={`${iconBtn} text-lg hover:bg-blush`}>
                  ↓
                </button>
                <button type="button" onClick={() => setEditingId(c.id)} aria-label={t.renameCategoryAria(c.name)} className={`${iconBtn} hover:bg-blush`}>
                  <EditIcon className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => confirm(t.confirmDeleteCategory(c.name)) && run(() => deleteCategoryAction(c.id))}
                  aria-label={t.deleteCategoryAria(c.name)}
                  className={`${iconBtn} text-brand-dark hover:bg-blush`}
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
      {message?.error && (
        <p role="alert" className={`mt-3 ${errorCls}`}>
          {message.error}
        </p>
      )}

      <form ref={formRef} action={addAction} className="mt-4 flex gap-2 rounded-2xl border-2 border-dashed border-[#C98AA3] bg-white p-2">
        <label htmlFor="newcat" className="sr-only">
          {t.newCategory}
        </label>
        <input id="newcat" name="name" required maxLength={60} placeholder={t.newCategoryPh} className={`${inputCls} h-12 min-w-0 flex-1`} />
        <button type="submit" disabled={adding} className={`${primaryBtn} flex-none px-4`}>
          <PlusIcon className="h-5 w-5" />
          {t.addShort}
        </button>
      </form>
      {addState?.error && (
        <p role="alert" className={`mt-2 ${errorCls}`}>
          {addState.error}
        </p>
      )}
    </>
  );
}

// ================= Settings =================

function SettingsTab({ data }: { data: StoreData }) {
  const [state, action, pending] = useActionState(saveSettingsAction, null);
  const s = data.settings;
  const field = (name: keyof typeof s, label: string, placeholder: string, hint?: string) => (
    <div className="flex flex-col gap-1">
      <label htmlFor={`s-${name}`} className={labelCls}>
        {label}
      </label>
      <input id={`s-${name}`} name={name} defaultValue={s[name]} placeholder={placeholder} maxLength={300} className={`${inputCls} h-12`} />
      {hint && <span className="text-xs leading-normal text-soft">{hint}</span>}
    </div>
  );
  const box = "flex flex-col gap-3 rounded-2xl border border-line bg-white p-3";

  return (
    <form action={action} className="flex flex-col gap-3">
      <h1 className="text-xl font-bold leading-normal">{t.settingsTitle}</h1>
      <section className={box}>
        {field("shopName", t.shopName, t.shopNamePh)}
        {field("tagline", t.tagline, t.taglinePh)}
        {field("headline", t.headline, t.headlinePh)}
      </section>
      <section className={box}>
        <h2 className="text-sm font-bold leading-normal">{t.contactSection}</h2>
        {field("lineId", t.lineId, t.lineIdPh, t.lineIdHint)}
        {field("whatsapp", t.whatsapp, t.whatsappPh, t.whatsappHint)}
        {field("facebookUrl", t.facebook, "https://m.me/...")}
        {field("phone", t.phone, t.phonePh)}
      </section>
      <section className={box}>
        {field("address", t.address, t.addressPh)}
        {field("hours", t.hours, t.hoursPh)}
      </section>

      {/* Save bar stays under the thumb while scrolling the long form */}
      <div className="sticky bottom-0 -mx-3 flex flex-col gap-2 border-t border-line bg-cream/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
        {state?.error && (
          <p role="alert" className={errorCls}>
            {state.error}
          </p>
        )}
        {state?.ok && (
          <p role="status" className="text-center text-sm font-medium text-[#2F6B3A]">
            {state.message}
          </p>
        )}
        <button type="submit" disabled={pending} className={`${primaryBtn} w-full`}>
          {pending ? t.saving : t.saveSettings}
        </button>
      </div>
    </form>
  );
}
