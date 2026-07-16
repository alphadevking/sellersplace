"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { emojiForCategorySlug } from "@/lib/category-icons";

type SearchResult = {
  id: string;
  slug: string;
  name: string;
  price: string;
  images: string[];
  category?: { slug: string; name: string } | null;
};

const DEBOUNCE_MS = 250;
const MIN_QUERY_LENGTH = 2;

export default function SearchBar({ className = "" }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const trimmed = query.trim();

  // Reset when the route changes (e.g. back/forward navigation) — the
  // render-time adjustment pattern, so no extra effect pass is needed.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setOpen(false);
    setActiveIndex(-1);
  }

  // Debounced typeahead fetch. All setState happens inside the debounce/fetch
  // callbacks (never synchronously in the effect body); the cleanup aborts the
  // in-flight request when the user keeps typing.
  useEffect(() => {
    if (trimmed.length < MIN_QUERY_LENGTH) return;

    const controller = new AbortController();
    abortRef.current = controller;
    const timer = setTimeout(() => {
      setLoading(true);
      fetch(`/api/products?q=${encodeURIComponent(trimmed)}`, { signal: controller.signal })
        .then((res) => res.json())
        .then((data) => {
          setResults(data.products || []);
          setTotal(data.total ?? (data.products?.length || 0));
          setActiveIndex(-1);
          setLoading(false);
        })
        .catch((err) => {
          if (err?.name !== "AbortError") setLoading(false);
        });
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed]);

  // Close on click/tap outside.
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  function goToAllResults() {
    if (!trimmed) return;
    setOpen(false);
    router.push(`/products?q=${encodeURIComponent(trimmed)}`);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!open || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? results.length - 1 : i - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      setOpen(false);
      router.push(`/products/${results[activeIndex].slug}`);
    }
  }

  const showDropdown = open && trimmed.length >= MIN_QUERY_LENGTH;

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          goToAllResults();
        }}
      >
        <label
          className="flex items-center gap-2 rounded-xl bg-surface px-3.5 py-2.5 text-sm text-muted transition-shadow focus-within:ring-2"
          style={{ ["--tw-ring-color" as string]: "var(--brand-soft)" }}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
          ) : (
            <Search className="h-4 w-4 shrink-0" />
          )}
          <input
            type="search"
            name="q"
            value={query}
            onChange={(e) => {
              const value = e.target.value;
              setQuery(value);
              setOpen(true);
              if (value.trim().length < MIN_QUERY_LENGTH) {
                setResults([]);
                setTotal(0);
                setLoading(false);
              }
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder="Search products…"
            autoComplete="off"
            role="combobox"
            aria-expanded={showDropdown}
            aria-autocomplete="list"
            aria-controls="search-results"
            className="w-full bg-transparent text-foreground outline-none placeholder:text-muted"
          />
        </label>
      </form>

      {showDropdown && (
        <div
          className="absolute inset-x-0 top-full z-40 mt-2 overflow-hidden rounded-xl border bg-background shadow-lg shadow-black/5"
          style={{ borderColor: "var(--border)" }}
        >
          {results.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted">
              {loading ? "Searching…" : `No products match “${trimmed}”.`}
            </p>
          ) : (
            <>
              <ul id="search-results" className="max-h-80 overflow-y-auto overscroll-contain" role="listbox">
                {results.map((product, index) => (
                  <li key={product.id} role="option" aria-selected={index === activeIndex}>
                    <Link
                      href={`/products/${product.slug}`}
                      onClick={() => setOpen(false)}
                      onMouseEnter={() => setActiveIndex(index)}
                      className="flex items-center gap-3 px-3 py-2.5 transition-colors"
                      style={{
                        background: index === activeIndex ? "var(--surface)" : "transparent",
                      }}
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface text-lg">
                        {product.images?.[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={product.images[0]}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          emojiForCategorySlug(product.category?.slug)
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-foreground">
                          {product.name}
                        </span>
                        {product.category && (
                          <span className="block truncate text-xs text-muted">
                            {product.category.name}
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 text-sm font-semibold" style={{ color: "var(--brand)" }}>
                        {formatCurrency(Number(product.price))}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={goToAllResults}
                className="w-full border-t px-3 py-2.5 text-center text-xs font-medium transition-colors hover:bg-surface"
                style={{ borderColor: "var(--border)", color: "var(--brand)" }}
              >
                {total > results.length
                  ? `View all ${total} results`
                  : `View all results for “${trimmed}”`}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
