// Admin operations, called from the admin page in the browser.
// Checks here are for friendly messages; the real protection is Supabase Row Level
// Security + table constraints (supabase/schema.sql), which no browser code can bypass.
import { AUTH_EVENT, login, logout } from "./auth";
import { safeHttpsUrl } from "./contact";
import { t, type Dict } from "./i18n";
import { priceDigits } from "./price";
import {
  addCategory,
  categoryExists,
  countProductsInCategory,
  deleteCategory,
  deleteImage,
  deleteProduct,
  getProductImagePath,
  ImageError,
  insertProduct,
  moveCategory,
  renameCategory,
  saveImage,
  saveSettings,
  setProductVisible,
  updateProduct,
} from "./store";
import { saveLastEmail, setRememberLogin, supabase } from "./supabase";
import type { ActionResult, Settings } from "./types";

/** Fired after any successful change so the admin page reloads its data. */
export const STORE_EVENT = "flower-store-changed";

/** Reads a trimmed string field and caps its length. */
function text(fd: FormData, key: string, max: number): string {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

const fail = (error: string): ActionResult => ({ ok: false, error });

// Postgres uuid columns reject anything else; checking first gives a clean error instead.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Wraps every admin change: needs a login, turns unexpected errors into a generic message. */
async function asAdmin(fn: (sb: ReturnType<typeof supabase>, t: Dict) => Promise<ActionResult>): Promise<ActionResult> {
  const sb = supabase();
  const { data } = await sb.auth.getSession();
  if (!data.session) {
    window.dispatchEvent(new Event(AUTH_EVENT));
    return fail(t.sessionExpired);
  }
  try {
    const result = await fn(sb, t);
    if (result.ok) window.dispatchEvent(new Event(STORE_EVENT));
    return result;
  } catch (e) {
    console.error(e);
    return fail(t.errSaveFailed);
  }
}

// ---------- Login ----------

export async function loginAction(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const email = text(fd, "email", 200);
  setRememberLogin(fd.get("remember") === "on"); // decides where the session is stored
  const result = await login(email, text(fd, "password", 200));
  if (result === "ok") saveLastEmail(email);
  if (result === "invalid") return fail(t.loginInvalid);
  if (result === "notAdmin") return fail(t.loginNotAdmin);
  if (result === "tooMany") return fail(t.loginTooMany);
  window.dispatchEvent(new Event(AUTH_EVENT));
  return { ok: true };
}

export async function logoutAction(): Promise<void> {
  await logout();
  window.dispatchEvent(new Event(AUTH_EVENT));
}

// ---------- Products ----------

export async function saveProductAction(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  return asAdmin(async (sb, t) => {
    const id = text(fd, "id", 64);
    const input = {
      name: text(fd, "name", 120),
      categoryId: text(fd, "categoryId", 64),
      price: priceDigits(text(fd, "price", 60)), // "500.000" → "500000"
      description: text(fd, "description", 2000),
      tag: text(fd, "tag", 30),
      visible: fd.get("visible") === "on",
    };
    if (!input.name) return fail(t.errNeedName);
    if (id && !UUID_RE.test(id)) return fail(t.errProductNotFound);
    if (!UUID_RE.test(input.categoryId) || !(await categoryExists(sb, input.categoryId))) return fail(t.errNeedCategory);

    const oldImage = id ? await getProductImagePath(sb, id) : null;
    if (oldImage === undefined) return fail(t.errProductNotFound);

    const file = fd.get("image");
    let newImage: string | null = null;
    if (file instanceof Blob && file.size > 0) {
      try {
        newImage = await saveImage(sb, file);
      } catch (e) {
        if (e instanceof ImageError) return fail(e.code === "tooBig" ? t.errImageTooBig : t.errImageType);
        throw e;
      }
    }
    const removeImage = fd.get("removeImage") === "on";

    try {
      if (id) await updateProduct(sb, id, input, newImage ?? (removeImage ? null : undefined));
      else await insertProduct(sb, input, newImage);
    } catch (e) {
      await deleteImage(sb, newImage); // don't leave an orphan photo behind
      throw e;
    }
    if (newImage || removeImage) await deleteImage(sb, oldImage);
    return { ok: true, message: t.msgSaved };
  });
}

export async function deleteProductAction(id: string): Promise<ActionResult> {
  return asAdmin(async (sb, t) => {
    if (!UUID_RE.test(String(id))) return fail(t.errProductNotFound);
    await deleteImage(sb, await deleteProduct(sb, id));
    return { ok: true };
  });
}

export async function setProductVisibleAction(id: string, visible: boolean): Promise<ActionResult> {
  return asAdmin(async (sb, t) => {
    if (!UUID_RE.test(String(id))) return fail(t.errProductNotFound);
    await setProductVisible(sb, id, Boolean(visible));
    return { ok: true };
  });
}

// ---------- Categories ----------

export async function addCategoryAction(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  return asAdmin(async (sb, t) => {
    const name = text(fd, "name", 60);
    if (!name) return fail(t.errNeedCategoryName);
    if ((await addCategory(sb, name)) === "duplicate") return fail(t.errCategoryExists);
    return { ok: true, message: t.msgCategoryAdded };
  });
}

export async function renameCategoryAction(id: string, rawName: string): Promise<ActionResult> {
  return asAdmin(async (sb, t) => {
    const name = String(rawName).trim().slice(0, 60);
    if (!name) return fail(t.errNeedCategoryName);
    if (!UUID_RE.test(String(id))) return fail(t.errCategoryNotFound);
    if ((await renameCategory(sb, id, name)) === "duplicate") return fail(t.errCategoryExists);
    return { ok: true };
  });
}

export async function moveCategoryAction(id: string, dir: -1 | 1): Promise<ActionResult> {
  return asAdmin(async (sb, t) => {
    if (!UUID_RE.test(String(id))) return fail(t.errCategoryNotFound);
    await moveCategory(sb, id, dir === -1 ? -1 : 1);
    return { ok: true };
  });
}

export async function deleteCategoryAction(id: string): Promise<ActionResult> {
  return asAdmin(async (sb, t) => {
    if (!UUID_RE.test(String(id))) return fail(t.errCategoryNotFound);
    const used = await countProductsInCategory(sb, id);
    if (used > 0) return fail(t.errCategoryInUse(used));
    await deleteCategory(sb, id);
    return { ok: true };
  });
}

// ---------- Shop settings ----------

export async function saveSettingsAction(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  return asAdmin(async (sb, t) => {
    const facebookRaw = text(fd, "facebookUrl", 300);
    const facebookUrl = facebookRaw ? safeHttpsUrl(facebookRaw) : "";
    if (facebookUrl === null) return fail(t.errFacebookHttps);

    const settings: Settings = {
      shopName: text(fd, "shopName", 80) || "ຮ້ານດອກໄມ້",
      tagline: text(fd, "tagline", 120),
      headline: text(fd, "headline", 160),
      phone: text(fd, "phone", 30),
      lineId: text(fd, "lineId", 60),
      whatsapp: text(fd, "whatsapp", 30),
      facebookUrl,
      address: text(fd, "address", 300),
      hours: text(fd, "hours", 120),
    };
    await saveSettings(sb, settings);
    return { ok: true, message: t.msgSettingsSaved };
  });
}
