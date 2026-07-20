"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import LoadingOverlay from "@/components/LoadingOverlay";

// Debounced so a near-instant navigation never flashes the overlay.
const SHOW_DELAY_MS = 150;
// Safety net: if a route change never resolves visibly (e.g. it lands on the
// same URL, or an error boundary swallows the transition), don't get stuck.
const SAFETY_TIMEOUT_MS = 8000;

/**
 * Fires `onNavigate` once the URL Next.js has actually rendered changes.
 *
 * `prevKeyRef` is owned by the caller rather than a local `useRef` here: in
 * dev, `useSearchParams()` suspends on every navigation (Next's dev-only
 * Suspense DevTools instrumentation wraps it in `React.use()` of a fresh
 * per-navigation promise). That means this component gets discarded and
 * remounted by the `Suspense` boundary mid-navigation — a local ref would
 * re-initialize to the already-current key on remount, so the "did the key
 * change" check below would always be false and `onNavigate` would never
 * fire, leaving the overlay armed with nothing to clear it. A ref held by
 * the never-unmounting parent survives that remount.
 */
function NavigationWatcher({
  prevKeyRef,
  onNavigate,
}: {
  prevKeyRef: { current: string | null };
  onNavigate: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const key = `${pathname}?${searchParams.toString()}`;

  useEffect(() => {
    if (prevKeyRef.current !== null && prevKeyRef.current !== key) {
      onNavigate();
    }
    prevKeyRef.current = key;
  }, [key, onNavigate, prevKeyRef]);

  return null;
}

/**
 * App-wide, full-viewport navigation indicator.
 *
 * `loading.tsx` only ever replaces the page content inside whichever layout
 * is shared by the source and destination routes — the header and bottom nav
 * in `(storefront)/layout.tsx` intentionally stay mounted across client
 * navigations (that's what makes them feel instant, not a bug). That leaves
 * no first-party way to cover the *whole* screen during a transition, which
 * is what an app shell needs. This fills that gap.
 *
 * Navigation start has no public "before navigate" hook in the App Router
 * (see `useLinkStatus`, which is scoped per-<Link>); every client-side
 * transition — Link clicks and programmatic router.push/replace alike —
 * goes through the History API under the hood, so that's the one reliable
 * global signal. Navigation end is the next pathname/searchParams change.
 */
export default function RouteTransitionOverlay() {
  const [pending, setPending] = useState(false);
  const [visible, setVisible] = useState(false);
  const prevKeyRef = useRef<string | null>(null);

  function start() {
    // Next's router calls history.pushState/replaceState from inside a
    // useInsertionEffect (e.g. while scheduling a transition), and React
    // forbids scheduling state updates synchronously from that phase. Escape
    // the current call stack with a microtask before setting state.
    queueMicrotask(() => setPending(true));
  }
  function stop() {
    setPending(false);
  }

  useEffect(() => {
    if (!pending) {
      setVisible(false);
      return;
    }
    const showTimer = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    const safetyTimer = setTimeout(() => setPending(false), SAFETY_TIMEOUT_MS);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(safetyTimer);
    };
  }, [pending]);

  useEffect(() => {
    function internalAnchorFor(target: EventTarget | null): HTMLAnchorElement | null {
      if (!(target instanceof Element)) return null;
      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return null;
      if (anchor.target && anchor.target !== "_self") return null;
      if (anchor.hasAttribute("download")) return null;
      try {
        return new URL(anchor.href, window.location.href).origin === window.location.origin
          ? anchor
          : null;
      } catch {
        return null;
      }
    }

    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = internalAnchorFor(e.target);
      if (!anchor) return;
      // A link to the page already showing shouldn't arm the overlay — there's
      // no destination render to wait for, so nothing would ever turn it off.
      if (anchor.href === window.location.href) return;
      start();
    }

    // Next (and the browser) can legitimately call pushState/replaceState more
    // than once for a single logical navigation — e.g. a trailing replaceState
    // for scroll-position bookkeeping after the new page already rendered.
    // Arming the overlay on every call means one of these no-op calls can fire
    // *after* the real transition finished, with no further URL change left to
    // clear it — it then just sits there until the safety timeout, which is
    // effectively "on a timer" instead of tracking real completion. Only a
    // call that actually changes the URL counts as a navigation start.
    function targetUrl(url: string | URL | null | undefined) {
      if (url == null) return window.location.href;
      try {
        return new URL(url, window.location.href).href;
      } catch {
        return window.location.href;
      }
    }

    const originalPush = window.history.pushState;
    const originalReplace = window.history.replaceState;
    window.history.pushState = function (this: History, ...args: Parameters<History["pushState"]>) {
      if (targetUrl(args[2]) !== window.location.href) start();
      return originalPush.apply(this, args);
    };
    window.history.replaceState = function (
      this: History,
      ...args: Parameters<History["replaceState"]>
    ) {
      if (targetUrl(args[2]) !== window.location.href) start();
      return originalReplace.apply(this, args);
    };

    document.addEventListener("click", onClick);
    window.addEventListener("popstate", start);

    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("popstate", start);
      window.history.pushState = originalPush;
      window.history.replaceState = originalReplace;
    };
  }, []);

  return (
    <>
      <Suspense fallback={null}>
        <NavigationWatcher prevKeyRef={prevKeyRef} onNavigate={stop} />
      </Suspense>
      <LoadingOverlay show={visible} />
    </>
  );
}
