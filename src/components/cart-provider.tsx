"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/components/auth-provider";

export type CartItem = {
  slug: string;
  name: string;
  brand: string;
  price: number;
  image: string;
  variant?: string;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  isOpen: boolean;
  hydrated: boolean;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (slug: string, variant?: string) => void;
  updateQuantity: (slug: string, quantity: number, variant?: string) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  requireAuthAction: (action: () => void, message?: string) => boolean;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "marketpam.cart.v1";

function keyOf(slug: string, variant?: string) {
  return `${slug}::${variant ?? ""}`;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, openAuthModal } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const syncedRef = useRef(false);

  // 1. Charger depuis le localStorage au montage
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartItem[];
        if (Array.isArray(parsed)) setItems(parsed.filter((i) => i && i.slug && i.quantity > 0));
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  // 2. Synchronisation avec le backend lors de la connexion
  useEffect(() => {
    if (!hydrated || !user) {
      syncedRef.current = false;
      return;
    }

    if (!syncedRef.current) {
      syncedRef.current = true;

      // Si des articles locaux existaient, les pousser vers le compte utilisateur
      if (items.length > 0) {
        fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: items.map((i) => ({ slug: i.slug, quantity: i.quantity, variant: i.variant })),
          }),
        })
          .then(() => fetch("/api/cart"))
          .then((r) => r.json())
          .then((data) => {
            if (Array.isArray(data.items) && data.items.length > 0) {
              setItems(data.items);
            }
          })
          .catch(() => {});
      } else {
        // Sinon récupérer le panier sauvegardé en base
        fetch("/api/cart")
          .then((r) => r.json())
          .then((data) => {
            if (Array.isArray(data.items) && data.items.length > 0) {
              setItems(data.items);
            }
          })
          .catch(() => {});
      }
    }
  }, [user, hydrated, items]);

  // 3. Sauvegarder dans localStorage
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* storage unavailable */
    }
  }, [items, hydrated]);

  // 4. Fermeture par touche Echap
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const requireAuthAction = useCallback(
    (action: () => void, message?: string) => {
      if (!user) {
        openAuthModal(
          message || "Veuillez vous connecter à votre compte pour continuer vos achats.",
          action,
        );
        return false;
      }
      action();
      return true;
    },
    [user, openAuthModal],
  );

  const addItem = useCallback(
    (item: Omit<CartItem, "quantity">, quantity = 1) => {
      // Obligation formelle d'être connecté pour ajouter au panier
      if (!user) {
        openAuthModal(
          "Veuillez vous connecter à votre compte pour ajouter cet article à votre panier.",
          () => {
            // Callback après connexion réussie
            setItems((prev) => {
              const k = keyOf(item.slug, item.variant);
              const existing = prev.find((i) => keyOf(i.slug, i.variant) === k);
              if (existing) {
                return prev.map((i) =>
                  keyOf(i.slug, i.variant) === k ? { ...i, quantity: i.quantity + quantity } : i,
                );
              }
              return [...prev, { ...item, quantity }];
            });
            setIsOpen(true);
          },
        );
        return;
      }

      setItems((prev) => {
        const k = keyOf(item.slug, item.variant);
        const existing = prev.find((i) => keyOf(i.slug, i.variant) === k);
        if (existing) {
          return prev.map((i) =>
            keyOf(i.slug, i.variant) === k ? { ...i, quantity: i.quantity + quantity } : i,
          );
        }
        return [...prev, { ...item, quantity }];
      });
      setIsOpen(true);

      // Mettre à jour le serveur si connecté
      fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: item.slug, quantity, variant: item.variant }),
      }).catch(() => {});
    },
    [user, openAuthModal],
  );

  const removeItem = useCallback(
    (slug: string, variant?: string) => {
      setItems((prev) => prev.filter((i) => keyOf(i.slug, i.variant) !== keyOf(slug, variant)));
      if (user) {
        const query = new URLSearchParams({ slug });
        if (variant) query.set("variant", variant);
        fetch(`/api/cart?${query.toString()}`, { method: "DELETE" }).catch(() => {});
      }
    },
    [user],
  );

  const updateQuantity = useCallback(
    (slug: string, quantity: number, variant?: string) => {
      setItems((prev) =>
        prev
          .map((i) =>
            keyOf(i.slug, i.variant) === keyOf(slug, variant)
              ? { ...i, quantity: Math.max(0, Math.min(99, quantity)) }
              : i,
          )
          .filter((i) => i.quantity > 0),
      );

      if (user) {
        if (quantity <= 0) {
          const query = new URLSearchParams({ slug });
          if (variant) query.set("variant", variant);
          fetch(`/api/cart?${query.toString()}`, { method: "DELETE" }).catch(() => {});
        } else {
          fetch("/api/cart", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slug, quantity, variant }),
          }).catch(() => {});
        }
      }
    },
    [user],
  );

  const clearCart = useCallback(() => {
    setItems([]);
    if (user) {
      fetch("/api/cart?all=true", { method: "DELETE" }).catch(() => {});
    }
  }, [user]);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((sum, i) => sum + i.quantity, 0);
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    return {
      items,
      count,
      subtotal,
      isOpen,
      hydrated,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      requireAuthAction,
    };
  }, [items, isOpen, hydrated, addItem, removeItem, updateQuantity, clearCart, requireAuthAction]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
