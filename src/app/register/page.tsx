"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { useAuth } from "@/components/auth-provider";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/account";
  const { refreshUser } = useAuth();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        throw new Error("Une erreur inattendue est survenue. Veuillez vérifier votre connexion à la base de données.");
      }

      if (!res.ok) {
        throw new Error(data.error || "Une erreur est survenue lors de l'inscription.");
      }

      await refreshUser();
      window.location.href = redirect;
    } catch (err: any) {
      setError(err.message || "Erreur d'inscription");
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-5 py-16 sm:py-24">
      <div className="rounded-3xl border border-ink/10 bg-white/70 p-8 shadow-sm sm:p-10 backdrop-blur-md animate-fade-up">
        <div className="text-center">
          <Link href="/" className="font-display text-2xl tracking-tight text-ink">
            MarketPam
          </Link>
          <h1 className="font-display mt-3 text-3xl">Créer un compte</h1>
          <p className="mt-2 text-xs text-ink-soft">
            Rejoignez-nous pour commander, enregistrer vos adresses et suivre vos colis en temps réel.
          </p>
        </div>

        {error ? (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-eyebrow block text-xs text-ink-soft">Prénom</label>
              <input
                required
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                placeholder="Ada"
                className="mt-1.5 w-full rounded-xl border border-ink/15 bg-cream px-4 py-3 text-sm outline-none transition focus:border-clay"
              />
            </div>
            <div>
              <label className="text-eyebrow block text-xs text-ink-soft">Nom</label>
              <input
                required
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                placeholder="Lovelace"
                className="mt-1.5 w-full rounded-xl border border-ink/15 bg-cream px-4 py-3 text-sm outline-none transition focus:border-clay"
              />
            </div>
          </div>

          <div>
            <label className="text-eyebrow block text-xs text-ink-soft">Adresse email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="ada@example.com"
              className="mt-1.5 w-full rounded-xl border border-ink/15 bg-cream px-4 py-3 text-sm outline-none transition focus:border-clay"
            />
          </div>

          <div>
            <label className="text-eyebrow block text-xs text-ink-soft">Mot de passe (8 caractères min.)</label>
            <input
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              className="mt-1.5 w-full rounded-xl border border-ink/15 bg-cream px-4 py-3 text-sm outline-none transition focus:border-clay"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-ink py-4 text-eyebrow text-cream transition hover:bg-clay disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Création du compte..." : "Créer mon compte"}
          </button>
        </form>

        <div className="mt-8 border-t border-ink/10 pt-6 text-center text-xs text-ink-soft">
          Vous avez déjà un compte ?{" "}
          <Link
            href={redirect !== "/account" ? `/login?redirect=${encodeURIComponent(redirect)}` : "/login"}
            className="font-medium text-ink underline underline-offset-4 hover:text-clay"
          >
            Se connecter
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center text-sm text-ink-soft">Chargement...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
