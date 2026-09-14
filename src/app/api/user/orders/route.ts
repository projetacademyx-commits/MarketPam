import { NextResponse } from "next/server";
import { eq, desc, inArray } from "drizzle-orm";
import { db } from "@/db";
import { orderItems, orders, shipmentTracking } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // Récupérer les commandes de l'utilisateur
  const userOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, user.id))
    .orderBy(desc(orders.createdAt));

  if (!userOrders.length) {
    return NextResponse.json({ orders: [] });
  }

  const orderNumbers = userOrders.map((o) => o.orderNumber);

  // Récupérer les items associés
  const items = await db
    .select()
    .from(orderItems)
    .where(inArray(orderItems.orderNumber, orderNumbers));

  // Récupérer les suivis de livraison associés
  const trackings = await db
    .select()
    .from(shipmentTracking)
    .where(inArray(shipmentTracking.orderNumber, orderNumbers));

  const itemsByOrder = new Map<string, typeof items>();
  for (const item of items) {
    const list = itemsByOrder.get(item.orderNumber) || [];
    list.push(item);
    itemsByOrder.set(item.orderNumber, list);
  }

  const trackingByOrder = new Map(trackings.map((t) => [t.orderNumber, t]));

  const enriched = userOrders.map((order) => ({
    ...order,
    items: itemsByOrder.get(order.orderNumber) || [],
    tracking: trackingByOrder.get(order.orderNumber) || null,
  }));

  return NextResponse.json({ orders: enriched });
}
