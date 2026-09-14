"use client";

import { useState, useEffect, useCallback } from "react";
import { formatPrice } from "@/lib/format";

type AffiliateProduct = {
  id: number;
  slug: string;
  name: string;
  brand: string;
  categorySlug: string;
  summary: string;
  price: number;
  compareAtPrice: number | null;
  images: string[];
  affiliateSource: string;
  badge: string | null;
  featured: boolean;
  clickCount: number;
};

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let sid = sessionStorage.getItem("mp_sid");
  if (!sid) {
    sid =
      Math.random().toString(36).substring(2, 10) +
      Math.random().toString(36).substring(2, 10);
    sessionStorage.setItem("mp_sid", sid);
  }
  return sid;
}

function SourceBadge({ source }: { source: string }) {
  const map: Record<string, { label: string; color: string }> = {
    aliexpress: { label: "AliExpress", color: "from-red-600 to-orange-500" },
    amazon: { label: "Amazon", color: "from-yellow-500 to-orange-400" },
    ebay: { label: "eBay", color: "from-blue-600 to-blue-400" },
    etsy: { label: "Etsy", color: "from-orange-600 to-amber-400" },
    wish: { label: "Wish", color: "from-purple-600 to-violet-400" },
  };
  const info = map[source.toLowerCase()] || { label: source, color: "from-slate-600 to-slate-400" };
  return (
    <span
      className={`inline-flex items-center rounded-full bg-gradient-to-r ${info.color} px-2 py-0.5 text-[10px] font-bold text-white shadow-sm`}
    >
      {info.label}
    </span>
  );
}

function AffiliateCard({ product }: { product: AffiliateProduct }) {
  const [loading, setLoading] = useState(false);
  const [clicked, setClicked] = useState(false);

  const handleBuy = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch("/api/affiliate/click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          sessionId: getSessionId(),
        }),
      });

      if (res.ok) {
        const { redirectUrl } = await res.json();
        setClicked(true);
        // Petite pause pour montrer le feedback avant la redirection
        setTimeout(() => {
          window.open(redirectUrl, "_blank", "noopener,noreferrer");
          setLoading(false);
        }, 600);
      } else {
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  };

  const discount =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
      : null;

  const img = product.images?.[0] || "/images/products/placeholder.jpg";

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-slate-50">
        <img
          src={img}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/images/products/placeholder.jpg";
          }}
        />

        {/* Badges */}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {product.badge && (
            <span className="rounded-full bg-amber-500 px-2.5 py-1 text-[10px] font-bold text-white shadow-md">
              {product.badge}
            </span>
          )}
          {discount && (
            <span className="rounded-full bg-red-500 px-2.5 py-1 text-[10px] font-bold text-white shadow-md">
              -{discount}%
            </span>
          )}
          {product.featured && (
            <span className="rounded-full bg-violet-600 px-2.5 py-1 text-[10px] font-bold text-white shadow-md">
              ⭐ Sélection
            </span>
          )}
        </div>

        {/* Source badge */}
        <div className="absolute right-3 top-3">
          <SourceBadge source={product.affiliateSource} />
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {product.brand}
          </p>
          <h3 className="line-clamp-2 text-sm font-bold leading-snug text-slate-800">
            {product.name}
          </h3>
          {product.summary && (
            <p className="line-clamp-2 text-[12px] text-slate-500 leading-relaxed">
              {product.summary}
            </p>
          )}
        </div>

        {/* Prix */}
        <div className="mt-auto flex items-baseline gap-2">
          <span className="text-xl font-black text-slate-900">
            {formatPrice(product.price)}
          </span>
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span className="text-sm text-slate-400 line-through">
              {formatPrice(product.compareAtPrice)}
            </span>
          )}
        </div>

        {/* Bouton Acheter */}
        <button
          id={`buy-affiliate-${product.id}`}
          onClick={handleBuy}
          disabled={loading}
          className={`relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl py-3 text-sm font-bold transition-all duration-200 ${
            clicked
              ? "bg-emerald-500 text-white"
              : "bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 hover:from-amber-400 hover:to-orange-400 hover:shadow-lg hover:shadow-amber-500/25 active:scale-95"
          }`}
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
              <span>Ouverture...</span>
            </>
          ) : clicked ? (
            <>
              <span>✓</span>
              <span>Lien ouvert !</span>
            </>
          ) : (
            <>
              <span>🛒</span>
              <span>Acheter maintenant</span>
            </>
          )}
        </button>

        <p className="text-center text-[10px] text-slate-400">
          Vous serez redirigé vers {product.affiliateSource}
        </p>
      </div>
    </article>
  );
}

const CATEGORIES = [
  { slug: "all", label: "Tous les produits" },
  { slug: "apparel", label: "Mode & Vêtements" },
  { slug: "electronics", label: "Électronique" },
  { slug: "home", label: "Maison & Déco" },
  { slug: "beauty", label: "Beauté & Bien-être" },
  { slug: "sports", label: "Sport & Outdoor" },
  { slug: "toys", label: "Jouets & Enfants" },
];

export default function AffiliateCataloguePage() {
  const [products, setProducts] = useState<AffiliateProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category !== "all") params.set("category", category);
      if (search) params.set("search", search);

      const res = await fetch(`/api/affiliate/products?${params}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } finally {
      setLoading(false);
    }
  }, [category, search]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-amber-900 py-20 text-white">
        <div className="absolute inset-0 bg-[url('/images/grid.svg')] opacity-5" />
        <div className="relative mx-auto max-w-6xl px-6 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-semibold text-amber-400 mb-6">
            🔗 Catalogue Affilié B2C
          </span>
          <h1 className="font-display text-5xl font-black tracking-tight md:text-6xl">
            Les meilleurs produits
            <br />
            <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              sélectionnés pour vous
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300">
            Des produits soigneusement sélectionnés aux meilleurs prix. Cliquez sur
            &quot;Acheter&quot; pour être redirigé vers le vendeur partenaire.
          </p>

          {/* Search */}
          <form onSubmit={handleSearch} className="mt-8 flex max-w-xl mx-auto gap-3">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Rechercher un produit..."
              className="flex-1 rounded-xl border border-white/10 bg-white/10 px-5 py-3 text-sm text-white placeholder-white/50 backdrop-blur focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
            />
            <button
              type="submit"
              className="rounded-xl bg-amber-500 px-6 py-3 text-sm font-bold text-slate-950 hover:bg-amber-400 transition"
            >
              Chercher
            </button>
          </form>
        </div>
      </section>

      {/* Filters + Grid */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        {/* Filtres catégories */}
        <div className="mb-8 flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => setCategory(cat.slug)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                category === cat.slug
                  ? "border-amber-500 bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                  : "border-slate-200 bg-white text-slate-600 hover:border-amber-300 hover:bg-amber-50"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Nombre de résultats */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            {loading ? "Chargement..." : `${products.length} produit${products.length !== 1 ? "s" : ""} trouvé${products.length !== 1 ? "s" : ""}`}
          </p>
          {search && (
            <button
              onClick={() => {
                setSearch("");
                setSearchInput("");
              }}
              className="text-xs text-amber-600 hover:underline"
            >
              ✕ Effacer la recherche
            </button>
          )}
        </div>

        {/* Grille produits */}
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-2xl border border-slate-200 bg-slate-100 aspect-square"
              />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-slate-700">Aucun produit trouvé</h3>
            <p className="mt-2 text-slate-500">
              Essayez une autre catégorie ou modifiez votre recherche.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <AffiliateCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
