"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/cart-provider";
import { Img, Stars } from "@/components/ui";
import { formatPrice } from "@/lib/format";

export type CardProduct = {
  slug: string;
  name: string;
  brand: string;
  price: number;
  compareAtPrice: number | null;
  images: string[];
  badge: string | null;
  rating: number;
  reviewCount: number;
  stock: number;
};

export function ProductCard({
  product,
  index = 0,
  priority = false,
}: {
  product: CardProduct;
  index?: number;
  priority?: boolean;
}) {
  const { addItem } = useCart();
  const [hover, setHover] = useState(false);
  const image = hover && product.images[1] ? product.images[1] : product.images[0];
  const discount = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

  return (
    <article
      className="animate-fade-up group relative flex flex-col"
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-sand">
        <Link href={`/product/${product.slug}`} className="absolute inset-0 z-10" aria-label={product.name} />
        <Img
          src={image}
          alt={product.name}
          priority={priority}
          className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.06]"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ink/25 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        {product.badge ? (
          <span className="text-eyebrow absolute left-3 top-3 rounded-full bg-cream/95 px-3 py-1 text-ink shadow-sm">
            {product.badge}
          </span>
        ) : null}
        {discount > 0 ? (
          <span className="text-eyebrow absolute right-3 top-3 rounded-full bg-clay px-3 py-1 text-white">
            −{discount}%
          </span>
        ) : null}


        <button
          onClick={() =>
            addItem({
              slug: product.slug,
              name: product.name,
              brand: product.brand,
              price: product.price,
              image: product.images[0],
            })
          }
          className="absolute inset-x-3 bottom-3 z-20 translate-y-3 rounded-full bg-cream/95 py-3 text-eyebrow opacity-0 shadow-lg backdrop-blur transition-all duration-300 hover:bg-ink hover:text-cream group-hover:translate-y-0 group-hover:opacity-100 max-md:hidden"
        >
          Quick add · {formatPrice(product.price)}
        </button>
      </div>

      <div className="mt-4 flex flex-1 flex-col">
        <p className="text-eyebrow text-ink-soft">{product.brand}</p>
        <Link href={`/product/${product.slug}`} className="mt-1">
          <h3 className="font-display text-lg leading-snug transition-colors group-hover:text-clay">
            {product.name}
          </h3>
        </Link>
        <div className="mt-1.5 flex items-center gap-2 text-xs text-ink-soft">
          <Stars rating={product.rating} size={12} />
          <span>({product.reviewCount})</span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-[15px] font-medium">{formatPrice(product.price)}</span>
          {product.compareAtPrice ? (
            <span className="text-xs text-ink-soft line-through">
              {formatPrice(product.compareAtPrice)}
            </span>
          ) : null}
          {product.stock <= 12 ? (
            <span className="ml-auto text-[11px] text-clay">Only {product.stock} left</span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
