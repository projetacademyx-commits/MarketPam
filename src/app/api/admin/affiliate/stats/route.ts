import { NextResponse } from "next/server";
import { db } from "@/db";
import { affiliateProducts, affiliateClicks } from "@/db/schema";
import { count, sum, eq, desc, sql } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/affiliate/stats
export async function GET() {
  try {
    await requireAdmin();

    const [totals] = await db
      .select({
        totalProducts: count(affiliateProducts.id),
        totalClicks: sum(affiliateProducts.clickCount),
      })
      .from(affiliateProducts);

    const topProducts = await db
      .select({
        id: affiliateProducts.id,
        name: affiliateProducts.name,
        clickCount: affiliateProducts.clickCount,
        price: affiliateProducts.price,
        affiliateSource: affiliateProducts.affiliateSource,
      })
      .from(affiliateProducts)
      .where(eq(affiliateProducts.isActive, true))
      .orderBy(desc(affiliateProducts.clickCount))
      .limit(5);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentClicks = await db
      .select()
      .from(affiliateClicks)
      .where(sql`${affiliateClicks.clickedAt} >= ${sevenDaysAgo}`)
      .orderBy(desc(affiliateClicks.clickedAt))
      .limit(50);

    return NextResponse.json({
      totalProducts: Number(totals.totalProducts) || 0,
      totalClicks: Number(totals.totalClicks) || 0,
      topProducts,
      recentClicks,
    });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED")
      return NextResponse.json({ error: "Non connecté" }, { status: 401 });
    if (err.message === "FORBIDDEN")
      return NextResponse.json({ error: "Accès administrateur requis" }, { status: 403 });
    console.error("[admin/affiliate/stats] Error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
