import { NextResponse } from "next/server";
import { db } from "@/db";
import { reviews } from "@/db/schema";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const productSlug = String(body.productSlug ?? "").trim();
    const author = String(body.author ?? "").trim();
    const title = String(body.title ?? "").trim();
    const text = String(body.body ?? "").trim();
    const rating = Math.min(5, Math.max(1, Number(body.rating) || 5));

    if (!productSlug || !author || !title || !text) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const [created] = await db
      .insert(reviews)
      .values({
        productSlug,
        author: author.slice(0, 120),
        title: title.slice(0, 180),
        body: text.slice(0, 2000),
        rating,
        verified: false,
      })
      .returning();

    return NextResponse.json({ review: created }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not save review" }, { status: 500 });
  }
}
