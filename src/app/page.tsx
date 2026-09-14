import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { Img, Stars } from "@/components/ui";
import { HERO_IMAGE, SELL_IMAGE, STORY_IMAGE } from "@/db/seed-data";
import { getCategories, getFeaturedProducts, getProducts } from "@/lib/queries";

export const dynamic = "force-dynamic";

const VALUES = [
  { icon: "✶", title: "Curated, never crowded", copy: "Every product is vetted by our buyers — around 4% of submissions make it in." },
  { icon: "⇄", title: "30-day easy returns", copy: "Changed your mind? Send it back within 30 days, no explanation needed." },
  { icon: "◈", title: "Makers paid fairly", copy: "Sellers keep 88% of every sale. No listing fees, no hidden deductions." },
  { icon: "⌁", title: "Carbon-neutral delivery", copy: "Plastic-free packaging and offset shipping on every single order." },
];

const TESTIMONIALS = [
  {
    quote:
      "I've replaced four different shopping habits with MarketPam. The buyers clearly have taste, and everything I've ordered has outlasted the hype.",
    name: "Renata Alves",
    role: "Interior stylist, Lisbon",
  },
  {
    quote:
      "Listing my ceramics took eleven minutes. I sold out my first drop in a weekend and the payout landed before the following Friday.",
    name: "Ilya Novak",
    role: "Seller since 2023",
  },
  {
    quote:
      "The product pages actually tell you what something is made of. Rare. I've stopped second-guessing purchases entirely.",
    name: "Marcus Bell",
    role: "Customer, Chicago",
  },
];

