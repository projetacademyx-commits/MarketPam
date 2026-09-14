import { NextResponse } from "next/server";
import { desc, eq, and, or, ilike, inArray } from "drizzle-orm";
import { db } from "@/db";
import { orders, orderItems, shipmentTracking, users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const q = searchParams.get("q");

    const conditions = [];
    if (status && status !== "all") {
      conditions.push(eq(orders.status, status));
    }
    if (q) {
      const term = `%${q}%`;
      conditions.push(
        or(
          ilike(orders.orderNumber, term),
          ilike(orders.email, term),
          ilike(orders.fullName, term),
          ilike(orders.city, term),
        ),
      );
    }

    const allOrders = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        userId: orders.userId,
        email: orders.email,
        fullName: orders.fullName,
        address: orders.address,
        city: orders.city,
        postalCode: orders.postalCode,
        country: orders.country,
        shippingMethod: orders.shippingMethod,
        subtotal: orders.subtotal,
        shipping: orders.shipping,
        tax: orders.tax,
        total: orders.total,
        status: orders.status,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(orders.createdAt));

    if (!allOrders.length) {
      return NextResponse.json({ orders: [] });
    }

    const orderNumbers = allOrders.map((o) => o.orderNumber);

    const items = await db
      .select()
      .from(orderItems)
      .where(inArray(orderItems.orderNumber, orderNumbers));

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

    const enriched = allOrders.map((o) => ({
      ...o,
      items: itemsByOrder.get(o.orderNumber) || [],
      tracking: trackingByOrder.get(o.orderNumber) || null,
    }));

    return NextResponse.json({ orders: enriched });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Non connecté" }, { status: 401 });
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Accès administrateur requis" }, { status: 403 });
    }
    console.error("Erreur admin orders:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
