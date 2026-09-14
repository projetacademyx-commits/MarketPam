"use client";

import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erreur de demande.");
      }

      setSubmitted(true);
      if (data.resetUrl) {
        setResetUrl(data.resetUrl);
      }
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue");
    } finally {
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
          <h1 className="font-display mt-3 text-3xl">Mot de passe oublié</h1>
          <p className="mt-2 text-xs text-ink-soft leading-relaxed">
            Saisissez votre adresse e-mail pour recevoir un lien de réinitialisation sécurisé.
          </p>
        </div>

        {error ? (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700">
            {error}
          </div>
        ) : null}

        {submitted ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-xs text-green-800 leading-relaxed">
              Si un compte est associé à l&apos;adresse <strong>{email}</strong>, les instructions de réinitialisation ont été envoyées.
            </div>

            {resetUrl ? (
              <div className="rounded-xl border border-clay/30 bg-sand/60 p-4 text-xs text-ink">
                <p className="font-semibold text-clay">Mode Démonstration / Local :</p>
                <p className="mt-1 text-ink-soft">
                  Lien direct généré pour votre compte :
                </p>
                <Link
                  href={resetUrl}
                  className="mt-2 inline-block font-medium text-clay underline underline-offset-4 hover:text-clay-dark"
                >
                  Cliquer ici pour définir un nouveau mot de passe →
                </Link>
              </div>
            ) : null}

            <Link
              href="/login"
              className="mt-4 block w-full rounded-full bg-ink py-3 text-center text-eyebrow text-cream transition hover:bg-clay"
            >
              Retour à la connexion
            </Link>
          </div>
        ) : (
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

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-ink py-4 text-eyebrow text-cream transition hover:bg-clay disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Génération..." : "Envoyer le lien"}
            </button>

            <div className="pt-2 text-center">
              <Link
                href="/login"
                className="text-xs text-ink-soft underline underline-offset-4 hover:text-clay"
              >
                Retour à la connexion
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
