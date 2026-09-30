import { NextResponse } from "next/server";
import { inArray, eq } from "drizzle-orm";
import { db } from "@/db";
import { cartItems, orderItems, orders, products, shipmentTracking } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { computeTotals } from "@/lib/format";
import { createOrderSchema } from "@/lib/validations";

function generateOrderNumber() {
  const stamp = Date.now().toString(36).toUpperCase().slice(-5);
  const rand = Math.random().toString(36).toUpperCase().slice(2, 5);
  return `MP-${stamp}${rand}`;
}

export async function POST(request: Request) {
  try {
    // 1. Obligation formelle d'être connecté
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Vous devez être connecté à votre compte pour passer une commande." },
        { status: 401 },
      );
    }

    const body = await request.json();
    const parsed = createOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Données de commande invalides" },
        { status: 400 },
      );
    }

    if (parsed.data.paymentMethod !== "cod") {
      return NextResponse.json(
        { error: "Utilisez le parcours de paiement sécurisé MonCash." },
        { status: 400 },
      );
    }

    const {
      items,
      shippingMethod,
      paymentMethod = "card",
      cardBrand,
      latitude,
      longitude,
      locationAccuracy,
      address,
      city,
      postalCode,
      country,
      fullName,
    } = parsed.data;

    // 2. Vérification et calcul des prix sur les produits réels en base
    const slugs = [...new Set(items.map((i) => i.slug))];
    const catalogue = await db.select().from(products).where(inArray(products.slug, slugs));
    const bySlug = new Map(catalogue.map((p) => [p.slug, p]));

    const resolved = items
      .map((item) => {
        const product = bySlug.get(item.slug);
        if (!product) return null;
        const quantity = Math.max(1, Math.min(99, item.quantity));
        return {
          product,
          quantity,
          variant: item.variant,
          lineTotal: product.price * quantity,
        };
      })
      .filter((v): v is NonNullable<typeof v> => Boolean(v));

    if (!resolved.length) {
      return NextResponse.json(
        { error: "Aucun produit valide trouvé dans votre panier." },
        { status: 400 },
      );
    }

    const subtotal = resolved.reduce((sum, r) => sum + r.lineTotal, 0);
    const { shipping, tax, total } = computeTotals(subtotal, shippingMethod);
    const number = generateOrderNumber();

    // 3. Insertion de la commande reliée à l'utilisateur connecté
    await db.insert(orders).values({
      orderNumber: number,
      userId: user.id,
      email: user.email, // garanti d'être l'email du compte connecté
      fullName: fullName.slice(0, 180),
      address: address.slice(0, 400),
      city: city.slice(0, 120),
      postalCode: postalCode.slice(0, 40),
      country: country.slice(0, 120),
      shippingMethod,
      paymentMethod,
      paymentStatus: "due_on_delivery",
      cardBrand: cardBrand || null,
      latitude: latitude || null,
      longitude: longitude || null,
      locationAccuracy: locationAccuracy || null,
      subtotal,
      shipping,
      tax,
      total,
      status: "confirmed",
    });

    // 4. Insertion des articles de la commande
    await db.insert(orderItems).values(
      resolved.map((r) => ({
        orderNumber: number,
        productSlug: r.product.slug,
        name: r.variant ? `${r.product.name} — ${r.variant}` : r.product.name,
        imageUrl: r.product.images[0] ?? "",
        unitPrice: r.product.price,
        quantity: r.quantity,
      })),
    );

    // 5. Initialisation du suivi de livraison (shipment_tracking)
    const deliveryDays = shippingMethod === "overnight" ? 1 : shippingMethod === "express" ? 2 : 4;
    const estimatedDelivery = new Date(Date.now() + deliveryDays * 24 * 60 * 60 * 1000);
    const defaultCarrier = shippingMethod === "overnight" ? "DHL Express" : "Chronopost";
    const initialTrackingNumber = `TRK-${Date.now().toString().slice(-7)}`;

    await db.insert(shipmentTracking).values({
      orderNumber: number,
      carrier: defaultCarrier,
      trackingNumber: initialTrackingNumber,
      trackingUrl: `https://track.marketpam.com/${initialTrackingNumber}`,
      estimatedDelivery,
      currentStatus: "confirmed",
      statusMessage: "Commande validée, en attente de préparation dans notre entrepôt.",
    });

    // 6. Nettoyage du panier sauvegardé en base
    await db.delete(cartItems).where(eq(cartItems.userId, user.id));

    return NextResponse.json({ orderNumber: number, total }, { status: 201 });
  } catch (error) {
    console.error("Erreur création commande:", error);
    return NextResponse.json(
      { error: "Impossible de finaliser votre commande. Veuillez réessayer." },
      { status: 500 },
    );
  }
}
