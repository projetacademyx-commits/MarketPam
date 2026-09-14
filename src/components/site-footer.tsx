import Link from "next/link";

const COLUMNS = [
  {
    title: "Shop",
    links: [
      { href: "/shop", label: "All products" },
      { href: "/shop?tag=new", label: "New arrivals" },
      { href: "/shop?tag=bestseller", label: "Bestsellers" },
      { href: "/shop?tag=sale", label: "On sale" },
    ],
  },
  {
    title: "Collections",
    links: [
      { href: "/shop?category=apparel", label: "Apparel" },
      { href: "/shop?category=home", label: "Home & Objects" },
      { href: "/shop?category=kitchen", label: "Kitchen & Coffee" },
      { href: "/shop?category=carry", label: "Carry & Accessories" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/sell", label: "Sell with us" },
      { href: "/shop", label: "Our promise" },
      { href: "/shop", label: "Shipping & returns" },
      { href: "/shop", label: "Contact" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-ink/10 bg-ink text-cream">
      <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr]">
          <div>
            <p className="font-display text-3xl">MarketPam</p>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-cream/70">
              A curated marketplace for goods worth keeping. Buy from independent makers, or open your
              own shopfront and sell to a community that values craft.
            </p>
            <form className="mt-8 flex max-w-sm items-center gap-2 border-b border-cream/25 pb-2">
              <input
                type="email"
                placeholder="Email address"
                className="w-full bg-transparent text-sm outline-none placeholder:text-cream/40"
              />
              <button type="button" className="text-eyebrow whitespace-nowrap text-clay">
                Subscribe
              </button>
            </form>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <p className="text-eyebrow text-cream/50">{col.title}</p>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((link) => (
                    <li key={`${col.title}-${link.label}`}>
                      <Link
                        href={link.href}
                        className="text-sm text-cream/80 transition hover:text-clay"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-cream/10 pt-6 text-xs text-cream/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} MarketPam. Demo storefront — no real transactions.</p>
          <p className="flex gap-5">
            <span>Secure checkout</span>
            <span>Carbon-neutral delivery</span>
            <span>30-day returns</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
