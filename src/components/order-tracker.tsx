"use client";

import { useMemo } from "react";

export type TrackingData = {
  carrier: string;
  trackingNumber: string;
  trackingUrl?: string;
  estimatedDelivery?: string | Date | null;
  currentStatus: string;
  statusMessage: string;
  updatedAt?: string | Date;
};

const STEPS = [
  { id: "confirmed", label: "Confirmée", desc: "Commande validée" },
  { id: "processing", label: "Préparée", desc: "Colis emballé" },
  { id: "shipped", label: "Expédiée", desc: "Remis au transporteur" },
  { id: "out_for_delivery", label: "En livraison", desc: "En tournée locale" },
  { id: "delivered", label: "Livrée", desc: "Remis au client" },
] as const;

export function OrderTracker({
  orderNumber,
  status,
  tracking,
}: {
  orderNumber: string;
  status: string;
  tracking?: TrackingData | null;
}) {
  const currentStatus = tracking?.currentStatus || status || "confirmed";
  const isCancelled = currentStatus === "cancelled";

  const stepIndex = useMemo(() => {
    if (isCancelled) return -1;
    const idx = STEPS.findIndex((s) => s.id === currentStatus);
    return idx >= 0 ? idx : 0;
  }, [currentStatus, isCancelled]);

  const eta = useMemo(() => {
    if (!tracking?.estimatedDelivery) return null;
    const date = new Date(tracking.estimatedDelivery);
    const diffDays = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    const formatted = new Intl.DateTimeFormat("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(date);

    return { formatted, diffDays };
  }, [tracking?.estimatedDelivery]);

  return (
    <div className="rounded-2xl border border-ink/10 bg-sand/30 p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink/10 pb-5">
        <div>
          <span className="text-eyebrow text-ink-soft">Suivi du colis</span>
          <p className="font-display text-2xl text-ink">{orderNumber}</p>
        </div>
        <div className="flex items-center gap-2">
          {isCancelled ? (
            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
              Commande annulée
            </span>
          ) : currentStatus === "delivered" ? (
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
              ✓ Colis livré
            </span>
          ) : (
            <span className="rounded-full bg-clay/15 px-3 py-1 text-xs font-semibold text-clay">
              ● En cours d&apos;acheminement
            </span>
          )}
        </div>
      </div>

      {/* Barre de progression des étapes */}
      {!isCancelled ? (
        <div className="mt-8">
          {/* Version Desktop Stepper */}
          <div className="hidden sm:block">
            <div className="relative flex items-center justify-between">
              {/* Ligne de fond */}
              <div className="absolute left-0 top-1/2 h-1 w-full -translate-y-1/2 bg-ink/15 rounded-full" />
              {/* Ligne active */}
              <div
                className="absolute left-0 top-1/2 h-1 -translate-y-1/2 bg-clay rounded-full transition-all duration-700"
                style={{ width: `${(stepIndex / (STEPS.length - 1)) * 100}%` }}
              />

              {STEPS.map((step, idx) => {
                const isPassed = idx <= stepIndex;
                const isCurrent = idx === stepIndex;

                return (
                  <div key={step.id} className="relative z-10 flex flex-col items-center">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300 ${
                        isCurrent
                          ? "bg-clay text-white ring-4 ring-clay/25 scale-110 shadow-md"
                          : isPassed
                            ? "bg-clay text-white"
                            : "border-2 border-ink/20 bg-white text-ink-soft"
                      }`}
                    >
                      {isPassed && !isCurrent ? "✓" : idx + 1}
                    </div>
                    <span
                      className={`mt-2.5 text-xs font-medium ${
                        isCurrent ? "text-clay font-bold" : isPassed ? "text-ink" : "text-ink-soft"
                      }`}
                    >
                      {step.label}
                    </span>
                    <span className="text-[10px] text-ink-soft">{step.desc}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Version Mobile Stepper */}
          <div className="space-y-3 sm:hidden">
            {STEPS.map((step, idx) => {
              const isPassed = idx <= stepIndex;
              const isCurrent = idx === stepIndex;
              return (
                <div key={step.id} className="flex items-center gap-3">
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      isCurrent
                        ? "bg-clay text-white ring-2 ring-clay/30"
                        : isPassed
                          ? "bg-clay text-white"
                          : "border border-ink/20 bg-white text-ink-soft"
                    }`}
                  >
                    {isPassed && !isCurrent ? "✓" : idx + 1}
                  </div>
                  <div>
                    <p className={`text-xs font-medium ${isCurrent ? "text-clay font-bold" : "text-ink"}`}>
                      {step.label}
                    </p>
                    <p className="text-[11px] text-ink-soft">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-xl bg-red-50 p-4 text-xs text-red-700">
          Cette commande a été annulée. Contactez le service client pour plus d&apos;informations.
        </div>
      )}

      {/* Détails logistiques */}
      <div className="mt-8 grid gap-4 border-t border-ink/10 pt-6 sm:grid-cols-2 lg:grid-cols-4 text-xs">
        <div>
          <span className="text-eyebrow text-ink-soft block">Transporteur</span>
          <span className="font-semibold text-ink text-sm block mt-0.5">
            {tracking?.carrier || "DHL Express"}
          </span>
        </div>

        <div>
          <span className="text-eyebrow text-ink-soft block">Numéro de suivi</span>
          <div className="mt-0.5 flex items-center gap-2">
            <span className="font-mono text-xs font-medium text-ink">
              {tracking?.trackingNumber || "En attente"}
            </span>
            {tracking?.trackingUrl ? (
              <a
                href={tracking.trackingUrl}
                target="_blank"
                rel="noreferrer"
                className="text-clay underline underline-offset-2 hover:text-clay-dark"
              >
                Suivre ↗
              </a>
            ) : null}
          </div>
        </div>

        <div>
          <span className="text-eyebrow text-ink-soft block">Date estimée d&apos;arrivée</span>
          <span className="font-medium text-ink text-xs block mt-0.5">
            {eta ? eta.formatted : "En cours de calcul"}
          </span>
          {eta && currentStatus !== "delivered" && !isCancelled ? (
            <span className="text-[10px] text-clay block mt-0.5">
              {eta.diffDays > 1
                ? `Dans environ ${eta.diffDays} jours`
                : eta.diffDays === 1
                  ? "Livraison prévue demain"
                  : eta.diffDays === 0
                    ? "Livraison prévue aujourd'hui"
                    : "Livraison imminente"}
            </span>
          ) : null}
        </div>

        <div>
          <span className="text-eyebrow text-ink-soft block">Dernière mise à jour</span>
          <p className="text-xs text-ink mt-0.5">
            {tracking?.statusMessage || "Commande enregistrée avec succès."}
          </p>
          {tracking?.updatedAt ? (
            <span className="text-[10px] text-ink-soft block mt-0.5">
              {new Intl.DateTimeFormat("fr-FR", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              }).format(new Date(tracking.updatedAt))}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
