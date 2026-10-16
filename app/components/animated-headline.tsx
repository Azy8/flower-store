"use client";

import { useEffect, useMemo, useRef, type CSSProperties } from "react";

const CHAR_STEP_MS = 45; // delay between letters
const START_MS = 150;

/**
 * Splits text into words, and words into graphemes (a Lao consonant together with
 * its vowel/tone marks), so marks like ເ ິ ່ ້ never get separated from their letter.
 */
function splitText(text: string): string[][] {
  const Seg = typeof Intl !== "undefined" ? Intl.Segmenter : undefined;
  if (!Seg) return text.split(/(\s+)/).filter(Boolean).map((w) => Array.from(w));
  const words = new Seg("lo", { granularity: "word" });
  const graphemes = new Seg("lo", { granularity: "grapheme" });
  return Array.from(words.segment(text), (w) => Array.from(graphemes.segment(w.segment), (g) => g.segment));
}

/** Headline that types itself in letter by letter; a bee flies in and lands on the last letter. */
export function AnimatedHeadline({ text, subtitle }: { text: string; subtitle: string }) {
  const words = useMemo(() => splitText(text), [text]);
  const totalChars = words.reduce((n, w) => n + w.length, 0);
  const titleDoneMs = START_MS + totalChars * CHAR_STEP_MS;
  let index = 0;

  return (
    // overflow-x-clip: the bee starts off-screen without causing sideways scrolling
    <div className="overflow-x-clip">
      <h1 aria-label={text} className="max-w-xl pr-10 text-[28px] font-bold leading-[1.5] sm:text-[32px]">
        {words.map((graphemes, wi) => {
          const isLast = wi === words.length - 1;
          return (
            // each word stays on one line; letters inside appear one after another
            <span key={wi} aria-hidden className={`inline-block whitespace-pre ${isLast ? "relative" : ""}`}>
              {graphemes.map((g, gi) => (
                <span key={gi} className="headline-char inline-block" style={{ animationDelay: `${START_MS + index++ * CHAR_STEP_MS}ms` }}>
                  {g}
                </span>
              ))}
              {isLast && <Bee landAtMs={titleDoneMs} />}
            </span>
          );
        })}
      </h1>
      <p
        className="headline-float mt-2 max-w-lg text-base leading-relaxed text-muted"
        style={{ animationDelay: `${Math.max(400, titleDoneMs - 300)}ms` }}
      >
        {subtitle}
      </p>
    </div>
  );
}

// ---------- Bee flight ----------

type Pt = [number, number];

/** Points along a cubic Bézier curve (excluding the start point). */
function bezier(p0: Pt, p1: Pt, p2: Pt, p3: Pt, steps: number): Pt[] {
  return Array.from({ length: steps }, (_, i) => {
    const t = (i + 1) / steps, u = 1 - t;
    const k = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
    return [0, 1].map((d) => k[0] * p0[d] + k[1] * p1[d] + k[2] * p2[d] + k[3] * p3[d]) as Pt;
  });
}

/** One full loop, starting and ending at the bottom of the circle (heading left first). */
function loop(cx: number, cy: number, r: number, steps: number): Pt[] {
  return Array.from({ length: steps }, (_, i) => {
    const a = Math.PI / 2 + ((i + 1) / steps) * Math.PI * 2;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as Pt;
  });
}

/**
 * Flight path relative to the landing spot (0,0), following the owner's sketch:
 * enter from the top-right corner → swoop down → one loop midway →
 * glide straight left and land on the tip of the last letter.
 */
function flightPath(startX: number, startY: number, loopX: number): Pt[] {
  const start: Pt = [startX, startY];
  const r = 16, center: Pt = [loopX, 14];
  const bottom: Pt = [center[0], center[1] + r];
  return [
    start,
    ...bezier(start, [startX - 20, startY + 120], [center[0] + 90, bottom[1] + 6], bottom, 18),
    ...loop(center[0], center[1], r, 16),
    ...bezier(bottom, [center[0] * 0.6, bottom[1] + 6], [center[0] * 0.25, 4], [0, 0], 12),
  ];
}

/** Turns path points into Web Animation keyframes: face the direction of travel, tilt with climb/dive. */
function toKeyframes(pts: Pt[]): Keyframe[] {
  let facing = 1; // the SVG is drawn facing left; scaleX(-1) makes it face right
  return pts.map(([x, y], i) => {
    const [nx, ny] = pts[Math.min(i + 1, pts.length - 1)];
    const dx = nx - x, dy = ny - y;
    if (Math.abs(dx) > 0.5) facing = dx < 0 ? 1 : -1;
    const tilt = i === pts.length - 1 ? 0 : Math.max(-25, Math.min(25, dy * 2.5)) * facing * -1;
    return { transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${tilt.toFixed(1)}deg) scaleX(${facing})`, opacity: i === 0 ? 0 : 1 };
  });
}

/** Small SVG bee that flies the sketched path and perches on the tip of the last letter, then hovers. */
function Bee({ landAtMs }: { landAtMs: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const flyMs = 3000;

  useEffect(() => {
    const el = ref.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return; // just sits there
    const rect = el.getBoundingClientRect();
    const startX = window.innerWidth - rect.left + 10; // just past the right edge of the screen
    const startY = -Math.min(130, rect.top - 8); // up near the top of the page
    // the loop sits about halfway between the landing spot and the right edge of the screen
    const loopX = Math.max(55, Math.min(170, (window.innerWidth - rect.left) / 2));
    const anim = el.animate(toKeyframes(flightPath(startX, startY, loopX)), {
      duration: flyMs,
      delay: Math.max(0, landAtMs - flyMs + 300),
      easing: "cubic-bezier(.25,.1,.35,1)",
      fill: "both",
    });
    return () => anim.cancel();
  }, [landAtMs]);

  return (
    // perched on the top-right tip of the last letter
    <span ref={ref} aria-hidden className="pointer-events-none absolute -top-2.5 left-full -ml-3 h-7 w-7">
      <span className="bee-hover block h-full w-full" style={{ "--bee-bob-delay": `${landAtMs + 400}ms` } as CSSProperties}>
        {/* drawn facing left (towards the text it sits on) */}
        <svg viewBox="0 0 64 64" className="h-full w-full -scale-x-100 overflow-visible">
          {/* wings flap fast */}
          <g className="bee-wings">
            <ellipse cx="26" cy="18" rx="10" ry="14" fill="#E8F4FF" fillOpacity=".85" stroke="#9CB8D0" strokeWidth="1.5" transform="rotate(-25 26 18)" />
            <ellipse cx="38" cy="17" rx="9" ry="13" fill="#E8F4FF" fillOpacity=".85" stroke="#9CB8D0" strokeWidth="1.5" transform="rotate(20 38 17)" />
          </g>
          {/* striped body */}
          <ellipse cx="32" cy="38" rx="20" ry="14" fill="#F5C43A" stroke="#2B1B23" strokeWidth="2" />
          <path d="M24 25.5c-3 7-3 18 0 25M33 24c-3 8-3 20 0 28M42 26c-2.5 7-2.5 17 0 24" stroke="#2B1B23" strokeWidth="4" fill="none" strokeLinecap="round" />
          {/* head + face */}
          <circle cx="52" cy="35" r="8" fill="#2B1B23" />
          <circle cx="55" cy="33" r="2" fill="#fff" />
          <path d="M50 27c1-5 4-8 7-9M54 28c2-4 5-6 8-6" stroke="#2B1B23" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          {/* stinger */}
          <path d="M12 38l-6 1.5 6 1.5z" fill="#2B1B23" />
        </svg>
      </span>
    </span>
  );
}