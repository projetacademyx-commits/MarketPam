"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/components/cart-provider";
import { useAuth } from "@/components/auth-provider";

const NAV = [
  { href: "/shop", label: "Shop all" },
  { href: "/shop?category=apparel", label: "Apparel" },
  { href: "/shop?category=home", label: "Home" },
  { href: "/shop?category=tech", label: "Sound & Tech" },
  { href: "/shop?category=beauty", label: "Skin & Scent" },
  { href: "/sell", label: "Sell with us" },
];

export function SiteHeader() {
  const { count, openCart, hydrated } = useCart();
  const { user, logout, loading } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const pathname = usePathname();
  const inputRef = useRef<HTMLInputElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const [bump, setBump] = useState(false);
  const prevCount = useRef(count);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
    setUserDropdownOpen(false);
  }, [pathname]);

  // Click outside to close user dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (count > prevCount.current) {
      setBump(true);
      const t = setTimeout(() => setBump(false), 400);
      prevCount.current = count;
      return () => clearTimeout(t);
    }
    prevCount.current = count;
  }, [count]);

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  return (
    <>
      <div className="overflow-hidden border-b border-ink/10 bg-ink py-2 text-cream">
        <div className="animate-marquee flex w-max gap-12 whitespace-nowrap text-eyebrow">
          {Array.from({ length: 2 }).map((_, block) => (
            <div key={block} className="flex gap-12">
              <span>Livraison offerte dès 150 €</span>
              <span>·</span>
              <span>Retours 30 jours garantis</span>
              <span>·</span>
              <span>Vendez vos créations sur MarketPam</span>
              <span>·</span>
              <span>Nouveautés chaque jeudi</span>
              <span>·</span>
            </div>
          ))}
        </div>
      </div>

      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-cream/90 shadow-[0_1px_0_rgba(22,19,15,0.08)] backdrop-blur-md" : "bg-cream"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-4 lg:px-8">
          <div className="flex items-center gap-8">
            <button
              className="lg:hidden"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
            >
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                <path d="M3 6h16M3 11h16M3 16h16" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>
            <Link href="/" className="group flex items-baseline gap-1">
              <span className="font-display text-2xl tracking-tight">MarketPam</span>
              <span className="hidden h-1.5 w-1.5 rounded-full bg-clay transition group-hover:scale-150 sm:block" />
            </Link>
          </div>

          <nav className="hidden items-center gap-7 lg:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="relative text-sm text-ink-soft transition hover:text-ink after:absolute after:-bottom-1.5 after:left-0 after:h-px after:w-0 after:bg-clay after:transition-all after:duration-300 hover:after:w-full"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setSearchOpen((v) => !v)}
              aria-label="Rechercher"
              className="rounded-full p-2.5 transition hover:bg-sand"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M12.5 12.5L16 16" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>

            {/* Authentification / Mon compte */}
            {!loading && (
              <>
                {user ? (
                  <div className="flex items-center gap-2">
                    {user.role === "admin" ? (
                      <Link
                        href="/admin"
                        className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-amber-400 shadow-sm hover:bg-slate-800 transition"
                      >
                        <span>Console Admin</span>
                        <span>⚙</span>
                      </Link>
                    ) : null}

                    <div className="relative" ref={userDropdownRef}>
                      <button
                        onClick={() => setUserDropdownOpen((v) => !v)}
                        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                          user.role === "admin"
                            ? "border-amber-500/40 bg-amber-50/50 hover:border-amber-600 hover:bg-amber-100/60"
                            : "border-ink/15 bg-white/70 hover:border-ink hover:bg-white"
                        }`}
                        aria-expanded={userDropdownOpen}
                      >
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] text-white ${
                            user.role === "admin" ? "bg-amber-600 font-bold" : "bg-clay"
                          }`}
                        >
                          {user.firstName[0]?.toUpperCase()}
                        </span>
                        <span className="hidden max-w-[100px] truncate sm:inline">{user.firstName}</span>
                        {user.role === "admin" ? (
                          <span className="rounded bg-amber-500/20 px-1 py-0.5 text-[9px] font-bold text-amber-800">
                            ADMIN
                          </span>
                        ) : null}
                        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className="text-ink-soft">
                          <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </button>

                      {userDropdownOpen ? (
                        <div className="animate-pop absolute right-0 mt-2 w-60 rounded-2xl border border-ink/10 bg-cream p-2 shadow-xl">
                          <div className="border-b border-ink/10 px-3 py-2">
                            <p className="truncate text-xs font-semibold text-ink">
                              {user.firstName} {user.lastName}
                            </p>
                            <p className="truncate text-[11px] text-ink-soft">{user.email}</p>
                            {user.role === "admin" ? (
                              <span className="mt-1 inline-block rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                                Super Administrateur
                              </span>
                            ) : null}
                          </div>

                          <div className="py-1">
                            {user.role === "admin" ? (
                              <Link
                                href="/admin"
                                className="flex items-center justify-between rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-amber-400 shadow-sm transition hover:bg-slate-800 mb-1"
                              >
                                <span>Console Administrateur</span>
                                <span>⚙</span>
                              </Link>
                            ) : null}
                            <Link
                              href="/account"
                              className="block rounded-lg px-3 py-2 text-xs font-medium text-ink transition hover:bg-sand"
                            >
                              {user.role === "admin" ? "Espace client (Aperçu)" : "Mon compte"}
                            </Link>
                            <Link
                              href="/account?tab=orders"
                              className="block rounded-lg px-3 py-2 text-xs font-medium text-ink transition hover:bg-sand"
                            >
                              Mes commandes
                            </Link>
                          </div>

                          <div className="border-t border-ink/10 pt-1">
                            <button
                              onClick={logout}
                              className="w-full rounded-lg px-3 py-2 text-left text-xs font-medium text-red-600 transition hover:bg-red-50"
                            >
                              Se déconnecter
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <Link
                      href="/login"
                      className="rounded-full border border-ink/20 px-3.5 py-1.5 text-xs font-medium transition hover:border-ink hover:bg-ink hover:text-cream"
                    >
                      Se connecter
                    </Link>
                  </div>
                )}
              </>
            )}

            <Link
              href="/sell"
              className="hidden rounded-full border border-ink/15 px-3.5 py-1.5 text-eyebrow transition hover:border-ink hover:bg-ink hover:text-cream md:block"
            >
              Vendre
            </Link>

            <button
              onClick={openCart}
              className="relative rounded-full p-2.5 transition hover:bg-sand"
              aria-label="Ouvrir le panier"
            >
              <svg width="19" height="19" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path
                  d="M3.5 6h13l-1.1 10.2a1.5 1.5 0 01-1.5 1.3H6.1a1.5 1.5 0 01-1.5-1.3L3.5 6z"
                  stroke="currentColor"
                  strokeWidth="1.4"
                />
                <path d="M7 6a3 3 0 016 0" stroke="currentColor" strokeWidth="1.4" />
              </svg>
              {hydrated && count > 0 ? (
                <span
                  className={`absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-clay px-1 text-[11px] font-medium text-white ${
                    bump ? "animate-pop" : ""
                  }`}
                >
                  {count}
                </span>
              ) : null}
            </button>
          </div>
        </div>

        {searchOpen ? (
          <div className="animate-fade-in border-t border-ink/10 bg-cream px-5 py-4 lg:px-8">
            <form
              className="mx-auto flex max-w-3xl items-center gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                router.push(`/shop?q=${encodeURIComponent(query.trim())}`);
                setSearchOpen(false);
              }}
            >
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher des écouteurs, céramiques, lin…"
                className="w-full border-b border-ink/20 bg-transparent px-1 py-2 font-display text-xl outline-none placeholder:text-ink-soft/50 focus:border-clay"
              />
              <button type="submit" className="rounded-full bg-ink px-5 py-2.5 text-eyebrow text-cream">
                Rechercher
              </button>
            </form>
          </div>
        ) : null}

        {menuOpen ? (
          <nav className="animate-fade-in border-t border-ink/10 bg-cream px-5 py-4 lg:hidden">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block border-b border-ink/5 py-3 font-display text-lg"
              >
                {item.label}
              </Link>
            ))}

            <div className="mt-4 border-t border-ink/10 pt-4">
              {user ? (
                <div className="space-y-2">
                  <p className="text-xs text-ink-soft">
                    Connecté en tant que <span className="font-semibold text-ink">{user.firstName} {user.lastName}</span>
                  </p>
                  <Link
                    href="/account"
                    className="block rounded-lg bg-sand/60 py-2.5 px-3 font-display text-base"
                  >
                    Mon compte
                  </Link>
                  <Link
                    href="/account?tab=orders"
                    className="block rounded-lg bg-sand/60 py-2.5 px-3 font-display text-base"
                  >
                    Mes commandes
                  </Link>
                  {user.role === "admin" ? (
                    <Link
                      href="/admin"
                      className="block rounded-lg bg-clay/10 py-2.5 px-3 font-display text-base text-clay font-bold"
                    >
                      Espace Admin ⚙
                    </Link>
                  ) : null}
                  <button
                    onClick={logout}
                    className="block w-full text-left py-2 px-3 text-xs text-red-600 font-semibold"
                  >
                    Se déconnecter
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    href="/login"
                    className="rounded-full bg-ink py-3 text-center text-eyebrow text-cream"
                  >
                    Se connecter
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-full border border-ink/20 py-3 text-center text-eyebrow"
                  >
                    Créer un compte
                  </Link>
                </div>
              )}
            </div>
          </nav>
        ) : null}
      </header>
    </>
  );
}
