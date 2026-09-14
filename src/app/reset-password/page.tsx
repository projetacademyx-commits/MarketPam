"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { useAuth } from "@/components/auth-provider";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const { refreshUser } = useAuth();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Échec de la réinitialisation.");
      }

      setSuccess(true);
      await refreshUser();
      setTimeout(() => {
        router.push("/account");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue.");
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="mx-auto max-w-md px-5 py-24 text-center">
        <h1 className="font-display text-2xl">Lien manquant</h1>
        <p className="mt-2 text-xs text-ink-soft">
          Aucun jeton de réinitialisation n&apos;a été détecté dans l&apos;adresse.
        </p>
        <Link
          href="/forgot-password"
          className="mt-6 inline-block rounded-full bg-ink px-6 py-3 text-eyebrow text-cream"
        >
          Refaire une demande
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-5 py-16 sm:py-24">
      <div className="rounded-3xl border border-ink/10 bg-white/70 p-8 shadow-sm sm:p-10 backdrop-blur-md animate-fade-up">
        <div className="text-center">
          <Link href="/" className="font-display text-2xl tracking-tight text-ink">
            MarketPam
          </Link>
          <h1 className="font-display mt-3 text-3xl">Nouveau mot de passe</h1>
          <p className="mt-2 text-xs text-ink-soft">
            Choisissez un mot de passe sécurisé comportant au moins 8 caractères.
          </p>
        </div>

        {error ? (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="mt-6 space-y-4 text-center">
            <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-xs text-green-800">
              Votre mot de passe a été modifié avec succès ! Redirection vers votre espace client...
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="text-eyebrow block text-xs text-ink-soft">Nouveau mot de passe</label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1.5 w-full rounded-xl border border-ink/15 bg-cream px-4 py-3 text-sm outline-none transition focus:border-clay"
              />
            </div>

            <div>
              <label className="text-eyebrow block text-xs text-ink-soft">Confirmer le mot de passe</label>
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1.5 w-full rounded-xl border border-ink/15 bg-cream px-4 py-3 text-sm outline-none transition focus:border-clay"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-ink py-4 text-eyebrow text-cream transition hover:bg-clay disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Modification..." : "Enregistrer le mot de passe"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center text-sm text-ink-soft">Chargement...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
