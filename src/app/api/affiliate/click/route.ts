import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { affiliateProducts, affiliateClicks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, sessionId } = body;

    if (!productId || typeof productId !== "number") {
      return NextResponse.json({ error: "productId manquant" }, { status: 400 });
    }

    // Récupérer le produit affilié (avec l'URL secrète)
    const [product] = await db
      .select()
      .from(affiliateProducts)
      .where(eq(affiliateProducts.id, productId))
      .limit(1);

    if (!product || !product.isActive) {
      return NextResponse.json({ error: "Produit introuvable ou inactif" }, { status: 404 });
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

    // Enregistrer le clic en base
    await db.insert(affiliateClicks).values({
      productId: product.id,
      productName: product.name,
      priceShown: product.price,
      userId: user?.id ?? null,
      sessionId: sessionId ? String(sessionId).substring(0, 128) : null,
      ipAddress: ip.substring(0, 64),
      userAgent: userAgent.substring(0, 500),
      referrer: referrer.substring(0, 500),
    });

    // Incrémenter le compteur de clics
    await db
      .update(affiliateProducts)
      .set({ clickCount: product.clickCount + 1 })
      .where(eq(affiliateProducts.id, product.id));

    // Retourner l'URL de redirection (jamais exposée au client avant ce point)
    return NextResponse.json({ redirectUrl: product.affiliateUrl });
  } catch (err) {
    console.error("[affiliate/click] Error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
