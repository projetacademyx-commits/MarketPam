import Link from "next/link";
import { notFound } from "next/navigation";
import { Img } from "@/components/ui";
import { SHIPPING_OPTIONS, formatPrice } from "@/lib/format";
import { getOrder } from "@/lib/queries";
import { OrderTracker } from "@/components/order-tracker";

export const dynamic = "force-dynamic";

export default async function OrderPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const result = await getOrder(orderNumber);
  if (!result) notFound();

  const { order, items, tracking } = result;
  const method =
    SHIPPING_OPTIONS.find((o) => o.id === order.shippingMethod) ?? SHIPPING_OPTIONS[0];

  return (
    <div className="mx-auto max-w-4xl px-5 py-14 lg:px-8 space-y-8">
      <div className="animate-fade-up rounded-3xl border border-ink/10 bg-white/70 p-8 lg:p-12">
        <div className={`flex h-14 w-14 items-center justify-center rounded-full text-2xl text-white ${order.paymentStatus === "paid" || order.paymentStatus === "due_on_delivery" ? "bg-clay" : "bg-amber-500"}`}>
          {order.paymentStatus === "paid" || order.paymentStatus === "due_on_delivery" ? "✓" : "…"}
        </div>
        <p className="text-eyebrow mt-6 text-clay">
          {order.paymentStatus === "paid"
            ? "Paiement MonCash confirmé"
            : order.paymentStatus === "due_on_delivery"
              ? "Commande confirmée — paiement à la livraison"
              : order.paymentStatus === "failed"
                ? "Paiement MonCash non confirmé"
                : "Commande enregistrée — paiement en attente"}
        </p>
        <h1 className="font-display mt-3 text-4xl leading-tight lg:text-5xl">
          Merci pour votre confiance, {order.fullName.split(" ")[0]}.
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-ink-soft">
          Votre commande <span className="font-mono font-semibold text-ink">{order.orderNumber}</span> est
          {order.paymentStatus === "paid" || order.paymentStatus === "due_on_delivery"
            ? ` confirmée. Un e-mail récapitulatif a été envoyé à l'adresse ${order.email}.`
            : " enregistrée. Sa confirmation dépend de la validation du paiement MonCash."}
        </p>

        {/* Barre de progression et suivi de livraison en direct */}
        <div className="mt-8">
          <OrderTracker
            orderNumber={order.orderNumber}
            status={order.status}
            tracking={tracking}
          />
        </div>

        <ul className="mt-10 space-y-5 border-t border-ink/10 pt-8">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-4">
              <div className="h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-sand border border-ink/10">
                <Img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <Link href={`/product/${item.productSlug}`} className="font-display text-base hover:text-clay">
                  {item.name}
                </Link>
                <p className="text-xs text-ink-soft">Quantité : {item.quantity}</p>
              </div>
              <p className="text-sm font-semibold">{formatPrice(item.unitPrice * item.quantity)}</p>
            </li>
          ))}
        </ul>

        <dl className="mt-8 space-y-2 border-t border-ink/10 pt-6 text-sm">
          <div className="flex justify-between text-ink-soft">
            <dt>Sous-total</dt>
            <dd className="text-ink">{formatPrice(order.subtotal)}</dd>
          </div>
          <div className="flex justify-between text-ink-soft">
            <dt>Livraison</dt>
            <dd className="text-ink">{order.shipping === 0 ? "Offerte" : formatPrice(order.shipping)}</dd>
          </div>
          <div className="flex justify-between text-ink-soft">
            <dt>Taxes</dt>
            <dd className="text-ink">{formatPrice(order.tax)}</dd>
          </div>
          <div className="flex justify-between border-t border-ink/10 pt-3">
            <dt className="font-display text-lg">{order.paymentStatus === "paid" ? "Total payé" : "Total de la commande"}</dt>
            <dd className="font-display text-lg">{formatPrice(order.total)}</dd>
          </div>
        </dl>

        <div className="mt-8 rounded-xl bg-sand/70 p-5 text-sm text-ink-soft">
          <p className="text-ink font-semibold">Adresse de destination</p>
          <p className="mt-1">
            {order.fullName}, {order.address}, {order.city} {order.postalCode}, {order.country}
          </p>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/account"
            className="rounded-full bg-ink px-7 py-3.5 text-eyebrow text-cream transition hover:bg-clay"
          >
            Accéder à mon espace client
          </Link>
          <Link
            href="/shop"
            className="rounded-full border border-ink/20 px-7 py-3.5 text-eyebrow transition hover:bg-sand"
          >
            Continuer mes achats
          </Link>
        </div>
      </div>
    </div>
  );
}
