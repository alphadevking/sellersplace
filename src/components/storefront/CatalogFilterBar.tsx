"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import { formatCurrency } from "@/lib/currency";

export type SortOption = { value: string; label: string };

type Props = {
  brands: string[];
  selectedBrands: string[];
  bounds: { min: number; max: number };
  min?: number;
  max?: number;
  sort: string;
  sortOptions: SortOption[];
  query?: string;
  category?: string;
};

/**
 * Jumia-style filter bar: pill triggers opening popovers — Brand (search +
 * multi-select checkboxes, Clear All/Save) and Price (dual-thumb slider
 * bounded to the real catalog range + numeric inputs, Reset/Save). Applying
 * navigates with URL params, so results stay server-rendered and shareable.
 */
export default function CatalogFilterBar({
  brands,
  selectedBrands,
  bounds,
  min,
  max,
  sort,
  sortOptions,
  query,
  category,
}: Props) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<"brand" | "price" | null>(null);

  const [checked, setChecked] = useState<Set<string>>(new Set(selectedBrands));
  const [brandSearch, setBrandSearch] = useState("");

  const [lo, setLo] = useState(min ?? bounds.min);
  const [hi, setHi] = useState(max ?? bounds.max);

  // Close popovers on outside click.
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(null);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const visibleBrands = useMemo(() => {
    const needle = brandSearch.trim().toLowerCase();
    return needle ? brands.filter((b) => b.toLowerCase().includes(needle)) : brands;
  }, [brands, brandSearch]);

  function navigate(params: {
    brands?: string[];
    min?: number | null;
    max?: number | null;
    sort?: string;
  }) {
    const search = new URLSearchParams();
    if (query) search.set("q", query);
    if (category) search.set("category", category);
    const brandList = params.brands ?? [...checked];
    if (brandList.length) search.set("brand", brandList.join(","));
    const nextMin = params.min === null ? undefined : (params.min ?? (lo > bounds.min ? lo : undefined));
    const nextMax = params.max === null ? undefined : (params.max ?? (hi < bounds.max ? hi : undefined));
    if (nextMin != null) search.set("min", String(nextMin));
    if (nextMax != null) search.set("max", String(nextMax));
    const nextSort = params.sort ?? sort;
    if (nextSort && nextSort !== "newest") search.set("sort", nextSort);
    setOpen(null);
    const qs = search.toString();
    router.push(qs ? `/products?${qs}` : "/products");
  }

  const brandActive = selectedBrands.length > 0;
  const priceActive = min != null || max != null;
  const hasRange = bounds.max > bounds.min;
  const pct = (v: number) => ((v - bounds.min) / Math.max(1, bounds.max - bounds.min)) * 100;

  const pill = (active: boolean, isOpen: boolean) =>
    ({
      background: active || isOpen ? "var(--brand-soft)" : "var(--surface)",
      color: active || isOpen ? "var(--brand)" : "var(--foreground)",
      border: `1px solid ${active || isOpen ? "var(--brand)" : "var(--border)"}`,
    }) as const;

  return (
    <div ref={rootRef} className="relative flex flex-wrap items-center gap-2 text-sm">
      {brands.length > 0 && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen(open === "brand" ? null : "brand")}
            className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors"
            style={pill(brandActive, open === "brand")}
          >
            Brand{brandActive ? ` (${selectedBrands.length})` : ""}
            {open === "brand" ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>

          {open === "brand" && (
            <div
              className="absolute left-0 top-full z-40 mt-2 w-64 rounded-xl border bg-background p-3 shadow-lg shadow-black/5"
              style={{ borderColor: "var(--border)" }}
            >
              <label
                className="mb-2 flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs"
                style={{ borderColor: "var(--border)" }}
              >
                <Search className="h-3.5 w-3.5 text-muted" />
                <input
                  value={brandSearch}
                  onChange={(e) => setBrandSearch(e.target.value)}
                  placeholder="Search"
                  className="w-full bg-transparent outline-none placeholder:text-muted"
                />
              </label>
              <ul className="max-h-48 overflow-y-auto overscroll-contain">
                {visibleBrands.length === 0 && (
                  <li className="px-1 py-2 text-xs text-muted">No brands match.</li>
                )}
                {visibleBrands.map((b) => (
                  <li key={b}>
                    <label className="flex cursor-pointer items-center gap-2 rounded-lg px-1 py-1.5 text-sm hover:bg-surface">
                      <input
                        type="checkbox"
                        checked={checked.has(b)}
                        onChange={() =>
                          setChecked((prev) => {
                            const next = new Set(prev);
                            if (next.has(b)) next.delete(b);
                            else next.add(b);
                            return next;
                          })
                        }
                        className="h-4 w-4 accent-[var(--brand)]"
                      />
                      {b}
                    </label>
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex gap-2 border-t pt-2" style={{ borderColor: "var(--border)" }}>
                <button
                  type="button"
                  onClick={() => {
                    setChecked(new Set());
                    navigate({ brands: [] });
                  }}
                  className="btn-outline flex-1 !py-1.5 text-xs"
                >
                  Clear All
                </button>
                <button
                  type="button"
                  onClick={() => navigate({})}
                  className="btn-primary flex-1 !py-1.5 text-xs"
                >
                  Save
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {hasRange && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen(open === "price" ? null : "price")}
            className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors"
            style={pill(priceActive, open === "price")}
          >
            Price
            {open === "price" ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>

          {open === "price" && (
            <div
              className="absolute left-0 top-full z-40 mt-2 w-72 rounded-xl border bg-background p-4 shadow-lg shadow-black/5"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="mb-1 flex justify-between text-xs text-muted">
                <span>{formatCurrency(lo)}</span>
                <span>{formatCurrency(hi)}</span>
              </div>
              <div className="dual-range mb-3">
                <div
                  className="absolute top-1/2 h-1 w-full -translate-y-1/2 rounded-full"
                  style={{ background: "var(--border)" }}
                />
                <div
                  className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full"
                  style={{
                    background: "var(--brand)",
                    left: `${pct(lo)}%`,
                    width: `${Math.max(0, pct(hi) - pct(lo))}%`,
                  }}
                />
                <input
                  type="range"
                  min={bounds.min}
                  max={bounds.max}
                  value={lo}
                  onChange={(e) => setLo(Math.min(Number(e.target.value), hi))}
                  aria-label="Minimum price"
                />
                <input
                  type="range"
                  min={bounds.min}
                  max={bounds.max}
                  value={hi}
                  onChange={(e) => setHi(Math.max(Number(e.target.value), lo))}
                  aria-label="Maximum price"
                />
              </div>
              <div className="mb-3 flex items-center gap-2">
                <input
                  type="number"
                  value={lo}
                  min={bounds.min}
                  max={bounds.max}
                  onChange={(e) => setLo(Math.min(Number(e.target.value) || bounds.min, hi))}
                  aria-label="Minimum price input"
                  className="input-field !py-1.5 text-xs"
                />
                <span className="text-muted">–</span>
                <input
                  type="number"
                  value={hi}
                  min={bounds.min}
                  max={bounds.max}
                  onChange={(e) => setHi(Math.max(Number(e.target.value) || bounds.max, lo))}
                  aria-label="Maximum price input"
                  className="input-field !py-1.5 text-xs"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setLo(bounds.min);
                    setHi(bounds.max);
                    navigate({ min: null, max: null });
                  }}
                  className="btn-outline flex-1 !py-1.5 text-xs"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => navigate({ min: lo > bounds.min ? lo : null, max: hi < bounds.max ? hi : null })}
                  className="btn-primary flex-1 !py-1.5 text-xs"
                >
                  Save
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <label className="flex items-center gap-1.5 text-xs text-muted">
        Sort
        <select
          value={sort}
          onChange={(e) => navigate({ sort: e.target.value })}
          className="rounded-full border bg-surface px-3 py-1.5 text-xs font-medium text-foreground outline-none"
          style={{ borderColor: "var(--border)" }}
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>

      {(brandActive || priceActive || sort !== "newest") && (
        <button
          type="button"
          onClick={() => {
            setChecked(new Set());
            setLo(bounds.min);
            setHi(bounds.max);
            navigate({ brands: [], min: null, max: null, sort: "newest" });
          }}
          className="text-xs font-medium"
          style={{ color: "var(--brand)" }}
        >
          Clear all
        </button>
      )}
    </div>
  );
}
