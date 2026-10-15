// Data layer: tables + photo storage in Supabase (runs in the browser).
// Row Level Security decides what each call may read or change.
import type { SupabaseClient } from "@supabase/supabase-js";
import { IMAGE_BUCKET } from "./supabase";
import type { Category, Product, Settings, StoreData } from "./types";

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

/** Upload rejected by our own checks (code is translated for the owner). */
export class ImageError extends Error {
  constructor(public code: "tooBig" | "badType") {
    super(code);
  }
}

type ProductRow = {
  id: string;
  name: string;
  category_id: string;
  price: string;
  description: string;
  tag: string;
  image_path: string | null;
  visible: boolean;
  created_at: string;
};

type SettingsRow = {
  shop_name: string;
  tagline: string;
  headline: string;
  phone: string;
  line_id: string;
  whatsapp: string;
  facebook_url: string;
  address: string;
  hours: string;
};

/** Throws on a Supabase error so failures never pass silently. */
function check<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(`Supabase: ${res.error.message}`);
  return res.data;
}

function imageUrl(sb: SupabaseClient, path: string | null): string | null {
  return path ? sb.storage.from(IMAGE_BUCKET).getPublicUrl(path).data.publicUrl : null;
}

const toProduct = (sb: SupabaseClient, r: ProductRow): Product => ({
  id: r.id,
  name: r.name,
  categoryId: r.category_id,
  price: r.price,
  description: r.description,
  tag: r.tag,
  image: imageUrl(sb, r.image_path),
  visible: r.visible,
  createdAt: Date.parse(r.created_at),
});

const toSettings = (r: SettingsRow): Settings => ({
  shopName: r.shop_name,
  tagline: r.tagline,
  headline: r.headline,
  phone: r.phone,
  lineId: r.line_id,
  whatsapp: r.whatsapp,
  facebookUrl: r.facebook_url,
  address: r.address,
  hours: r.hours,
});

// ---------- Reads ----------

export async function readStore(sb: SupabaseClient, opts: { onlyVisible?: boolean } = {}): Promise<StoreData> {
  let productQuery = sb.from("products").select("*").order("created_at", { ascending: false });
  if (opts.onlyVisible) productQuery = productQuery.eq("visible", true);

  const [settings, categories, products] = await Promise.all([
    sb.from("settings").select("*").eq("id", 1).maybeSingle(),
    sb.from("categories").select("id, name").order("sort").order("created_at"),
    productQuery,
  ]);
  const settingsRow = check(settings) as SettingsRow | null;
  if (!settingsRow) throw new Error("Supabase: settings row missing (run supabase/schema.sql)");
  return {
    settings: toSettings(settingsRow),
    categories: check(categories) as Category[],
    products: (check(products) as ProductRow[]).map((r) => toProduct(sb, r)),
  };
}

// ---------- Products ----------

export type ProductInput = Pick<Product, "name" | "categoryId" | "price" | "description" | "tag" | "visible">;

const toRow = (p: ProductInput) => ({
  name: p.name,
  category_id: p.categoryId,
  price: p.price,
  description: p.description,
  tag: p.tag,
  visible: p.visible,
});

export async function categoryExists(sb: SupabaseClient, id: string): Promise<boolean> {
  const rows = check(await sb.from("categories").select("id").eq("id", id).limit(1));
  return (rows ?? []).length > 0;
}

export async function getProductImagePath(sb: SupabaseClient, id: string): Promise<string | null | undefined> {
  const row = check(await sb.from("products").select("image_path").eq("id", id).maybeSingle());
  return row ? (row as { image_path: string | null }).image_path : undefined; // undefined = not found
}

export async function insertProduct(sb: SupabaseClient, p: ProductInput, imagePath: string | null) {
  check(await sb.from("products").insert({ ...toRow(p), image_path: imagePath }));
}

/** imagePath: a new path, null to remove the photo, or undefined to keep it. */
export async function updateProduct(sb: SupabaseClient, id: string, p: ProductInput, imagePath?: string | null) {
  const patch = imagePath === undefined ? toRow(p) : { ...toRow(p), image_path: imagePath };
  check(await sb.from("products").update(patch).eq("id", id));
}

