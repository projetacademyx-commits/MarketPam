"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/components/cart-provider";
import { useAuth } from "@/components/auth-provider";
import { Img } from "@/components/ui";
import { SHIPPING_OPTIONS, computeTotals, formatPrice } from "@/lib/format";
import type { Address } from "@/db/schema";

const STEPS = ["Coordonnées & Livraison", "Mode d'expédition", "Paiement sécurisé"] as const;

export default function CheckoutPage() {
  const { items, subtotal, updateQuantity, removeItem, clearCart, hydrated } = useCart();
  const { user, defaultAddress, loading: authLoading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [shippingMethod, setShippingMethod] = useState<string>("standard");
  const [paymentMethod, setPaymentMethod] = useState<"moncash" | "cod">("moncash");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [addresses, setAddresses] = useState<Address[]>([]);

  // Formulaire d'adresse et de coordonnées
  const [form, setForm] = useState({
    email: "",
    fullName: "",
    address: "",
    city: "",
    postalCode: "",
    country: "France",
  });

  // Géolocalisation pour Paiement à la livraison
  const [geoCoords, setGeoCoords] = useState<{
    lat: string;
    lng: string;
    accuracy: string;
  } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState("");

  // Pré-remplissage avec les informations du compte connecté
  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        email: user.email,
        fullName: `${user.firstName} ${user.lastName}`,
        address: defaultAddress?.street || prev.address,
        city: defaultAddress?.city || prev.city,
        postalCode: defaultAddress?.postalCode || prev.postalCode,
        country: defaultAddress?.country || prev.country || "France",
      }));

      // Charger les autres adresses si existantes
      fetch("/api/user/addresses")
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data.addresses)) {
            setAddresses(data.addresses);
          }
        })
        .catch(() => {});
    }
  }, [user, defaultAddress]);

  const totals = useMemo(() => computeTotals(subtotal, shippingMethod), [subtotal, shippingMethod]);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  // Demande de géolocalisation pour le paiement à la livraison
  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      setGeoError("La géolocalisation n'est pas supportée par votre navigateur.");
      return;
    }
    setGeoLoading(true);
    setGeoError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoCoords({
          lat: pos.coords.latitude.toFixed(6),
          lng: pos.coords.longitude.toFixed(6),
          accuracy: `${Math.round(pos.coords.accuracy)}m`,
        });
        setGeoLoading(false);
      },
      (err) => {
        setGeoLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError(
            "Accès à la position refusé. Veuillez autoriser la localisation dans les paramètres de votre navigateur pour valider le paiement à la livraison.",
          );
        } else {
          setGeoError("Impossible de récupérer votre position. Veuillez réessayer.");
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  };

  const infoValid =
    form.email.includes("@") && form.fullName.length > 1 && form.address.length > 3 && form.city.length > 1;

  const codPaymentValid = geoCoords !== null;
  const isPaymentValid = paymentMethod === "moncash" || codPaymentValid;

  const placeOrder = async () => {
    setSubmitting(true);
    setError("");
    try {
      const isMonCash = paymentMethod === "moncash";
      const res = await fetch(isMonCash ? "/api/moncash/checkout" : "/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          address: form.address,
          city: form.city,
          postalCode: form.postalCode,
          country: form.country,
          shippingMethod,
          paymentMethod,
          latitude: geoCoords?.lat,
          longitude: geoCoords?.lng,
          locationAccuracy: geoCoords?.accuracy,
          items: items.map((i) => ({ slug: i.slug, quantity: i.quantity, variant: i.variant })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Échec de la commande");

      if (isMonCash && data.redirectUrl) {
        window.location.assign(data.redirectUrl);
        return;
      }

      clearCart();
      router.push(`/order/${data.orderNumber}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue lors de la commande.");
      setSubmitting(false);
    }
  };

  // 1. Si utilisateur non connecté : invite obligatoire
  if (!authLoading && !user) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center px-5 py-24 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-sand text-3xl">🔒</div>
        <h1 className="font-display mt-6 text-4xl">Connexion obligatoire</h1>
        <p className="mt-4 max-w-md text-sm text-ink-soft leading-relaxed">
          Pour finaliser votre commande et bénéficier d&apos;un suivi en direct de vos livraisons,
          vous devez être connecté à votre compte MarketPam. Vos articles restent bien au chaud dans votre panier !
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/login?redirect=/checkout"
            className="rounded-full bg-ink px-8 py-4 text-eyebrow text-cream transition hover:bg-clay"
          >
            Se connecter
          </Link>
          <Link
            href="/register?redirect=/checkout"
            className="rounded-full border border-ink/20 px-8 py-4 text-eyebrow transition hover:bg-sand"
          >
            Créer un compte
          </Link>
        </div>
      </div>
    );
  }

  // 2. Si panier vide
  if (hydrated && items.length === 0) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center px-5 py-28 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-sand text-3xl">🧺</div>
        <h1 className="font-display mt-6 text-4xl">Votre panier est vide</h1>
        <p className="mt-4 max-w-sm text-sm text-ink-soft">
          Découvrez nos collections et ajoutez vos coups de cœur pour passer commande.
        </p>
        <Link
          href="/shop"
          className="mt-8 rounded-full bg-ink px-8 py-4 text-eyebrow text-cream transition hover:bg-clay"
        >
          Parcourir la boutique
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 lg:px-8 lg:py-14">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-eyebrow text-clay">Commande sécurisée</span>
          <h1 className="font-display text-4xl lg:text-5xl">Validation de commande</h1>
        </div>
        <Link href="/shop" className="text-sm underline underline-offset-4 hover:text-clay">
          Continuer mes achats
        </Link>
      </div>

      <ol className="mt-8 flex items-center gap-3 text-xs">
        {STEPS.map((label, i) => (
          <li key={label} className="flex items-center gap-3">
            <button
              onClick={() => (i < step ? setStep(i) : undefined)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 transition ${
                i === step
                  ? "bg-ink text-cream font-medium"
                  : i < step
                    ? "bg-sand text-ink"
                    : "border border-ink/15 text-ink-soft"
              }`}
            >
              <span className="tabular-nums font-bold">{i + 1}</span> {label}
            </button>
            {i < STEPS.length - 1 ? <span className="h-px w-6 bg-ink/20" /> : null}
          </li>
        ))}
      </ol>

      <div className="mt-10 grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
        <div className="animate-fade-in" key={step}>
          {step === 0 ? (
            <section className="space-y-6">
              <h2 className="font-display text-2xl">Coordonnées & livraison</h2>

              {addresses.length > 0 ? (
                <div className="rounded-2xl border border-ink/15 bg-sand/40 p-5">
                  <p className="text-xs font-semibold text-ink mb-3">Choisir une adresse enregistrée :</p>
                  <div className="flex flex-wrap gap-2">
                    {addresses.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            fullName: a.fullName,
                            address: a.street,
                            city: a.city,
                            postalCode: a.postalCode,
                            country: a.country,
                          }))
                        }
                        className="rounded-xl border border-ink/20 bg-white px-4 py-2.5 text-xs text-left transition hover:border-clay hover:shadow-sm"
                      >
                        <span className="font-semibold block text-ink">{a.fullName}</span>
                        <span className="text-ink-soft block">{a.street}, {a.city}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <Field label="Adresse email" value={form.email} onChange={set("email")} type="email" placeholder="ada@example.com" />
              <Field label="Nom complet du destinataire" value={form.fullName} onChange={set("fullName")} placeholder="Jean Dupont" />
              <Field label="Adresse de livraison" value={form.address} onChange={set("address")} placeholder="128 Rue Principale" />
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Ville" value={form.city} onChange={set("city")} placeholder="Port-au-Prince / Paris" />
                <Field label="Code postal" value={form.postalCode} onChange={set("postalCode")} placeholder="HT-6110 / 75001" />
                <Field label="Pays" value={form.country} onChange={set("country")} />
              </div>
              <button
                onClick={() => setStep(1)}
                disabled={!infoValid}
                className="w-full rounded-full bg-ink py-4 text-eyebrow text-cream transition hover:bg-clay disabled:cursor-not-allowed disabled:opacity-40"
              >
                Continuer vers la livraison
              </button>
            </section>
          ) : null}

          {step === 1 ? (
            <section className="space-y-6">
              <h2 className="font-display text-2xl">Mode de livraison</h2>
              <div className="space-y-3">
                {SHIPPING_OPTIONS.map((option) => {
                  const free = option.id === "standard" && subtotal >= 15000;
                  return (
                    <button
                      key={option.id}
                      onClick={() => setShippingMethod(option.id)}
                      className={`flex w-full items-center justify-between rounded-2xl border px-5 py-4 text-left transition ${
                        shippingMethod === option.id
                          ? "border-clay bg-white shadow-sm ring-1 ring-clay/30"
                          : "border-ink/15 hover:border-ink/40 bg-white/60"
                      }`}
                    >
                      <span>
                        <span className="block text-sm font-medium text-ink">{option.label}</span>
                        <span className="block text-xs text-ink-soft">{option.detail}</span>
                      </span>
                      <span className="text-sm font-semibold text-ink">
                        {free ? "Offert" : formatPrice(option.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="rounded-xl bg-sand/70 px-5 py-4 text-xs leading-relaxed text-ink-soft">
                Livraison à l&apos;adresse : <span className="text-ink font-medium">{form.address || "—"}, {form.city} {form.postalCode}</span>,{" "}
                {form.country}.{" "}
                <button onClick={() => setStep(0)} className="underline underline-offset-4 hover:text-clay">
                  Modifier
                </button>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(0)}
                  className="rounded-full border border-ink/20 px-6 py-4 text-eyebrow transition hover:bg-sand"
                >
                  Retour
                </button>
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 rounded-full bg-ink py-4 text-eyebrow text-cream transition hover:bg-clay"
                >
                  Passer au paiement
                </button>
              </div>
            </section>
          ) : null}

          {step === 2 ? (
            <section className="space-y-6">
              <h2 className="font-display text-2xl">Mode de règlement</h2>

              {/* Sélecteur de méthode de paiement */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("moncash")}
                  className={`flex items-center gap-3 p-4 rounded-2xl border text-left transition ${
                    paymentMethod === "moncash"
                      ? "border-clay bg-white shadow-md ring-2 ring-clay/20"
                      : "border-ink/15 bg-white/60 hover:border-ink/30"
                  }`}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sand text-lg">📱</div>
                  <div>
                    <span className="block text-xs font-bold text-ink">MonCash</span>
                    <span className="block text-[11px] text-ink-soft">Paiement sécurisé via Digicel</span>
                  </div>
                  <span className="ml-auto rounded bg-red-600 px-2 py-1 text-[10px] font-black text-white">MonCash</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("cod")}
                  className={`flex items-center gap-3 p-4 rounded-2xl border text-left transition ${
                    paymentMethod === "cod"
                      ? "border-clay bg-white shadow-md ring-2 ring-clay/20"
                      : "border-ink/15 bg-white/60 hover:border-ink/30"
                  }`}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sand text-lg">💵</div>
                  <div>
                    <span className="block text-xs font-bold text-ink">Paiement à la livraison</span>
                    <span className="block text-[11px] text-ink-soft">Règlement en main propre (GPS requis)</span>
                  </div>
                </button>
              </div>

              {paymentMethod === "moncash" ? (
                <div className="rounded-2xl border border-ink/15 bg-white/80 p-6 shadow-sm">
                  <p className="text-sm font-semibold text-ink">Vous serez redirigé vers MonCash pour autoriser le paiement.</p>
                  <p className="mt-2 text-xs leading-relaxed text-ink-soft">
                    Le montant sera converti en gourdes haïtiennes selon le taux configuré par la boutique. Votre commande ne sera confirmée qu&apos;après vérification du paiement par MonCash.
                  </p>
                </div>
              ) : null}

              {/* Formulaire Paiement à la livraison avec Géolocalisation Obligatoire */}
              {paymentMethod === "cod" ? (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-50/50 p-6 shadow-sm space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">📍</span>
                    <div>
                      <h3 className="font-display text-lg text-ink">Localisation GPS requise pour la livraison</h3>
                      <p className="mt-1 text-xs text-ink-soft leading-relaxed">
                        Pour garantir la sécurité du livreur et la remise en main propre exacte de votre commande, vous devez autoriser et enregistrer votre position GPS.
                      </p>
                    </div>
                  </div>

                  {geoCoords ? (
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-50 p-4 text-emerald-900 animate-fade-in">
                      <div className="flex items-center gap-2 font-semibold text-xs text-emerald-800">
                        <span>✓ Position GPS validée et transmise au livreur</span>
                      </div>
                      <div className="mt-2 grid grid-cols-3 gap-2 text-[11px] font-mono bg-white/70 rounded-lg p-2.5 border border-emerald-200">
                        <div>
                          <span className="text-ink-soft block">Latitude :</span>
                          <span className="font-bold text-ink">{geoCoords.lat}</span>
                        </div>
                        <div>
                          <span className="text-ink-soft block">Longitude :</span>
                          <span className="font-bold text-ink">{geoCoords.lng}</span>
                        </div>
                        <div>
                          <span className="text-ink-soft block">Précision :</span>
                          <span className="font-bold text-emerald-700">±{geoCoords.accuracy}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRequestLocation}
                        className="mt-3 text-[11px] text-emerald-700 underline underline-offset-2 hover:text-emerald-900"
                      >
                        Recalibrer ma position GPS
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 pt-2">
                      <button
                        type="button"
                        onClick={handleRequestLocation}
                        disabled={geoLoading}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold py-3.5 px-4 text-xs shadow-md transition disabled:opacity-50"
                      >
                        <span>{geoLoading ? "Capture de votre position GPS en cours..." : "📍 Autoriser et certifier ma position de livraison"}</span>
                      </button>
                      {geoError ? (
                        <p className="text-xs text-red-600 font-medium bg-red-50 p-3 rounded-lg border border-red-200">
                          ⚠️ {geoError}
                        </p>
                      ) : (
                        <p className="text-[11px] text-ink-soft text-center">
                          Cliquez sur le bouton pour autoriser l&apos;accès à votre localisation via votre navigateur.
                        </p>
                      )}
                    </div>
                  )}

                  <div className="rounded-xl bg-white/80 p-3.5 border border-ink/10 text-xs text-ink-soft">
                    ℹ️ <span className="font-medium text-ink">Instructions de remise :</span> Le montant total de{" "}
                    <strong className="text-clay">{formatPrice(totals.total)}</strong> sera remis en espèces au livreur lors de la réception du colis.
                  </div>
                </div>
              ) : null}

              {error ? <p className="text-sm font-medium text-clay bg-red-50 p-3 rounded-lg border border-red-200">{error}</p> : null}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep(1)}
                  className="rounded-full border border-ink/20 px-6 py-4 text-eyebrow transition hover:bg-sand"
                >
                  Retour
                </button>
                <button
                  onClick={placeOrder}
                  disabled={!isPaymentValid || submitting}
                  className="flex-1 rounded-full bg-clay py-4 text-eyebrow text-white transition hover:bg-clay-dark disabled:cursor-not-allowed disabled:opacity-40 shadow-lg shadow-clay/20"
                >
                  {submitting
                    ? "Validation de la commande..."
                    : paymentMethod === "cod"
                      ? `Confirmer la commande (${formatPrice(totals.total)} à la livraison)`
                      : `Payer ${formatPrice(totals.total)} avec MonCash`}
                </button>
              </div>
            </section>
          ) : null}
        </div>

        <aside className="h-fit rounded-2xl border border-ink/10 bg-white/60 p-6 lg:sticky lg:top-28 shadow-sm">
          <h2 className="font-display text-xl">Récapitulatif de commande</h2>
          <ul className="mt-5 space-y-4">
            {items.map((item) => (
              <li key={`${item.slug}-${item.variant ?? ""}`} className="flex gap-4">
                <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-sand border border-ink/10">
                  <Img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                  <span className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1 text-[10px] text-cream">
                    {item.quantity}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{item.name}</p>
                  {item.variant ? <p className="text-xs text-ink-soft">{item.variant}</p> : null}
                  <div className="mt-1 flex items-center gap-3 text-xs text-ink-soft">
                    <button
                      onClick={() => updateQuantity(item.slug, item.quantity - 1, item.variant)}
                      className="hover:text-clay font-bold"
                    >
                      −
                    </button>
                    <span className="tabular-nums font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.slug, item.quantity + 1, item.variant)}
                      className="hover:text-clay font-bold"
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeItem(item.slug, item.variant)}
                      className="ml-auto underline underline-offset-4 hover:text-clay"
                    >
                      Retirer
                    </button>
                  </div>
                </div>
                <p className="whitespace-nowrap text-sm font-semibold text-ink">{formatPrice(item.price * item.quantity)}</p>
              </li>
            ))}
          </ul>

          <dl className="mt-6 space-y-2 border-t border-ink/10 pt-5 text-sm">
            <Row label="Sous-total" value={formatPrice(subtotal)} />
            <Row label="Livraison" value={totals.shipping === 0 ? "Offerte" : formatPrice(totals.shipping)} />
            <Row label="Estimation taxes" value={formatPrice(totals.tax)} />
            <div className="flex items-center justify-between border-t border-ink/10 pt-3">
              <dt className="font-display text-lg">Total TTC</dt>
              <dd className="font-display text-lg text-clay font-bold">{formatPrice(totals.total)}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-ink-soft">
      <dt>{label}</dt>
      <dd className="text-ink font-medium">{value}</dd>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-eyebrow text-ink-soft">{label}</span>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="mt-2 w-full rounded-xl border border-ink/15 bg-cream px-4 py-3 text-sm outline-none transition focus:border-clay focus:ring-1 focus:ring-clay/30"
      />
    </label>
  );
}