export default async function HomePage() {
  const [categories, featured, newArrivals] = await Promise.all([
    getCategories(),
    getFeaturedProducts(8),
    getProducts({ tags: ["new"], limit: 4, sort: "newest" }),
  ]);

  return (
    <div className="overflow-x-hidden">
      {/* Hero */}
      <section className="relative mx-auto max-w-7xl px-5 pb-16 pt-10 lg:px-8 lg:pb-24 lg:pt-16">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
          <div className="animate-fade-up">
            <p className="text-eyebrow flex items-center gap-3 text-clay">
              <span className="h-px w-10 bg-clay" />
              The autumn edit is live
            </p>
            <h1 className="font-display mt-6 text-[clamp(2.75rem,7vw,5rem)] leading-[0.95]">
              Goods worth
              <br />
              keeping — <em className="text-clay not-italic">bought</em>
              <br />
              and <em className="text-clay not-italic">sold</em> beautifully.
            </h1>
            <p className="mt-7 max-w-md text-[15px] leading-relaxed text-ink-soft">
              MarketPam is a curated marketplace for apparel, home objects, sound, skincare, coffee
              and carry goods. Shop from independent makers — or open your own shopfront in minutes.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                href="/shop"
                className="rounded-full bg-ink px-8 py-4 text-eyebrow text-cream transition hover:bg-clay"
              >
                Shop the collection
              </Link>
              <Link
                href="/sell"
                className="rounded-full border border-ink/20 px-8 py-4 text-eyebrow transition hover:border-ink hover:bg-sand"
              >
                Start selling
              </Link>
            </div>
            <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-ink/10 pt-7">
              {[
                ["24k+", "Happy customers"],
                ["1,200", "Independent makers"],
                ["4.9/5", "Average rating"],
              ].map(([value, label]) => (
                <div key={label}>
                  <dt className="font-display text-2xl">{value}</dt>
                  <dd className="mt-1 text-xs text-ink-soft">{label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="animate-fade-up relative" style={{ animationDelay: "120ms" }}>
            <div className="relative overflow-hidden rounded-2xl bg-sand">
              <Img
                src={HERO_IMAGE}
                alt="A calm, minimal interior styled with MarketPam goods"
                priority
                className="h-[520px] w-full object-cover lg:h-[620px]"
              />
            </div>
            <div className="absolute -bottom-6 -left-4 hidden w-56 rounded-xl bg-cream p-4 shadow-xl ring-1 ring-ink/5 sm:block">
              <div className="flex items-center gap-2">
                <Stars rating={5} size={13} />
                <span className="text-xs text-ink-soft">4.9 · 8,412 reviews</span>
              </div>
              <p className="mt-2 text-[13px] leading-snug text-ink-soft">
                “Everything arrives feeling like a gift I bought for myself.”
              </p>
            </div>
            <div className="absolute -right-3 top-8 hidden rounded-full bg-clay px-5 py-5 text-center text-cream shadow-lg lg:block">
              <p className="font-display text-lg leading-none">−25%</p>
              <p className="text-[10px] tracking-widest">SALE</p>
            </div>
          </div>
        </div>
      </section>

      {/* Collections */}
      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-eyebrow text-clay">Featured collections</p>
            <h2 className="font-display mt-3 text-4xl lg:text-5xl">Shop by world</h2>
          </div>
          <Link href="/shop" className="text-sm underline underline-offset-4 hover:text-clay">
            Browse everything
          </Link>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat, i) => (
            <Link
              key={cat.slug}
              href={`/shop?category=${cat.slug}`}
              className={`animate-fade-up group relative overflow-hidden rounded-2xl bg-sand ${
                i === 0 ? "sm:col-span-2 sm:row-span-1" : ""
              }`}
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <Img
                src={cat.imageUrl}
                alt={cat.name}
                className={`w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105 ${
                  i === 0 ? "h-72 sm:h-80" : "h-72"
                }`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/15 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-cream">
                <p className="text-eyebrow text-cream/70">{cat.tagline}</p>
                <h3 className="font-display mt-1.5 text-2xl">{cat.name}</h3>
                <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-cream/75 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                  {cat.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-eyebrow text-clay">This week&apos;s edit</p>
            <h2 className="font-display mt-3 text-4xl lg:text-5xl">Loved by the community</h2>
          </div>
          <Link href="/shop?sort=rating" className="text-sm underline underline-offset-4 hover:text-clay">
            See top rated
          </Link>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-4">
          {featured.map((product, i) => (
            <ProductCard key={product.slug} product={product} index={i} priority={i < 4} />
          ))}
        </div>
      </section>

      {/* Editorial band */}
      <section className="mt-8 bg-sand/60 py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 lg:grid-cols-2 lg:px-8">
          <div className="relative">
            <Img
              src={STORY_IMAGE}
              alt="Considered living with fewer, better things"
              className="h-[420px] w-full rounded-2xl object-cover lg:h-[520px]"
            />
            <div className="absolute bottom-5 right-5 rounded-xl bg-cream/95 px-5 py-4 shadow-lg">
              <p className="font-display text-2xl">88%</p>
              <p className="text-xs text-ink-soft">of each sale goes to the maker</p>
            </div>
          </div>
          <div>
            <p className="text-eyebrow text-clay">Our promise</p>
            <h2 className="font-display mt-4 text-4xl leading-tight lg:text-5xl">
              Fewer, better things — from people who make them.
            </h2>
            <p className="mt-6 text-[15px] leading-relaxed text-ink-soft">
              We meet every maker, review every material list and photograph every product ourselves.
              If something isn&apos;t built to last, it doesn&apos;t make the shelf.
            </p>
            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {VALUES.map((v) => (
                <div key={v.title} className="border-t border-ink/15 pt-4">
                  <p className="text-lg text-clay">{v.icon}</p>
                  <h3 className="font-display mt-1 text-lg">{v.title}</h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">{v.copy}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* New arrivals */}
      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-eyebrow text-clay">Just landed</p>
            <h2 className="font-display mt-3 text-4xl lg:text-5xl">New this week</h2>
          </div>
          <Link href="/shop?tag=new" className="text-sm underline underline-offset-4 hover:text-clay">
            All new arrivals
          </Link>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-4">
          {newArrivals.map((product, i) => (
            <ProductCard key={product.slug} product={product} index={i} />
          ))}
        </div>
      </section>

      {/* Sell CTA */}
      <section className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-ink text-cream">
          <Img
            src={SELL_IMAGE}
            alt="Seller preparing an order"
            className="absolute inset-0 h-full w-full object-cover opacity-35"
          />
          <div className="relative grid gap-8 px-8 py-16 lg:grid-cols-2 lg:px-14 lg:py-20">
            <div>
              <p className="text-eyebrow text-clay">Sell on MarketPam</p>
              <h2 className="font-display mt-4 text-4xl leading-tight lg:text-5xl">
                Turn your craft into a shopfront.
              </h2>
              <p className="mt-5 max-w-md text-sm leading-relaxed text-cream/75">
                List in minutes, keep 88% of every sale and reach 24,000 buyers who already come here
                looking for the real thing. No listing fees, ever.
              </p>
              <Link
                href="/sell"
                className="mt-8 inline-block rounded-full bg-cream px-8 py-4 text-eyebrow text-ink transition hover:bg-clay hover:text-white"
              >
                Apply to sell
              </Link>
            </div>
            <ul className="grid gap-4 self-center sm:grid-cols-2">
              {[
                ["01", "Tell us about your goods"],
                ["02", "We review within 48 hours"],
                ["03", "Photograph & list for free"],
                ["04", "Get paid every Friday"],
              ].map(([n, label]) => (
                <li key={n} className="rounded-xl border border-cream/20 bg-ink/40 p-5 backdrop-blur-sm">
                  <p className="text-eyebrow text-clay">{n}</p>
                  <p className="font-display mt-2 text-lg leading-snug">{label}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
        <p className="text-eyebrow text-clay">Word of mouth</p>
        <h2 className="font-display mt-3 max-w-2xl text-4xl lg:text-5xl">
          People come back. Then they bring friends.
        </h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <figure
              key={t.name}
              className="animate-fade-up flex h-full flex-col rounded-2xl border border-ink/10 bg-white/60 p-7"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <Stars rating={5} />
              <blockquote className="mt-4 flex-1 text-[15px] leading-relaxed text-ink-soft">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-6 border-t border-ink/10 pt-4">
                <p className="font-display text-base">{t.name}</p>
                <p className="text-xs text-ink-soft">{t.role}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>
    </div>
  );
}
