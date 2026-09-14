import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orderItems, orders, shipmentTracking } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderNumber: string }> },
) {
  try {
    const { orderNumber } = await params;
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.orderNumber, orderNumber))
      .limit(1);

    if (!order) {
      return NextResponse.json({ error: "Commande non trouvée" }, { status: 404 });
    }

    const currentUser = await getCurrentUser();

    // Vérification des droits : l'utilisateur doit être le propriétaire de la commande ou un administrateur
    if (order.userId) {
      if (!currentUser || (currentUser.id !== order.userId && currentUser.role !== "admin")) {
        return NextResponse.json({ error: "Accès non autorisé à cette commande" }, { status: 403 });
      }
    }

    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderNumber, orderNumber));

    const [tracking] = await db
      .select()
      .from(shipmentTracking)
      .where(eq(shipmentTracking.orderNumber, orderNumber))
      .limit(1);

    return NextResponse.json({
      order,
      items,
      tracking: tracking ?? null,
    });
  } catch (error) {
    console.error("Erreur commande:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
