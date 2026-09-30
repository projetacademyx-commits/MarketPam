import { randomInt } from "node:crypto";
import { NextResponse } from "next/server";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { cartItems, orderItems, orders, products, shipmentTracking } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { computeTotals } from "@/lib/format";
import { createOrderSchema } from "@/lib/validations";
import { createMonCashPayment, getMonCashAmount } from "@/lib/moncash";

function generateOrderNumber() {
  const stamp = Date.now().toString(36).toUpperCase().slice(-5);
  const rand = Math.random().toString(36).toUpperCase().slice(2, 5);
  return `MP-${stamp}${rand}`;
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Vous devez être connecté pour commander." }, { status: 401 });
    }

    const parsed = createOrderSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Commande invalide." }, { status: 400 });
    }

    const { items, shippingMethod, address, city, postalCode, country, fullName } = parsed.data;
    const slugs = [...new Set(items.map((item) => item.slug))];
    const catalogue = await db.select().from(products).where(inArray(products.slug, slugs));
    const bySlug = new Map(catalogue.map((product) => [product.slug, product]));
    const resolved = items
      .map((item) => {
        const product = bySlug.get(item.slug);
        if (!product) return null;
        const quantity = Math.max(1, Math.min(99, item.quantity));
        return { product, quantity, variant: item.variant };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));

    if (resolved.length !== items.length) {
      return NextResponse.json({ error: "Un ou plusieurs produits ne sont plus disponibles." }, { status: 400 });
    }

    const subtotal = resolved.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const { shipping, tax, total } = computeTotals(subtotal, shippingMethod);
    const orderNumber = generateOrderNumber();
    const moncashOrderId = String(randomInt(1_000_000_000, 2_000_000_000));
    const paymentAmount = getMonCashAmount(total);

    await db.insert(orders).values({
      orderNumber,
      moncashOrderId,
      userId: user.id,
      email: user.email,
      fullName: fullName.slice(0, 180),
      address: address.slice(0, 400),
      city: city.slice(0, 120),
      postalCode: postalCode.slice(0, 40),
      country: country.slice(0, 120),
      shippingMethod,
      paymentMethod: "moncash",
      paymentStatus: "pending",
      subtotal,
      shipping,
      tax,
      total,
      status: "pending_payment",
    });

    await db.insert(orderItems).values(
      resolved.map(({ product, quantity, variant }) => ({
        orderNumber,
        productSlug: product.slug,
        name: variant ? `${product.name} — ${variant}` : product.name,
        imageUrl: product.images[0] ?? "",
        unitPrice: product.price,
        quantity,
      })),
    );

    const deliveryDays = shippingMethod === "overnight" ? 1 : shippingMethod === "express" ? 2 : 4;
    const estimatedDelivery = new Date(Date.now() + deliveryDays * 24 * 60 * 60 * 1000);
    const trackingNumber = `TRK-${Date.now().toString().slice(-7)}`;
    await db.insert(shipmentTracking).values({
      orderNumber,
      carrier: shippingMethod === "overnight" ? "DHL Express" : "Chronopost",
      trackingNumber,
      trackingUrl: `https://track.marketpam.com/${trackingNumber}`,
      estimatedDelivery,
      currentStatus: "pending_payment",
      statusMessage: "En attente de confirmation du paiement MonCash.",
    });

    try {
      const redirectUrl = await createMonCashPayment(moncashOrderId, paymentAmount);
      await db.delete(cartItems).where(eq(cartItems.userId, user.id));
      return NextResponse.json({ redirectUrl, orderNumber }, { status: 201 });
    } catch (error) {
      await db.update(orders)
        .set({ paymentStatus: "failed", status: "cancelled" })
        .where(eq(orders.orderNumber, orderNumber));
      throw error;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Impossible d'initialiser le paiement MonCash.";
    const status = message.includes("pas configuré") || message.includes("MONCASH_USD_TO_HTG_RATE") ? 503 : 500;
    console.error("Erreur initialisation paiement MonCash:", message);
    return NextResponse.json({ error: message }, { status });
  }
}