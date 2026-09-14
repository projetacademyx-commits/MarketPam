import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, shipmentTracking } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { updateAdminOrderSchema } from "@/lib/validations";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ orderNumber: string }> },
) {
  try {
    await requireAdmin();

    const { orderNumber } = await params;
    const body = await request.json();
    const parsed = updateAdminOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Données invalides" },
        { status: 400 },
      );
    }

    const { status, carrier, trackingNumber, trackingUrl, estimatedDelivery, statusMessage } =
      parsed.data;

    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.orderNumber, orderNumber))
      .limit(1);

    if (!order) {
      return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
    }

    // 1. Mettre à jour le statut dans la table orders si fourni
    if (status) {
      await db
        .update(orders)
        .set({ status })
        .where(eq(orders.orderNumber, orderNumber));
    }

    // 2. Mettre à jour ou insérer dans shipmentTracking
    const [existingTracking] = await db
      .select()
      .from(shipmentTracking)
      .where(eq(shipmentTracking.orderNumber, orderNumber))
      .limit(1);

    const etaDate = estimatedDelivery ? new Date(estimatedDelivery) : undefined;

    if (existingTracking) {
      await db
        .update(shipmentTracking)
        .set({
          currentStatus: status ?? existingTracking.currentStatus,
          carrier: carrier ?? existingTracking.carrier,
          trackingNumber: trackingNumber ?? existingTracking.trackingNumber,
          trackingUrl: trackingUrl ?? existingTracking.trackingUrl,
          estimatedDelivery: etaDate ?? existingTracking.estimatedDelivery,
          statusMessage: statusMessage ?? existingTracking.statusMessage,
          updatedAt: new Date(),
        })
        .where(eq(shipmentTracking.orderNumber, orderNumber));
    } else {
      await db.insert(shipmentTracking).values({
        orderNumber,
        currentStatus: status || "confirmed",
        carrier: carrier || "DHL Express",
        trackingNumber: trackingNumber || "",
        trackingUrl: trackingUrl || "",
        estimatedDelivery: etaDate,
        statusMessage: statusMessage || "Statut mis à jour par l'administrateur.",
      });
    }

    return NextResponse.json({ success: true, message: "Commande mise à jour avec succès" });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Non connecté" }, { status: 401 });
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Accès administrateur requis" }, { status: 403 });
    }
    console.error("Erreur mise à jour commande admin:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
