"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Stars } from "@/components/ui";
import { formatDate } from "@/lib/format";

export type ReviewItem = {
  id: number;
  author: string;
  rating: number;
  title: string;
  body: string;
  verified: boolean;
  createdAt: string | Date;
};

export function ReviewSection({
  slug,
  reviews,
  rating,
}: {
  slug: string;
  reviews: ReviewItem[];
  rating: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ author: "", rating: 5, title: "", body: "" });
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [visible, setVisible] = useState(4);

  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));
  const total = reviews.length || 1;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("saving");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, productSlug: slug }),
      });
      if (!res.ok) throw new Error("failed");
      setStatus("done");
      setForm({ author: "", rating: 5, title: "", body: "" });
      router.refresh();
      setTimeout(() => {
        setOpen(false);
        setStatus("idle");
      }, 1400);
    } catch {
      setStatus("error");
    }
  };

  return (
    <section id="reviews" className="border-t border-ink/10 py-16">
      <div className="grid gap-12 lg:grid-cols-[320px_1fr]">
        <div>
          <p className="text-eyebrow text-clay">Reviews</p>
          <h2 className="font-display mt-3 text-4xl">
            {rating.toFixed(1)}
            <span className="text-xl text-ink-soft">/5</span>
          </h2>
          <div className="mt-2 flex items-center gap-2">
            <Stars rating={rating} size={16} />
            <span className="text-xs text-ink-soft">{reviews.length} verified reviews</span>
          </div>

          <div className="mt-6 space-y-2">
            {distribution.map((d) => (
              <div key={d.star} className="flex items-center gap-3 text-xs text-ink-soft">
                <span className="w-8">{d.star}★</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-sand">
                  <div
                    className="h-full rounded-full bg-clay transition-all duration-700"
                    style={{ width: `${(d.count / total) * 100}%` }}
                  />
                </div>
                <span className="w-6 text-right">{d.count}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => setOpen((v) => !v)}
            className="mt-8 w-full rounded-full border border-ink/20 py-3 text-eyebrow transition hover:bg-ink hover:text-cream"
          >
            {open ? "Close review form" : "Write a review"}
          </button>

          {open ? (
            <form onSubmit={submit} className="animate-fade-up mt-6 space-y-4 rounded-2xl bg-white/70 p-5">
              <div>
                <label className="text-eyebrow text-ink-soft">Your rating</label>
                <div className="mt-2 flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, rating: n }))}
                      className={`text-2xl leading-none transition ${
                        n <= form.rating ? "text-clay" : "text-ink/20"
                      }`}
                      aria-label={`${n} star${n > 1 ? "s" : ""}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <Field
                label="Name"
                value={form.author}
                onChange={(v) => setForm((f) => ({ ...f, author: v }))}
                required
              />
              <Field
                label="Headline"
                value={form.title}
                onChange={(v) => setForm((f) => ({ ...f, title: v }))}
                required
              />
              <div>
                <label className="text-eyebrow text-ink-soft">Review</label>
                <textarea
                  value={form.body}
                  onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                  required
                  rows={4}
                  className="mt-2 w-full rounded-lg border border-ink/15 bg-cream px-3 py-2 text-sm outline-none focus:border-clay"
                />
              </div>
              <button
                type="submit"
                disabled={status === "saving"}
                className="w-full rounded-full bg-ink py-3 text-eyebrow text-cream transition hover:bg-clay disabled:opacity-50"
              >
                {status === "saving" ? "Publishing…" : status === "done" ? "Thank you ✓" : "Publish review"}
              </button>
              {status === "error" ? (
                <p className="text-xs text-clay">Something went wrong. Please try again.</p>
              ) : null}
            </form>
          ) : null}
        </div>

        <div>
          <ul className="space-y-8">
            {reviews.slice(0, visible).map((review) => (
              <li key={review.id} className="border-b border-ink/10 pb-8 last:border-0">
                <div className="flex flex-wrap items-center gap-3">
                  <Stars rating={review.rating} size={13} />
                  <h3 className="font-display text-lg">{review.title}</h3>
                </div>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{review.body}</p>
                <p className="mt-3 text-xs text-ink-soft">
                  <span className="text-ink">{review.author}</span>
                  {review.verified ? <span className="mx-2 text-clay">✓ Verified buyer</span> : null}
                  <span>{formatDate(review.createdAt)}</span>
                </p>
              </li>
            ))}
          </ul>
          {visible < reviews.length ? (
            <button
              onClick={() => setVisible((v) => v + 4)}
              className="mt-8 rounded-full border border-ink/20 px-6 py-3 text-eyebrow transition hover:bg-sand"
            >
              Load more reviews
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <div>
      <label className="text-eyebrow text-ink-soft">{label}</label>
      <input
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-lg border border-ink/15 bg-cream px-3 py-2 text-sm outline-none focus:border-clay"
      />
    </div>
  );
}
