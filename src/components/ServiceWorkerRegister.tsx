"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    // Never run the SW in dev: it network-first-caches every GET, including
    // Turbopack's HMR/streaming RSC requests, which routinely error out of
    // Cache.put() (aborted mid-transfer on every reload) and can leave a
    // navigation hanging behind a broken cache entry. Offline/installable
    // support is a production concern only.
    if (process.env.NODE_ENV !== "production") return;
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((err) => console.error("SW registration failed:", err));
    }
  }, []);

  return null;
}
