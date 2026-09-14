import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { users } from "../src/db/schema";
import { hashPassword } from "../src/lib/auth";

async function seedAdmin() {
  const adminEmail = process.env.INITIAL_ADMIN_EMAIL || "admin@marketpam.com";
  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || "MarketPam2026!";
  const firstName = "Admin";
  const lastName = "MarketPam";

  console.log(`\n🌱 Initialisation de l'administrateur: ${adminEmail}...`);

  try {
    const [existing] = await db.select().from(users).where(eq(users.email, adminEmail)).limit(1);

    const passwordHash = await hashPassword(adminPassword);

    if (existing) {
      console.log(`L'administrateur existe déjà (id: ${existing.id}). Mise à jour du rôle et du mot de passe...`);
      await db
        .update(users)
        .set({
          role: "admin",
          passwordHash,
          updatedAt: new Date(),
        })
        .where(eq(users.id, existing.id));
      console.log(`✅ Administrateur mis à jour avec succès.`);
    } else {
      const [newAdmin] = await db
        .insert(users)
        .values({
          email: adminEmail,
          firstName,
          lastName,
          passwordHash,
          role: "admin",
        })
        .returning();
      console.log(`✅ Administrateur créé avec succès (id: ${newAdmin.id}).`);
    }

    console.log(`\n🔑 Identifiants d'accès admin :`);
    console.log(`   Email    : ${adminEmail}`);
    console.log(`   Password : ${adminPassword}`);
    console.log(`   Accès    : http://localhost:3000/admin\n`);
  } catch (error) {
    console.error("❌ Échec de création de l'administrateur:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

seedAdmin();