export async function deleteProduct(sb: SupabaseClient, id: string): Promise<string | null> {
  const path = await getProductImagePath(sb, id);
  check(await sb.from("products").delete().eq("id", id));
  return path ?? null;
}

export async function setProductVisible(sb: SupabaseClient, id: string, visible: boolean) {
  check(await sb.from("products").update({ visible }).eq("id", id));
}

// ---------- Categories ----------

export async function addCategory(sb: SupabaseClient, name: string): Promise<"ok" | "duplicate"> {
  const rows = check(await sb.from("categories").select("sort").order("sort", { ascending: false }).limit(1)) as {
    sort: number;
  }[];
  const res = await sb.from("categories").insert({ name, sort: (rows[0]?.sort ?? 0) + 1 });
  if (res.error?.code === "23505") return "duplicate"; // unique violation
  check(res);
  return "ok";
}

export async function renameCategory(sb: SupabaseClient, id: string, name: string): Promise<"ok" | "duplicate"> {
  const res = await sb.from("categories").update({ name }).eq("id", id);
  if (res.error?.code === "23505") return "duplicate";
  check(res);
  return "ok";
}

/** Swaps a category with its neighbour; rewrites sort as 1..n to keep it tidy. */
export async function moveCategory(sb: SupabaseClient, id: string, dir: -1 | 1) {
  const list = check(await sb.from("categories").select("id").order("sort").order("created_at")) as { id: string }[];
  const i = list.findIndex((c) => c.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  await Promise.all(list.map((c, n) => sb.from("categories").update({ sort: n + 1 }).eq("id", c.id).then(check)));
}

export async function countProductsInCategory(sb: SupabaseClient, id: string): Promise<number> {
  const res = await sb.from("products").select("id", { count: "exact", head: true }).eq("category_id", id);
  check(res);
  return res.count ?? 0;
}

export async function deleteCategory(sb: SupabaseClient, id: string) {
  check(await sb.from("categories").delete().eq("id", id));
}

// ---------- Settings ----------

export async function saveSettings(sb: SupabaseClient, s: Settings) {
  check(
    await sb.from("settings").upsert({
      id: 1,
      shop_name: s.shopName,
      tagline: s.tagline,
      headline: s.headline,
      phone: s.phone,
      line_id: s.lineId,
      whatsapp: s.whatsapp,
      facebook_url: s.facebookUrl,
      address: s.address,
      hours: s.hours,
    }),
  );
}

// ---------- Images ----------

const MIME = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" } as const;

const PNG_SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const ascii = (b: Uint8Array, from: number, to: number) => String.fromCharCode(...b.subarray(from, to));

/**
 * Detects the real image type from the file's first bytes (never trust the file name).
 * Note: this runs in the browser, so it's a convenience check; the storage bucket itself
 * only accepts jpeg/png/webp up to 8MB and only from admins (supabase/schema.sql).
 */
function sniffImageType(b: Uint8Array): keyof typeof MIME | null {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpg";
  if (b.length >= 8 && PNG_SIG.every((v, i) => b[i] === v)) return "png";
  if (b.length >= 12 && ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 12) === "WEBP") return "webp";
  return null;
}

/** Validates and uploads an image. Returns its path in the bucket. */
export async function saveImage(sb: SupabaseClient, file: Blob): Promise<string> {
  if (file.size > MAX_IMAGE_BYTES) throw new ImageError("tooBig");
  const ext = sniffImageType(new Uint8Array(await file.slice(0, 16).arrayBuffer()));
  if (!ext) throw new ImageError("badType");
  const path = `${crypto.randomUUID()}.${ext}`; // random name: never collides, safe to cache forever
  check(
    await sb
      .storage.from(IMAGE_BUCKET)
      .upload(path, file, { contentType: MIME[ext], cacheControl: "31536000", upsert: false }),
  );
  return path;
}

export async function deleteImage(sb: SupabaseClient, path: string | null | undefined): Promise<void> {
  if (!path) return;
  // Best effort: a leftover file is harmless, so don't fail the user's action over it.
  await sb.storage.from(IMAGE_BUCKET).remove([path]);
}
