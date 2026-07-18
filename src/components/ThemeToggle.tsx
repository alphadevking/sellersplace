"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

const STORAGE_KEY = "sellersplace:theme";
const THEME_EVENT = "sellersplace:themechange";

function subscribe(callback: () => void) {
  window.addEventListener(THEME_EVENT, callback);
  return () => window.removeEventListener(THEME_EVENT, callback);
}

function isDark() {
  return document.documentElement.getAttribute("data-theme") === "dark";
}

/**
 * Light/dark switch — mirrors the design system's ThemeToggle: sets
 * data-theme on <html> (tokens flip via [data-theme="dark"] in globals.css)
 * and persists the choice. A tiny inline script in the root layout applies
 * the stored theme before hydration so there's no flash.
 */
export default function ThemeToggle() {
  // Server snapshot is "light"; the store re-syncs right after hydration.
  const dark = useSyncExternalStore(subscribe, isDark, () => false);

  function toggle() {
    const next = !dark;
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
    try {
      window.localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
    } catch {
      // Private mode etc. — the toggle still works for this page view.
    }
    window.dispatchEvent(new Event(THEME_EVENT));
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="rounded-full p-1.5 text-foreground/80 transition-colors hover:bg-surface hover:text-foreground"
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
