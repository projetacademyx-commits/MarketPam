import { NextResponse } from "next/server";
import { desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { users, orders } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();

    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt));

    // Récupérer le nombre de commandes et total dépensé par utilisateur
    const stats = await db
      .select({
        userId: orders.userId,
        orderCount: sql<number>`cast(count(*) as int)`,
        totalSpent: sql<number>`cast(coalesce(sum(${orders.total}), 0) as int)`,
      })
      .from(orders)
      .where(sql`${orders.userId} IS NOT NULL`)
      .groupBy(orders.userId);

    const statsMap = new Map(stats.map((s) => [s.userId, s]));

    const result = allUsers.map((u) => {
      const s = statsMap.get(u.id);
      return {
        ...u,
        orderCount: s?.orderCount ?? 0,
        totalSpent: s?.totalSpent ?? 0,
      };
    });

    return NextResponse.json({ users: result });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Non connecté" }, { status: 401 });
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Accès administrateur requis" }, { status: 403 });
    }
    console.error("Erreur admin users:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
