import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { PRICE_CEILING, ShopFilters, type FilterState } from "@/components/shop-filters";
import { getBrands, getCategories, getProducts, type SortKey } from "@/lib/queries";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function list(value: string | string[] | undefined): string[] {
  if (!value) return [];
  const raw = Array.isArray(value) ? value : [value];
  return raw.flatMap((v) => v.split(",")).map((v) => v.trim()).filter(Boolean);
}

function one(value: string | string[] | undefined): string {
  if (!value) return "";
  return Array.isArray(value) ? (value[0] ?? "") : value;
}

const VALID_SORTS: SortKey[] = ["featured", "newest", "price-asc", "price-desc", "rating"];

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const categoriesFilter = list(params.category);
  const tags = list(params.tag);
  const brands = list(params.brand);
  const q = one(params.q);
  const maxRaw = Number(one(params.max));
  const maxPrice = Number.isFinite(maxRaw) && maxRaw > 0 ? maxRaw : PRICE_CEILING;
  const sortRaw = one(params.sort) as SortKey;
  const sort: SortKey = VALID_SORTS.includes(sortRaw) ? sortRaw : "featured";

  const [allCategories, allBrands, products] = await Promise.all([
    getCategories(),
    getBrands(),
    getProducts({
      category: categoriesFilter,
      tags,
      brands,
      q: q || undefined,
      maxPrice: maxPrice < PRICE_CEILING ? maxPrice : undefined,
      sort,
    }),
  ]);

  const state: FilterState = {
    categories: categoriesFilter,
    tags,
    brands,
    maxPrice,
    q,
    sort,
  };

  const activeCategory =
    categoriesFilter.length === 1
      ? allCategories.find((c) => c.slug === categoriesFilter[0])
      : undefined;

  const heading = q
    ? `Results for “${q}”`
    : activeCategory
      ? activeCategory.name
      : tags.length === 1
        ? { new: "New arrivals", bestseller: "Bestsellers", sale: "On sale" }[tags[0]] ?? "Shop all"
        : "Shop all";

  const subheading = activeCategory?.description ??
    "Every piece vetted by our buyers for material, construction and the way it wears over time.";

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-14">
      <nav className="text-xs text-ink-soft">
        <Link href="/" className="hover:text-clay">
          Home
        </Link>
        <span className="mx-2">/</span>
        <span className="text-ink">{heading}</span>
      </nav>

      <header className="animate-fade-up mt-6 max-w-2xl">
        <h1 className="font-display text-5xl leading-none lg:text-6xl">{heading}</h1>
        <p className="mt-5 text-[15px] leading-relaxed text-ink-soft">{subheading}</p>
      </header>

      <div className="mt-10">
        <ShopFilters
          categories={allCategories.map((c) => ({ slug: c.slug, name: c.name }))}
          brands={allBrands}
          state={state}
          resultCount={products.length}
        >
          {products.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-ink/20 px-8 py-20 text-center">
              <p className="font-display text-2xl">Nothing matches those filters</p>
              <p className="mx-auto mt-3 max-w-sm text-sm text-ink-soft">
                Try widening your price range or clearing a collection to see more of the catalogue.
              </p>
              <Link
                href="/shop"
                className="mt-6 inline-block rounded-full bg-ink px-6 py-3 text-eyebrow text-cream transition hover:bg-clay"
              >
                Reset filters
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-5 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((product, i) => (
                <ProductCard key={product.slug} product={product} index={i} priority={i < 3} />
              ))}
            </div>
          )}
        </ShopFilters>
      </div>
    </div>
  );
}
