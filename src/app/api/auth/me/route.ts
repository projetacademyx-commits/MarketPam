import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { addresses } from "@/db/schema";
import { getCurrentUser, safeUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const [defaultAddress] = await db
      .select()
      .from(addresses)
      .where(and(eq(addresses.userId, user.id), eq(addresses.isDefault, true)))
      .limit(1);

    return NextResponse.json(
      {
        user: safeUser(user),
        defaultAddress: defaultAddress ?? null,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Erreur récupération utilisateur:", error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
