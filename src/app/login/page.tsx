"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { useAuth } from "@/components/auth-provider";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/account";
  const { refreshUser } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Adresse email ou mot de passe incorrect.");
      }

      await refreshUser();
      if (data.user?.role === "admin" && (!searchParams.get("redirect") || searchParams.get("redirect") === "/account")) {
        window.location.href = "/admin";
      } else {
        window.location.href = redirect;
      }
    } catch (err: any) {
      setError(err.message || "Erreur de connexion");
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
          <h1 className="font-display mt-3 text-3xl">Connexion</h1>
          <p className="mt-2 text-xs text-ink-soft">
            Accédez à votre espace client, suivez vos commandes et profitez de vos avantages.
          </p>
        </div>

        {error ? (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="text-eyebrow block text-xs text-ink-soft">Adresse email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ada@example.com"
              className="mt-1.5 w-full rounded-xl border border-ink/15 bg-cream px-4 py-3 text-sm outline-none transition focus:border-clay"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-eyebrow block text-xs text-ink-soft">Mot de passe</label>
              <Link
                href="/forgot-password"
                className="text-xs text-ink-soft underline underline-offset-4 hover:text-clay"
              >
                Mot de passe oublié ?
              </Link>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1.5 w-full rounded-xl border border-ink/15 bg-cream px-4 py-3 text-sm outline-none transition focus:border-clay"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-ink py-4 text-eyebrow text-cream transition hover:bg-clay disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Connexion en cours..." : "Se connecter"}
          </button>
        </form>

        <div className="mt-8 border-t border-ink/10 pt-6 text-center text-xs text-ink-soft">
          Pas encore de compte ?{" "}
          <Link
            href={redirect !== "/account" ? `/register?redirect=${encodeURIComponent(redirect)}` : "/register"}
            className="font-medium text-ink underline underline-offset-4 hover:text-clay"
          >
            Créer un compte
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center text-sm text-ink-soft">Chargement...</div>}>
      <LoginForm />
    </Suspense>
  );
}
