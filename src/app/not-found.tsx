import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-5 py-32 text-center">
      <p className="text-eyebrow text-clay">404</p>
      <h1 className="font-display mt-4 text-5xl">We couldn&apos;t find that page</h1>
      <p className="mt-5 max-w-sm text-sm leading-relaxed text-ink-soft">
        The piece you&apos;re looking for may have sold out or moved. The rest of the shop is right
        this way.
      </p>
      <Link
        href="/shop"
        className="mt-9 rounded-full bg-ink px-8 py-4 text-eyebrow text-cream transition hover:bg-clay"
      >
        Back to the shop
      </Link>
    </div>
  );
}
