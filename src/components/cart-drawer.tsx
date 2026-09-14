"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart-provider";
import { useAuth } from "@/components/auth-provider";
import { Img } from "@/components/ui";
import { FREE_SHIPPING_THRESHOLD, formatPrice } from "@/lib/format";

export function CartDrawer() {
  const { items, isOpen, closeCart, updateQuantity, removeItem, subtotal, count } = useCart();
  const { user, openAuthModal } = useAuth();
  const router = useRouter();

  if (!isOpen) return null;

  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  const handleCheckout = () => {
    if (!user) {
      closeCart();
      openAuthModal("Veuillez vous connecter à votre compte pour finaliser votre commande.", () => {
        router.push("/checkout");
      });
    } else {
      closeCart();
      router.push("/checkout");
    }
  };

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Panier d'achats">
      <button
        aria-label="Fermer le panier"
        onClick={closeCart}
        className="animate-fade-in absolute inset-0 h-full w-full cursor-default bg-ink/40 backdrop-blur-[2px]"
      />
      <aside className="animate-slide-in absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-cream shadow-2xl sm:max-w-[26rem]">
        <header className="flex items-center justify-between border-b border-ink/10 px-6 py-5">
          <div>
            <p className="text-eyebrow text-ink-soft">Votre panier</p>
            <h2 className="font-display text-2xl">
              {count} {count === 1 ? "article" : "articles"}
            </h2>
          </div>
          <button
            onClick={closeCart}
            className="rounded-full border border-ink/15 p-2 transition hover:bg-ink hover:text-cream"
            aria-label="Fermer le panier"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
        </header>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sand text-2xl">🛍️</div>
            <h3 className="font-display text-xl">Votre panier est vide</h3>
            <p className="text-sm text-ink-soft">
              Explorez nos collections raffinées et ajoutez vos coups de cœur.
            </p>
            <Link
              href="/shop"
              onClick={closeCart}
              className="mt-2 rounded-full bg-ink px-6 py-3 text-eyebrow text-cream transition hover:bg-clay"
            >
              Découvrir la boutique
            </Link>
          </div>
        ) : (
          <>
            <div className="border-b border-ink/10 px-6 py-4">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-sand">
                <div
                  className="h-full rounded-full bg-clay transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-ink-soft">
                {remaining === 0
                  ? "🎉 Livraison standard offerte !"
                  : `Plus que ${formatPrice(remaining)} pour bénéficier de la livraison offerte.`}
              </p>
            </div>

            <ul className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
              {items.map((item) => (
                <li key={`${item.slug}-${item.variant ?? ""}`} className="flex gap-4">
                  <Link
                    href={`/product/${item.slug}`}
                    onClick={closeCart}
                    className="relative block h-28 w-22 shrink-0 overflow-hidden rounded-lg bg-sand"
                  >
                    <Img
                      src={item.image}
                      alt={item.name}
                      className="h-28 w-22 object-cover transition duration-500 hover:scale-105"
                    />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-eyebrow text-ink-soft">{item.brand}</p>
                        <Link
                          href={`/product/${item.slug}`}
                          onClick={closeCart}
                          className="block truncate font-display text-base leading-snug hover:text-clay"
                        >
                          {item.name}
                        </Link>
                        {item.variant ? (
                          <p className="mt-0.5 text-xs text-ink-soft">{item.variant}</p>
                        ) : null}
                      </div>
                      <p className="whitespace-nowrap text-sm font-medium">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <div className="flex items-center rounded-full border border-ink/15">
                        <button
                          onClick={() => updateQuantity(item.slug, item.quantity - 1, item.variant)}
                          className="px-3 py-1 text-sm transition hover:text-clay"
                          aria-label={`Diminuer la quantité de ${item.name}`}
                        >
                          −
                        </button>
                        <span className="w-6 text-center text-sm tabular-nums">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.slug, item.quantity + 1, item.variant)}
                          className="px-3 py-1 text-sm transition hover:text-clay"
                          aria-label={`Augmenter la quantité de ${item.name}`}
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.slug, item.variant)}
                        className="text-xs text-ink-soft underline underline-offset-4 transition hover:text-clay"
                      >
                        Retirer
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <footer className="space-y-4 border-t border-ink/10 bg-white/60 px-6 py-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-soft">Sous-total</span>
                <span className="font-display text-xl">{formatPrice(subtotal)}</span>
              </div>
              <p className="text-xs text-ink-soft">Frais d&apos;expédition et taxes calculés lors de la commande.</p>
              <button
                onClick={handleCheckout}
                className="block w-full rounded-full bg-ink px-6 py-4 text-center text-eyebrow text-cream transition hover:bg-clay"
              >
                Passer la commande · {formatPrice(subtotal)}
              </button>
              <button
                onClick={closeCart}
                className="w-full text-center text-xs text-ink-soft underline underline-offset-4 hover:text-clay"
              >
                Poursuivre les achats
              </button>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
