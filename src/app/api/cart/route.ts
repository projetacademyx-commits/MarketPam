import { NextResponse } from "next/server";
import { eq, and, inArray } from "drizzle-orm";
import { db } from "@/db";
import { cartItems, products } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ items: [] });
  }

  const items = await db.select().from(cartItems).where(eq(cartItems.userId, user.id));

  if (!items.length) {
    return NextResponse.json({ items: [] });
  }

  const slugs = items.map((i) => i.productSlug);
  const prodList = await db.select().from(products).where(inArray(products.slug, slugs));
  const prodMap = new Map(prodList.map((p) => [p.slug, p]));

  const populated = items
    .map((item) => {
      const prod = prodMap.get(item.productSlug);
      if (!prod) return null;
      return {
        id: item.id,
        slug: prod.slug,
        name: prod.name,
        brand: prod.brand,
        price: prod.price,
        image: prod.images[0] ?? "",
        variant: item.variant || undefined,
        quantity: item.quantity,
      };
    })
    .filter(Boolean);

  return NextResponse.json({ items: populated });
}

// Synchroniser ou ajouter au panier
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Connexion requise pour gérer le panier" }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Mode synchronisation multiple (ex: lors de la connexion)
    if (Array.isArray(body.items)) {
      for (const item of body.items) {
        if (!item.slug || !item.quantity) continue;
        const [existing] = await db
          .select()
          .from(cartItems)
          .where(
            and(
              eq(cartItems.userId, user.id),
              eq(cartItems.productSlug, item.slug),
              item.variant ? eq(cartItems.variant, item.variant) : undefined,
            ),
          )
          .limit(1);

        if (existing) {
          await db
            .update(cartItems)
            .set({
              quantity: Math.max(1, Math.min(99, item.quantity)),
              updatedAt: new Date(),
            })
            .where(eq(cartItems.id, existing.id));
        } else {
          await db.insert(cartItems).values({
            userId: user.id,
            productSlug: item.slug,
            variant: item.variant || null,
            quantity: Math.max(1, Math.min(99, item.quantity)),
          });
        }
      }
      return NextResponse.json({ success: true });
    }

    // Mode ajout unitaire
    const { slug, quantity = 1, variant } = body;
    if (!slug) {
      return NextResponse.json({ error: "Slug du produit obligatoire" }, { status: 400 });
    }

    const [existing] = await db
      .select()
      .from(cartItems)
      .where(
        and(
          eq(cartItems.userId, user.id),
          eq(cartItems.productSlug, slug),
          variant ? eq(cartItems.variant, variant) : undefined,
        ),
      )
      .limit(1);

    if (existing) {
      await db
        .update(cartItems)
        .set({
          quantity: Math.min(99, existing.quantity + quantity),
          updatedAt: new Date(),
        })
        .where(eq(cartItems.id, existing.id));
    } else {
      await db.insert(cartItems).values({
        userId: user.id,
        productSlug: slug,
        variant: variant || null,
        quantity: Math.max(1, Math.min(99, quantity)),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur panier:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// Supprimer un élément ou vider le panier
export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const variant = searchParams.get("variant");
    const clearAll = searchParams.get("all") === "true";

    if (clearAll) {
      await db.delete(cartItems).where(eq(cartItems.userId, user.id));
      return NextResponse.json({ success: true });
    }

    if (slug) {
      await db
        .delete(cartItems)
        .where(
          and(
            eq(cartItems.userId, user.id),
            eq(cartItems.productSlug, slug),
            variant ? eq(cartItems.variant, variant) : undefined,
          ),
        );
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
  } catch (error) {
    console.error("Erreur suppression panier:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
