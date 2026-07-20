"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import LoadingOverlay from "@/components/LoadingOverlay";

// Debounced so a near-instant navigation never flashes the overlay.
const SHOW_DELAY_MS = 150;
// Safety net: if a route change never resolves visibly (e.g. it lands on the
// same URL, or an error boundary swallows the transition), don't get stuck.
const SAFETY_TIMEOUT_MS = 8000;

/** Fires `onNavigate` once the URL Next.js has actually rendered changes. */
function NavigationWatcher({ onNavigate }: { onNavigate: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const key = `${pathname}?${searchParams.toString()}`;
  const prevKey = useRef(key);

  useEffect(() => {
    if (prevKey.current !== key) {
      prevKey.current = key;
      onNavigate();
    }
  }, [key, onNavigate]);

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
    function isInternalAnchorClick(target: EventTarget | null) {
      if (!(target instanceof Element)) return false;
      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return false;
      if (anchor.target && anchor.target !== "_self") return false;
      if (anchor.hasAttribute("download")) return false;
      try {
        return new URL(anchor.href, window.location.href).origin === window.location.origin;
      } catch {
        return false;
      }
    }

    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (isInternalAnchorClick(e.target)) start();
    }

    const originalPush = window.history.pushState;
    const originalReplace = window.history.replaceState;
    window.history.pushState = function (this: History, ...args: Parameters<History["pushState"]>) {
      start();
      return originalPush.apply(this, args);
    };
    window.history.replaceState = function (
      this: History,
      ...args: Parameters<History["replaceState"]>
    ) {
      start();
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
        <NavigationWatcher onNavigate={stop} />
      </Suspense>
      <LoadingOverlay show={visible} />
    </>
  );
}
