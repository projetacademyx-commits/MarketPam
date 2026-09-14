"use client";

import { useState } from "react";
import Link from "next/link";

export function AuthModal({
  message,
  onClose,
  onSuccess,
}: {
  message?: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";
      const payload = isRegister
        ? form
        : { email: form.email, password: form.password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Une erreur est survenue.");
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-md rounded-2xl border border-ink/10 bg-cream p-6 shadow-2xl sm:p-8 animate-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-ink-soft transition hover:bg-sand hover:text-ink"
          aria-label="Fermer"
        >
          ✕
        </button>

        <div className="mb-6 text-center">
          <span className="font-display text-2xl tracking-tight text-ink">MarketPam</span>
          <h2 className="font-display mt-2 text-2xl text-ink">
            {isRegister ? "Créer un compte" : "Connexion"}
          </h2>
          {message ? (
            <p className="mt-2 text-xs leading-relaxed text-clay">{message}</p>
          ) : (
            <p className="mt-2 text-xs text-ink-soft">
              {isRegister
                ? "Rejoignez MarketPam pour enregistrer vos commandes et suivre vos livraisons."
                : "Connectez-vous pour finaliser votre commande."}
            </p>
          )}
        </div>

        {error ? (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-eyebrow block text-xs text-ink-soft">Prénom</label>
                <input
                  required
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  placeholder="Ada"
                  className="mt-1 w-full rounded-lg border border-ink/15 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-clay"
                />
              </div>
              <div>
                <label className="text-eyebrow block text-xs text-ink-soft">Nom</label>
                <input
                  required
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  placeholder="Lovelace"
                  className="mt-1 w-full rounded-lg border border-ink/15 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-clay"
                />
              </div>
            </div>
          ) : null}

          <div>
            <label className="text-eyebrow block text-xs text-ink-soft">Adresse email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="votre@email.com"
              className="mt-1 w-full rounded-lg border border-ink/15 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-clay"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-eyebrow block text-xs text-ink-soft">Mot de passe</label>
              {!isRegister ? (
                <Link
                  href="/forgot-password"
                  onClick={onClose}
                  className="text-[11px] text-ink-soft underline underline-offset-2 hover:text-clay"
                >
                  Oublié ?
                </Link>
              ) : null}
            </div>
            <input
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              className="mt-1 w-full rounded-lg border border-ink/15 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-clay"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-ink py-3 text-eyebrow text-cream transition hover:bg-clay disabled:opacity-50"
          >
            {loading
              ? "Patientez..."
              : isRegister
                ? "Créer mon compte"
                : "Se connecter"}
          </button>
        </form>

        <div className="mt-5 border-t border-ink/10 pt-4 text-center text-xs text-ink-soft">
          {isRegister ? (
            <p>
              Déjà un compte ?{" "}
              <button
                type="button"
                onClick={() => {
                  setIsRegister(false);
                  setError("");
                }}
                className="font-medium text-ink underline underline-offset-2 hover:text-clay"
              >
                Se connecter
              </button>
            </p>
          ) : (
            <p>
              Pas encore de compte ?{" "}
              <button
                type="button"
                onClick={() => {
                  setIsRegister(true);
                  setError("");
                }}
                className="font-medium text-ink underline underline-offset-2 hover:text-clay"
              >
                Créer un compte
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
