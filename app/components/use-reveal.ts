"use client";

import { useEffect, type RefObject } from "react";

/**
 * Adds `is-visible` to every `.card-rise` inside `container` once it scrolls into view,
 * so cards rise in as the customer scrolls (not all at once off-screen).
 * `key` should change whenever the list changes (category / page), to watch the new cards.
 */
export function useReveal(container: RefObject<HTMLElement | null>, key: string) {
  useEffect(() => {
    const root = container.current;
    if (!root) return;
    const items = root.querySelectorAll<HTMLElement>(".card-rise:not(.is-visible)");
    if (!("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add("is-visible");
          io.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -40px 0px", threshold: 0.1 },
    );
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [container, key]);
}
