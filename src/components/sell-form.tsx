"use client";

import { useState } from "react";

const CONDITIONS = ["new", "like-new", "gently-used", "vintage"];

export function SellForm({ categories }: { categories: { slug: string; name: string }[] }) {
  const [form, setForm] = useState({
    sellerName: "",
    email: "",
    title: "",
    categorySlug: categories[0]?.slug ?? "home",
    condition: "like-new",
    askingPrice: "",
    description: "",
  });
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("saving");
    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, askingPrice: Number(form.askingPrice) || 0 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Submission failed");
      setStatus("done");
      setMessage(`Listing #${data.listing.id} received — our buyers reply within 48 hours.`);
      setForm((f) => ({ ...f, title: "", askingPrice: "", description: "" }));
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5 rounded-2xl border border-ink/10 bg-white/70 p-7">
      <div className="grid gap-5 sm:grid-cols-2">
        <Text label="Your name" value={form.sellerName} onChange={(v) => setForm((f) => ({ ...f, sellerName: v }))} required />
        <Text label="Email" type="email" value={form.email} onChange={(v) => setForm((f) => ({ ...f, email: v }))} required />
      </div>
      <Text label="What are you selling?" value={form.title} onChange={(v) => setForm((f) => ({ ...f, title: v }))} required placeholder="Hand-thrown stoneware carafe" />
      <div className="grid gap-5 sm:grid-cols-3">
        <label className="block">
          <span className="text-eyebrow text-ink-soft">Collection</span>
          <select
            value={form.categorySlug}
            onChange={(e) => setForm((f) => ({ ...f, categorySlug: e.target.value }))}
            className="mt-2 w-full rounded-lg border border-ink/15 bg-cream px-4 py-3 text-sm outline-none focus:border-clay"
          >
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-eyebrow text-ink-soft">Condition</span>
          <select
            value={form.condition}
            onChange={(e) => setForm((f) => ({ ...f, condition: e.target.value }))}
            className="mt-2 w-full rounded-lg border border-ink/15 bg-cream px-4 py-3 text-sm capitalize outline-none focus:border-clay"
          >
            {CONDITIONS.map((c) => (
              <option key={c} value={c}>
                {c.replace("-", " ")}
              </option>
            ))}
          </select>
        </label>
        <Text
          label="Asking price (USD)"
          value={form.askingPrice}
          onChange={(v) => setForm((f) => ({ ...f, askingPrice: v.replace(/[^0-9.]/g, "") }))}
          placeholder="120"
        />
      </div>
      <label className="block">
        <span className="text-eyebrow text-ink-soft">Tell us about it</span>
        <textarea
          rows={4}
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="Materials, dimensions, how it's made, how many you can supply each month…"
          className="mt-2 w-full rounded-lg border border-ink/15 bg-cream px-4 py-3 text-sm outline-none focus:border-clay"
        />
      </label>
      <button
        type="submit"
        disabled={status === "saving"}
        className="w-full rounded-full bg-ink py-4 text-eyebrow text-cream transition hover:bg-clay disabled:opacity-50"
      >
        {status === "saving" ? "Sending…" : status === "done" ? "Submitted ✓" : "Submit for review"}
      </button>
      {message ? (
        <p className={`text-sm ${status === "error" ? "text-clay" : "text-moss"}`}>{message}</p>
      ) : null}
    </form>
  );
}

function Text({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-eyebrow text-ink-soft">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-lg border border-ink/15 bg-cream px-4 py-3 text-sm outline-none transition focus:border-clay"
      />
    </label>
  );
}
