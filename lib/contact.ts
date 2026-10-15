// Builds contact links from the shop settings. Safe to use on server and client.
import type { Settings } from "./types";

export function telLink(phone: string): string | null {
  const digits = phone.replace(/[^\d+]/g, "");
  return digits ? `tel:${digits}` : null;
}

/** LINE Official Accounts ("@xxx") can receive a pre-filled message; personal IDs open the profile. */
export function lineLink(lineId: string, text?: string): string | null {
  const id = lineId.trim();
  if (!id) return null;
  if (id.startsWith("@")) {
    const query = text ? `?${encodeURIComponent(text)}` : "";
    return `https://line.me/R/oaMessage/${encodeURIComponent(id)}/${query}`;
  }
  return `https://line.me/ti/p/~${encodeURIComponent(id)}`;
}

export function whatsappLink(number: string, text?: string): string | null {
  const digits = number.replace(/\D/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

/** Only https URLs are allowed, so a bad value can never become a javascript: link. */
export function safeHttpsUrl(url: string): string | null {
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === "https:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}

export type ContactLink = { kind: "line" | "whatsapp" | "facebook" | "phone"; label: string; href: string };

/** All configured channels, chat apps first. `text` pre-fills the chat when the app supports it. */
export function contactLinks(s: Settings, text?: string): ContactLink[] {
  const links: ContactLink[] = [];
  const line = lineLink(s.lineId, text);
  if (line) links.push({ kind: "line", label: "LINE", href: line });
  const wa = whatsappLink(s.whatsapp, text);
  if (wa) links.push({ kind: "whatsapp", label: "WhatsApp", href: wa });
  const fb = safeHttpsUrl(s.facebookUrl);
  if (fb) links.push({ kind: "facebook", label: "Facebook", href: fb });
  const tel = telLink(s.phone);
  if (tel) links.push({ kind: "phone", label: s.phone, href: tel });
  return links;
}
