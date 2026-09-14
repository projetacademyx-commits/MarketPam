import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, shipmentTracking } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

const STATUS_STEPS = ["confirmed", "processing", "shipped", "out_for_delivery", "delivered"] as const;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderNumber: string }> },
) {
  try {
    const { orderNumber } = await params;

    const [order] = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        userId: orders.userId,
        status: orders.status,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(eq(orders.orderNumber, orderNumber))
      .limit(1);

    if (!order) {
      return NextResponse.json({ error: "Commande non trouvée" }, { status: 404 });
    }

    const currentUser = await getCurrentUser();
    if (order.userId && (!currentUser || (currentUser.id !== order.userId && currentUser.role !== "admin"))) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const [tracking] = await db
      .select()
      .from(shipmentTracking)
      .where(eq(shipmentTracking.orderNumber, orderNumber))
      .limit(1);

    const activeStatus = tracking?.currentStatus || order.status || "confirmed";
    const stepIndex = activeStatus === "cancelled" ? -1 : STATUS_STEPS.indexOf(activeStatus as any);

    let remainingDays: number | null = null;
    let etaFormatted = "";
    if (tracking?.estimatedDelivery) {
      const diffMs = new Date(tracking.estimatedDelivery).getTime() - Date.now();
      remainingDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      etaFormatted = new Intl.DateTimeFormat("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(tracking.estimatedDelivery));
    }

    return NextResponse.json({
      orderNumber,
      carrier: tracking?.carrier || "DHL Express",
      trackingNumber: tracking?.trackingNumber || "",
      trackingUrl: tracking?.trackingUrl || "",
      estimatedDelivery: tracking?.estimatedDelivery || null,
      estimatedDeliveryFormatted: etaFormatted,
      remainingDays,
      status: activeStatus,
      statusMessage: tracking?.statusMessage || "Commande enregistrée.",
      lastUpdate: tracking?.updatedAt || order.createdAt,
      stepIndex: stepIndex >= 0 ? stepIndex : 0,
      steps: [
        { id: "confirmed", label: "Confirmée", description: "Votre commande est validée" },
        { id: "processing", label: "Préparée", description: "En cours de préparation dans l'entrepôt" },
        { id: "shipped", label: "Expédiée", description: "Colis confié au transporteur" },
        { id: "out_for_delivery", label: "En livraison", description: "En cours d'acheminement vers votre adresse" },
        { id: "delivered", label: "Livrée", description: "Colis remis au destinataire" },
      ],
    });
  } catch (error) {
    console.error("Erreur tracking:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
