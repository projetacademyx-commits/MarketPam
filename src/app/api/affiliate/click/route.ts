import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { affiliateProducts, affiliateClicks, products } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, slug, sessionId } = body;

    let targetUrl: string | null = null;
    let prodName = "";
    let prodPrice = 0;
    let pId = 0;

    if (productId && typeof productId === "number") {
      const [product] = await db
        .select()
        .from(affiliateProducts)
        .where(eq(affiliateProducts.id, productId))
        .limit(1);

      if (product && product.isActive) {
        targetUrl = product.affiliateUrl;
        prodName = product.name;
        prodPrice = product.price;
        pId = product.id;
      }
    } else if (slug && typeof slug === "string") {
      // Rechercher dans les produits du catalogue
      const [prod] = await db
        .select()
        .from(products)
        .where(eq(products.slug, slug))
        .limit(1);

      if (prod && prod.affiliateUrl) {
        targetUrl = prod.affiliateUrl;
        prodName = prod.name;
        prodPrice = prod.price;
        pId = prod.id;
      }
    }

    if (!targetUrl) {
      return NextResponse.json({ error: "Lien affilié introuvable pour ce produit" }, { status: 404 });
    }

    // Identifier l'utilisateur connecté (optionnel)
    const user = await getCurrentUser();

    // Extraire l'IP depuis les headers
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded
      ? forwarded.split(",")[0].trim()
      : (req.headers.get("x-real-ip") ?? "unknown");
    const userAgent = req.headers.get("user-agent") ?? "";
    const referrer = req.headers.get("referer") ?? "";

    // Enregistrer le clic si pId est valide
    try {
      if (pId > 0 && productId) {
        await db.insert(affiliateClicks).values({
          productId: pId,
          productName: prodName,
          priceShown: prodPrice,
          userId: user?.id ?? null,
          sessionId: sessionId ? String(sessionId).substring(0, 128) : null,
          ipAddress: ip.substring(0, 64),
          userAgent: userAgent.substring(0, 500),
          referrer: referrer.substring(0, 500),
        });
      }
    } catch {}

    return NextResponse.json({ redirectUrl: targetUrl });
  } catch (err) {
    console.error("[affiliate/click] Error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
