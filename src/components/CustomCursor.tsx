"use client";

import { useEffect, useRef } from "react";
import { Pointer } from "lucide-react";

/**
 * Context-aware custom cursor: a brand arrow that tracks the pointer 1:1 plus
 * a trailing ring that eases behind it and morphs by what it's over —
 *   · interactive (links/buttons/inputs) → ring grows with a soft brand fill
 *   · [data-cursor="Label"] targets      → ring becomes a filled pill ("View")
 * Mouse-only by design: activates on fine pointers, never on touch.
 *
 * CSS-driven animation: the mousemove handler only writes target transforms;
 * the ring's trailing is a compositor-thread `transform` transition, so it
 * stays fluid even when the JS main thread is busy. No rAF loop, no per-frame
 * work, zero React re-renders. All styles are inline/JS-applied (including
 * `cursor: none`, injected as a <style> tag) — nothing depends on stylesheet
 * delivery.
 */

const BASE: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  zIndex: 9999,
  pointerEvents: "none",
  opacity: 0,
  transform: "translate3d(-100px, -100px, 0)",
  willChange: "transform",
};

const DOT: React.CSSProperties = {
  ...BASE,
  width: 22,
  height: 22,
  transition: "width 0.15s ease, height 0.15s ease, opacity 0.15s ease",
};

// The ring's trailing lives entirely in this transform transition — the
// compositor retargets it smoothly on every mousemove.
const RING_EASE = "transform 0.22s cubic-bezier(0.22, 1, 0.36, 1)";

const RING: React.CSSProperties = {
  ...BASE,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 34,
  height: 34,
  borderRadius: 9999,
  border: "1.5px solid color-mix(in srgb, var(--foreground) 32%, transparent)",
  background: "transparent",
  transition: `${RING_EASE}, width 0.18s cubic-bezier(0.33,1,0.68,1), height 0.18s cubic-bezier(0.33,1,0.68,1), background-color 0.18s ease, border-color 0.18s ease, opacity 0.15s ease`,
};

const LABEL: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.02em",
  whiteSpace: "nowrap",
  color: "var(--brand-foreground)",
  opacity: 0,
  transition: "opacity 0.15s ease",
};

/** Ring geometry per state; press tightens each for tactile feedback. */
const RING_SIZE: Record<string, { w: number; h: number; pw: number; ph: number }> = {
  default: { w: 34, h: 34, pw: 26, ph: 26 },
  link: { w: 48, h: 48, pw: 40, ph: 40 },
  label: { w: 64, h: 30, pw: 58, ph: 28 },
};

