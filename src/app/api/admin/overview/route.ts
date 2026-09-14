import { NextResponse } from "next/server";
import { sql, desc, ne, eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, products, users, shipmentTracking } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();

    // 1. Chiffre d'affaires total et nombre de commandes
    const [salesRow] = await db
      .select({
        revenue: sql<number>`cast(coalesce(sum(${orders.total}), 0) as int)`,
        count: sql<number>`cast(count(*) as int)`,
      })
      .from(orders)
      .where(ne(orders.status, "cancelled"));

    // 2. Nombre total de clients
    const [customersRow] = await db
      .select({
        count: sql<number>`cast(count(*) as int)`,
      })
      .from(users)
      .where(eq(users.role, "customer"));

    // 3. Nombre total de produits et alertes stock
    const [productsRow] = await db
      .select({
        count: sql<number>`cast(count(*) as int)`,
      })
      .from(products);

    const lowStock = await db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        stock: products.stock,
        price: products.price,
      })
      .from(products)
      .where(sql`${products.stock} <= 10`)
      .limit(6);

    // 4. Commandes récentes
    const recentOrders = await db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(8);

    const orderNumbers = recentOrders.map((o) => o.orderNumber);
    let trackings: any[] = [];
    if (orderNumbers.length) {
      trackings = await db
        .select()
        .from(shipmentTracking)
        .where(sql`${shipmentTracking.orderNumber} IN ${orderNumbers}`);
    }

    const trackingMap = new Map(trackings.map((t) => [t.orderNumber, t]));

    const enrichedOrders = recentOrders.map((o) => ({
      ...o,
      tracking: trackingMap.get(o.orderNumber) || null,
    }));

    return NextResponse.json({
      revenue: salesRow?.revenue || 0,
      totalOrders: salesRow?.count || 0,
      totalCustomers: customersRow?.count || 0,
      totalProducts: productsRow?.count || 0,
      lowStock,
      recentOrders: enrichedOrders,
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Non connecté" }, { status: 401 });
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Accès administrateur requis" }, { status: 403 });
    }
    console.error("Erreur admin overview:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
