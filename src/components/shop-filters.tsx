"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { formatPrice } from "@/lib/format";

export type FilterState = {
  categories: string[];
  tags: string[];
  brands: string[];
  maxPrice: number;
  q: string;
  sort: string;
};

export const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "rating", label: "Top rated" },
];

const TAGS = [
  { value: "new", label: "New arrivals" },
  { value: "bestseller", label: "Bestsellers" },
  { value: "sale", label: "On sale" },
];

export const PRICE_CEILING = 100000;

function buildQuery(state: FilterState) {
  const params = new URLSearchParams();
  if (state.categories.length) params.set("category", state.categories.join(","));
  if (state.tags.length) params.set("tag", state.tags.join(","));
  if (state.brands.length) params.set("brand", state.brands.join(","));
  if (state.maxPrice < PRICE_CEILING) params.set("max", String(state.maxPrice));
  if (state.q) params.set("q", state.q);
  if (state.sort && state.sort !== "featured") params.set("sort", state.sort);
  const qs = params.toString();
  return qs ? `/shop?${qs}` : "/shop";
}

export function ShopFilters({
  categories,
  brands,
  state,
  resultCount,
  children,
}: {
  categories: { slug: string; name: string }[];
  brands: string[];
  state: FilterState;
  resultCount: number;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [price, setPrice] = useState(state.maxPrice);

  const apply = (next: Partial<FilterState>) => {
    const merged = { ...state, ...next };
    startTransition(() => router.push(buildQuery(merged), { scroll: false }));
  };

  const toggle = (key: "categories" | "tags" | "brands", value: string) => {
    const current = state[key];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    apply({ [key]: next } as Partial<FilterState>);
  };

  const activeCount =
    state.categories.length +
    state.tags.length +
    state.brands.length +
    (state.maxPrice < PRICE_CEILING ? 1 : 0) +
    (state.q ? 1 : 0);

  const panel = (
    <div className={`space-y-8 ${pending ? "opacity-60" : ""}`}>
      <FilterGroup title="Collection">
        {categories.map((c) => (
          <Check
            key={c.slug}
            label={c.name}
            checked={state.categories.includes(c.slug)}
            onChange={() => toggle("categories", c.slug)}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Highlights">
        {TAGS.map((t) => (
          <Check
            key={t.value}
            label={t.label}
            checked={state.tags.includes(t.value)}
            onChange={() => toggle("tags", t.value)}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Maker">
        {brands.map((b) => (
          <Check
            key={b}
            label={b}
            checked={state.brands.includes(b)}
            onChange={() => toggle("brands", b)}
          />
        ))}
      </FilterGroup>

      <div>
        <p className="text-eyebrow text-ink-soft">Max price</p>
        <input
          type="range"
          min={2000}
          max={PRICE_CEILING}
          step={1000}
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
          onMouseUp={() => apply({ maxPrice: price })}
          onTouchEnd={() => apply({ maxPrice: price })}
          onKeyUp={() => apply({ maxPrice: price })}
          className="mt-4 w-full accent-[#b4643c]"
          aria-label="Maximum price"
        />
        <div className="mt-1 flex justify-between text-xs text-ink-soft">
          <span>$20</span>
          <span className="font-medium text-ink">
            {price >= PRICE_CEILING ? "Any price" : `Up to ${formatPrice(price)}`}
          </span>
        </div>
      </div>

      {activeCount > 0 ? (
        <button
          onClick={() => startTransition(() => router.push("/shop", { scroll: false }))}
          className="w-full rounded-full border border-ink/20 py-3 text-eyebrow transition hover:bg-ink hover:text-cream"
        >
          Clear all filters
        </button>
      ) : null}
    </div>
  );

  return (
    <>
      {/* Toolbar */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border-y border-ink/10 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="flex items-center gap-2 rounded-full border border-ink/20 px-4 py-2 text-eyebrow lg:hidden"
          >
            Filters {activeCount > 0 ? `(${activeCount})` : ""}
          </button>
          <p className="text-xs text-ink-soft">
            {resultCount} {resultCount === 1 ? "product" : "products"}
            {pending ? " · updating…" : ""}
          </p>
        </div>
        <label className="flex items-center gap-2 text-xs text-ink-soft">
          Sort
          <select
            value={state.sort}
            onChange={(e) => apply({ sort: e.target.value })}
            className="rounded-full border border-ink/20 bg-transparent px-4 py-2 text-xs text-ink outline-none focus:border-clay"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-10 lg:grid-cols-[220px_1fr] lg:gap-14">
        <aside className="hidden lg:block">{panel}</aside>
        <div>{children}</div>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            aria-label="Close filters"
            className="absolute inset-0 bg-ink/40"
            onClick={() => setMobileOpen(false)}
          />
          <div className="animate-slide-in absolute right-0 top-0 h-full w-[85%] max-w-sm overflow-y-auto bg-cream p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-display text-2xl">Filters</h2>
              <button onClick={() => setMobileOpen(false)} aria-label="Close filters">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </button>
            </div>
            {panel}
            <button
              onClick={() => setMobileOpen(false)}
              className="mt-8 w-full rounded-full bg-ink py-3.5 text-eyebrow text-cream"
            >
              Show {resultCount} results
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-eyebrow text-ink-soft">{title}</p>
      <div className="mt-3 space-y-2.5">{children}</div>
    </div>
  );
}

function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm text-ink-soft transition hover:text-ink">
      <span
        className={`flex h-4 w-4 items-center justify-center rounded-[4px] border transition ${
          checked ? "border-clay bg-clay text-white" : "border-ink/25"
        }`}
      >
        {checked ? (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
            <path d="M1.5 5.2l2.4 2.3L8.5 2.6" stroke="currentColor" strokeWidth="1.6" />
          </svg>
        ) : null}
      </span>
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
      {label}
    </label>
  );
}
