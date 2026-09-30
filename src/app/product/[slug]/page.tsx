import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BuyBox } from "@/components/buy-box";
import { ProductCard } from "@/components/product-card";
import { ProductGallery } from "@/components/product-gallery";
import { ReviewSection } from "@/components/review-section";
import { Stars } from "@/components/ui";
import { formatPrice } from "@/lib/format";
import { getCategory, getProductBySlug, getRelatedProducts, getReviews } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found — MarketPam" };
  return {
    title: `${product.name} — MarketPam`,
    description: product.summary,
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [reviews, related, category] = await Promise.all([
    getReviews(slug),
    getRelatedProducts(product),
    getCategory(product.categorySlug),
  ]);

  const discount = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

  return (
    <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-12">
      <nav className="text-xs text-ink-soft">
        <Link href="/" className="hover:text-clay">
          Home
        </Link>
        <span className="mx-2">/</span>
        <Link href={`/shop?category=${product.categorySlug}`} className="hover:text-clay">
          {category?.name ?? "Shop"}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-ink">{product.name}</span>
      </nav>

      <div className="mt-8 grid gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
        <div className="animate-fade-up">
          <ProductGallery images={product.images} name={product.name} />
        </div>

        <div className="animate-fade-up lg:pt-4" style={{ animationDelay: "80ms" }}>
          <div className="flex items-center gap-3">
            <p className="text-eyebrow text-clay">{product.brand}</p>
            {product.badge ? (
              <span className="text-eyebrow rounded-full bg-sand px-3 py-1 text-ink-soft">
                {product.badge}
              </span>
            ) : null}
          </div>

          <h1 className="font-display mt-3 text-4xl leading-tight lg:text-5xl">{product.name}</h1>

          <a href="#reviews" className="mt-4 inline-flex items-center gap-2 text-xs text-ink-soft hover:text-clay">
            <Stars rating={product.rating} size={14} />
            <span>
              {product.rating.toFixed(1)} · {product.reviewCount} reviews
            </span>
          </a>

          <div className="mt-6 flex items-baseline gap-3">
            <span className="font-display text-3xl">{formatPrice(product.price)}</span>
            {product.compareAtPrice ? (
              <>
                <span className="text-sm text-ink-soft line-through">
                  {formatPrice(product.compareAtPrice)}
                </span>
                <span className="text-eyebrow rounded-full bg-clay px-3 py-1 text-white">
                  Save {discount}%
                </span>
              </>
            ) : null}
          </div>

          <p className="mt-6 text-[15px] leading-relaxed text-ink-soft">{product.summary}</p>

          <div className="mt-8">
            <BuyBox
              slug={product.slug}
              name={product.name}
              brand={product.brand}
              price={product.price}
              image={product.images[0] ?? ""}
              colors={product.colors}
              stock={product.stock}
              affiliateUrl={product.affiliateUrl}
              isAffiliate={product.isAffiliate}
            />
          </div>

          <div className="mt-10 space-y-4 border-t border-ink/10 pt-8">
            <h2 className="font-display text-xl">The details</h2>
            <p className="text-[15px] leading-relaxed text-ink-soft">{product.description}</p>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {product.highlights.map((h) => (
                <li key={h} className="flex items-start gap-2 text-sm text-ink-soft">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-clay" />
                  {h}
                </li>
              ))}
            </ul>
          </div>

          <dl className="mt-8 grid grid-cols-3 gap-4 border-t border-ink/10 pt-6 text-xs text-ink-soft">
            <div>
              <dt className="text-ink">Free shipping</dt>
              <dd className="mt-1">On orders over $150</dd>
            </div>
            <div>
              <dt className="text-ink">30-day returns</dt>
              <dd className="mt-1">No questions asked</dd>
            </div>
            <div>
              <dt className="text-ink">Maker-direct</dt>
              <dd className="mt-1">88% goes to {product.brand}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-16">
        <ReviewSection
          slug={product.slug}
          rating={product.rating}
          reviews={reviews.map((r) => ({
            id: r.id,
            author: r.author,
            rating: r.rating,
            title: r.title,
            body: r.body,
            verified: r.verified,
            createdAt: r.createdAt,
          }))}
        />
      </div>

      {related.length ? (
        <section className="border-t border-ink/10 py-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-display text-3xl lg:text-4xl">You may also like</h2>
            <Link
              href={`/shop?category=${product.categorySlug}`}
              className="text-sm underline underline-offset-4 hover:text-clay"
            >
              More from {category?.name ?? "this collection"}
            </Link>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-4">
            {related.map((p, i) => (
              <ProductCard key={p.slug} product={p} index={i} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
