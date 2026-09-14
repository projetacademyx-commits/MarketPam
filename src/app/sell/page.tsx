import Link from "next/link";
import { SellForm } from "@/components/sell-form";
import { Img } from "@/components/ui";
import { SELL_IMAGE } from "@/db/seed-data";
import { getCategories } from "@/lib/queries";

export const dynamic = "force-dynamic";

const STEPS = [
  { n: "01", title: "Tell us what you make", copy: "Share materials, dimensions and how many you can supply. Two minutes, no fees." },
  { n: "02", title: "We review in 48 hours", copy: "Our buying team checks quality and fit. Around 4% of submissions are accepted." },
  { n: "03", title: "We shoot & list it", copy: "Our studio photographs your product and writes the copy — at no cost to you." },
  { n: "04", title: "Get paid every Friday", copy: "You keep 88% of every sale. Payouts land weekly, with shipping labels included." },
];

export default async function SellPage() {
  const categories = await getCategories();

  return (
    <div>
      <section className="relative overflow-hidden">
        <Img
          src={SELL_IMAGE}
          alt="A maker preparing goods to ship"
          priority
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/70 to-ink/30" />
        <div className="relative mx-auto max-w-7xl px-5 py-24 text-cream lg:px-8 lg:py-32">
          <p className="text-eyebrow animate-fade-up text-clay">Sell on MarketPam</p>
          <h1 className="font-display animate-fade-up mt-5 max-w-2xl text-[clamp(2.5rem,6vw,4.5rem)] leading-[0.98]">
            Your craft deserves a better shopfront.
          </h1>
          <p className="animate-fade-up mt-6 max-w-lg text-[15px] leading-relaxed text-cream/75">
            List anything — one-off vintage finds or a full production run. No listing fees, no
            monthly costs, and a buying audience that already values what you do.
          </p>
          <div className="animate-fade-up mt-9 flex flex-wrap gap-3">
            <a
              href="#apply"
              className="rounded-full bg-cream px-8 py-4 text-eyebrow text-ink transition hover:bg-clay hover:text-white"
            >
              Apply to sell
            </a>
            <Link
              href="/shop"
              className="rounded-full border border-cream/40 px-8 py-4 text-eyebrow transition hover:bg-cream/10"
            >
              See what sells
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <div
              key={s.n}
              className="animate-fade-up rounded-2xl border border-ink/10 bg-white/60 p-6"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <p className="text-eyebrow text-clay">{s.n}</p>
              <h2 className="font-display mt-3 text-xl leading-snug">{s.title}</h2>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">{s.copy}</p>
            </div>
          ))}
        </div>

        <dl className="mt-16 grid gap-8 border-y border-ink/10 py-10 sm:grid-cols-3">
          {[
            ["88%", "Seller take-home on every order"],
            ["48h", "Average review turnaround"],
            ["$0", "Listing and monthly fees"],
          ].map(([value, label]) => (
            <div key={label}>
              <dt className="font-display text-4xl">{value}</dt>
              <dd className="mt-2 text-sm text-ink-soft">{label}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section id="apply" className="mx-auto max-w-5xl px-5 pb-24 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.3fr]">
          <div>
            <p className="text-eyebrow text-clay">Apply</p>
            <h2 className="font-display mt-3 text-4xl leading-tight">
              Tell us what you&apos;d like to sell.
            </h2>
            <p className="mt-5 text-[15px] leading-relaxed text-ink-soft">
              One product or one hundred — start with whatever you&apos;re proudest of. We read every
              submission ourselves and reply within two business days.
            </p>
            <ul className="mt-8 space-y-3 text-sm text-ink-soft">
              {[
                "No exclusivity — sell elsewhere too",
                "Free studio photography for accepted goods",
                "Prepaid shipping labels on every order",
                "Direct line to a real buyer, not a bot",
              ].map((point) => (
                <li key={point} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-clay" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
          <SellForm categories={categories.map((c) => ({ slug: c.slug, name: c.name }))} />
        </div>
      </section>
    </div>
  );
}
