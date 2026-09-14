import { NextResponse } from "next/server";
import { db } from "@/db";
import { sellerListings } from "@/db/schema";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const sellerName = String(body.sellerName ?? "").trim();
    const email = String(body.email ?? "").trim();
    const title = String(body.title ?? "").trim();

    if (!sellerName || !email || !title) {
      return NextResponse.json({ error: "Name, email and product title are required" }, { status: 400 });
    }

    const price = Math.max(0, Math.round(Number(body.askingPrice) * 100) || 0);

    const [created] = await db
      .insert(sellerListings)
      .values({
        sellerName: sellerName.slice(0, 160),
        email: email.slice(0, 180),
        title: title.slice(0, 180),
        categorySlug: String(body.categorySlug ?? "home").slice(0, 96),
        condition: String(body.condition ?? "like-new").slice(0, 40),
        askingPrice: price,
        description: String(body.description ?? "").slice(0, 2000),
        status: "in-review",
      })
      .returning();

    return NextResponse.json({ listing: created }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not submit listing" }, { status: 500 });
  }
}
