"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/components/cart-provider";
import { formatPrice } from "@/lib/format";

export function BuyBox({
  slug,
  name,
  brand,
  price,
  image,
  colors,
  stock,
  affiliateUrl,
  isAffiliate,
}: {
  slug: string;
  name: string;
  brand: string;
  price: number;
  image: string;
  colors: string[];
  stock: number;
  affiliateUrl?: string | null;
  isAffiliate?: boolean;
}) {
  const { addItem, requireAuthAction } = useCart();
  const router = useRouter();
  const [variant, setVariant] = useState(colors[0] ?? "");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const payload = { slug, name, brand, price, image, variant: variant || undefined };

  const handleAdd = () => {
    addItem(payload, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  const handleBuyNow = () => {
    requireAuthAction(() => {
      addItem(payload, quantity);
      router.push("/checkout");
    }, "Veuillez vous connecter pour commander immédiatement cet article.");
  };

  const handleAliExpressBuy = async () => {
    if (affiliateUrl) {
      // Si on a l'URL directe, ouvrir directement
      window.open(affiliateUrl, "_blank", "noopener,noreferrer");
      // Tracker le clic en arrière-plan
      fetch("/api/affiliate/click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      }).catch(() => {});
      return;
    }

    setRedirecting(true);
    try {
      const res = await fetch("/api/affiliate/click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const data = await res.json();
      if (data.redirectUrl) {
        window.open(data.redirectUrl, "_blank", "noopener,noreferrer");
      }
    } catch {
      // Fallback
    } finally {
      setRedirecting(false);
    }
  };

  const hasAffiliate = Boolean(affiliateUrl || isAffiliate);

  return (
    <div className="space-y-6">
      {colors.length > 1 ? (
        <div>
          <p className="text-eyebrow text-ink-soft">
            Option <span className="text-ink">· {variant}</span>
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => setVariant(c)}
                className={`rounded-full border px-4 py-2 text-sm transition ${
                  variant === c
                    ? "border-ink bg-ink text-cream"
                    : "border-ink/20 text-ink-soft hover:border-ink"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* Si produit affilié AliExpress */}
      {hasAffiliate ? (
        <div className="space-y-3">
          <button
            onClick={handleAliExpressBuy}
            disabled={redirecting}
            className="w-full flex items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-orange-500 via-red-500 to-amber-500 px-8 py-4 text-eyebrow text-white font-bold shadow-lg shadow-orange-500/25 transition hover:brightness-110 active:scale-[0.99]"
          >
            <span>🛍️</span>
            <span>{redirecting ? "Redirection vers AliExpress..." : `Acheter sur AliExpress · ${formatPrice(price)}`}</span>
            <span className="text-xs opacity-80">↗</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={handleAdd}
              className="flex-1 rounded-full border border-ink/20 py-3.5 text-xs font-semibold text-ink transition hover:border-ink hover:bg-sand"
            >
              {added ? "Ajouté au panier MarketPam ✓" : "Ajouter à mon panier MarketPam"}
            </button>
          </div>

          <div className="rounded-xl bg-orange-50 border border-orange-200/60 p-3.5 text-xs text-orange-950 flex items-start gap-2.5">
            <span className="text-base">🏷️</span>
            <div className="leading-relaxed">
              <strong className="font-semibold block">Offre Partenaire AliExpress Vérifiée</strong>
              Garantie officielle AliExpress, protection de l&apos;acheteur et suivi international inclus.
            </div>
          </div>
        </div>
      ) : (
        /* Produit standard MarketPam */
        <>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-full border border-ink/20">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="px-4 py-3 transition hover:text-clay"
                aria-label="Diminuer la quantité"
              >
                −
              </button>
              <span className="w-8 text-center text-sm tabular-nums">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => Math.min(stock, q + 1))}
                className="px-4 py-3 transition hover:text-clay"
                aria-label="Augmenter la quantité"
              >
                +
              </button>
            </div>

            <button
              onClick={handleAdd}
              disabled={stock === 0}
              className="flex-1 rounded-full bg-ink px-8 py-4 text-eyebrow text-cream transition hover:bg-clay disabled:cursor-not-allowed disabled:opacity-40"
            >
              {stock === 0 ? "Épuisé" : added ? "Ajouté au panier ✓" : `Ajouter au panier · ${formatPrice(price * quantity)}`}
            </button>
          </div>

          <button
            onClick={handleBuyNow}
            disabled={stock === 0}
            className="w-full rounded-full border border-ink/20 py-4 text-eyebrow transition hover:border-ink hover:bg-sand disabled:opacity-40"
          >
            Acheter maintenant
          </button>
        </>
      )}

      <p className="text-xs text-ink-soft">
        {hasAffiliate
          ? "Expédition rapide internationale · Disponibilité immédiate"
          : stock > 12
            ? "En stock · expédition sous 24h"
            : stock > 0
              ? `Stock limité · seulement ${stock} exemplaires restants`
              : "Actuellement en rupture de stock"}
      </p>
    </div>
  );
}