/** Stacked glyph layers inside the dot — JS crossfades between them. */
const GLYPH: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  transition: "opacity 0.12s ease",
};

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<HTMLDivElement>(null);
  const handRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    // Mouse-driven devices only — phones/tablets keep their native (no)
    // cursor. `hover: hover` filters out touch-first devices that misreport a
    // fine pointer.
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const dot = dotRef.current;
    const arrow = arrowRef.current;
    const hand = handRef.current;
    const ring = ringRef.current;
    const label = labelRef.current;
    if (!dot || !arrow || !hand || !ring || !label) return;

    // Hide the native cursor everywhere via an injected tag — guaranteed to
    // ship with the JS, so the custom and native cursors can never both go
    // missing. The custom cursor is the only cursor, over every element type.
    const styleEl = document.createElement("style");
    styleEl.textContent = "*,*::before,*::after{cursor:none !important}";
    document.head.appendChild(styleEl);

    // Reduced motion: the ring snaps with the pointer instead of trailing.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      ring.style.transition = RING.transition!.toString().replace(
        RING_EASE,
        "transform 0s"
      );
    }

    let seen = false;
    let inWindow = true;
    let state = "default";
    let pressed = false;
    let lastTarget: Element | null = null;
    // Hybrid (touch-screen laptop) support: hide while the user is touching;
    // real mouse movement brings the cursor back.
    let lastTouch = 0;

    const applyStyle = () => {
      const size = RING_SIZE[state] ?? RING_SIZE.default;
      ring.style.width = `${pressed ? size.pw : size.w}px`;
      ring.style.height = `${pressed ? size.ph : size.h}px`;
      if (state === "link") {
        ring.style.borderColor = "color-mix(in srgb, var(--brand) 60%, transparent)";
        ring.style.background = "color-mix(in srgb, var(--brand) 12%, transparent)";
      } else if (state === "label") {
        ring.style.borderColor = "var(--brand)";
        ring.style.background = "var(--brand)";
      } else {
        ring.style.borderColor =
          "color-mix(in srgb, var(--foreground) 32%, transparent)";
        ring.style.background = "transparent";
      }
      // Glyph swap: arrow by default, pointing hand over anything clickable.
      arrow.style.opacity = state === "default" ? "1" : "0";
      hand.style.opacity = state === "link" ? "1" : "0";
      label.style.opacity = state === "label" ? "1" : "0";

      const show = seen && inWindow;
      ring.style.opacity = show ? "1" : "0";
      // The arrow hides only while the ring is a labelled pill.
      dot.style.opacity = show && state !== "label" ? "1" : "0";
    };

    // One union query so the NEAREST matching ancestor decides the state —
    // e.g. a wishlist button inside a data-cursor="View" card reads as a
    // button, not as the card. Inputs count as interactive like anything else:
    // the cursor is consistent across every element type.
    const TARGETS =
      '[data-cursor], a, button, [role="button"], input, textarea, select, summary, label, [contenteditable="true"]';

    const stateFor = (el: Element | null): [string, string] => {
      const target = el?.closest<HTMLElement>(TARGETS);
      if (!target) return ["default", ""];
      if (target.dataset.cursor) return ["label", target.dataset.cursor];
      return ["link", ""];
    };

    const onTouch = () => {
      lastTouch = Date.now();
      if (inWindow) {
        inWindow = false;
        applyStyle();
      }
    };

    const onMove = (e: MouseEvent) => {
      // Ignore the synthetic mousemoves browsers fire right after a touch.
      if (Date.now() - lastTouch < 500) return;
      if (!inWindow) {
        inWindow = true;
        applyStyle();
      }
      const x = e.clientX;
      const y = e.clientY;
      if (!seen) {
        // First movement: materialize at the pointer — jump the ring there
        // with its transition suspended so it doesn't fly in from a corner.
        seen = true;
        const t = ring.style.transition;
        ring.style.transition = "none";
        ring.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
        void ring.offsetWidth; // flush so the jump isn't animated
        ring.style.transition = t;
        applyStyle();
      } else {
        // The compositor eases the ring toward each new target on its own.
        ring.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      }
      // The arrow's tip (top-left of the glyph) sits on the pointer, so a
      // small fixed offset replaces the centering translate the ring uses.
      dot.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-4px, -4px)`;

      // Re-classify only when the hovered element actually changes — the
      // closest() walk is the most expensive part of the handler.
      if (e.target !== lastTarget) {
        lastTarget = e.target as Element;
        const [next, text] = stateFor(lastTarget);
        if (text && label.textContent !== text) label.textContent = text;
        if (next !== state) {
          state = next;
          applyStyle();
        }
      }
    };

    const onDown = () => {
      pressed = true;
      applyStyle();
    };
    const onUp = () => {
      pressed = false;
      applyStyle();
    };
    const onLeave = () => {
      inWindow = false;
      applyStyle();
    };
    const onEnter = () => {
      inWindow = true;
      applyStyle();
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("touchstart", onTouch, { passive: true });
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    document.documentElement.addEventListener("mouseleave", onLeave);
    document.documentElement.addEventListener("mouseenter", onEnter);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchstart", onTouch);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      document.documentElement.removeEventListener("mouseenter", onEnter);
      styleEl.remove();
    };
  }, []);

  return (
    <>
      <div ref={dotRef} style={DOT} aria-hidden="true">
        {/* Mini pointer glyph — brand fill with a hairline background-colored
            stroke so it stays legible over brand-colored surfaces. */}
        <div ref={arrowRef} style={GLYPH}>
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 24 24"
            fill="var(--brand)"
            stroke="var(--background)"
            strokeWidth="1"
            strokeLinejoin="round"
          >
            <path d="M4.037 4.688a.495.495 0 0 1 .651-.651l16 6.5a.5.5 0 0 1-.063.947l-6.124 1.58a2 2 0 0 0-1.438 1.435l-1.579 6.126a.5.5 0 0 1-.947.063z" />
          </svg>
        </div>
        {/* Pointing hand for anything clickable — the classic affordance. */}
        <div ref={handRef} style={{ ...GLYPH, opacity: 0 }}>
          <Pointer
            width="100%"
            height="100%"
            fill="var(--brand)"
            stroke="var(--background)"
            strokeWidth={1.25}
          />
        </div>
      </div>
      <div ref={ringRef} style={RING} aria-hidden="true">
        <span ref={labelRef} style={LABEL} />
      </div>
    </>
  );
}
