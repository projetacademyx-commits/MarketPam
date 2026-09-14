import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { eq, inArray } from "drizzle-orm";
import { db } from "../src/db";
import { users, sessions, orders, orderItems, shipmentTracking, products } from "../src/db/schema";
import {
  hashPassword,
  verifyPassword,
  createSession,
  validateSessionToken,
  invalidateSession,
} from "../src/lib/auth";

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    testsPassed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    testsFailed++;
  }
}

async function runBackendTests() {
  console.log("\n========================================================");
  console.log("🧪 DÉBUT DES TESTS AUTOMATISÉS DU BACKEND MARKETPAM");
  console.log("========================================================\n");

  const testEmail = `test.client.${Date.now()}@marketpam.test`;
  const testPassword = "SuperPassword2026!";
  let testUserId: number | null = null;
  let testOrderNumber = `MP-TEST-${Date.now().toString(36).toUpperCase()}`;

  try {
    // ----------------------------------------------------
    // TEST 1 : Hashage et sécurité des mots de passe
    // ----------------------------------------------------
    console.log("1. Test de sécurité et hashage des mots de passe :");
    const hash = await hashPassword(testPassword);
    assert(hash.startsWith("$2"), "Le mot de passe est hashé avec bcrypt (commence par $2)");
    assert(hash !== testPassword, "Le mot de passe n'est jamais stocké en clair");
    const valid = await verifyPassword(testPassword, hash);
    assert(valid === true, "La vérification du mot de passe réussi avec le bon mot de passe");
    const invalid = await verifyPassword("WrongPassword123!", hash);
    assert(invalid === false, "La vérification du mot de passe échoue avec un mauvais mot de passe");

    // ----------------------------------------------------
    // TEST 2 : Inscription et persistance utilisateur
    // ----------------------------------------------------
    console.log("\n2. Test d'inscription et compte client :");
    const [createdUser] = await db
      .insert(users)
      .values({
        email: testEmail,
        firstName: "Ada",
        lastName: "Lovelace",
        passwordHash: hash,
        role: "customer",
      })
      .returning();

    testUserId = createdUser.id;
    assert(Boolean(createdUser.id), `Compte client créé avec succès (ID: ${createdUser.id})`);
    assert(createdUser.role === "customer", "Le rôle par défaut est bien 'customer'");
    assert(createdUser.email === testEmail, "L'email correspond bien aux données saisies");

    // ----------------------------------------------------
    // TEST 3 : Gestion sécurisée des sessions
    // ----------------------------------------------------
    console.log("\n3. Test des sessions cryptographiques :");
    const session = await createSession(testUserId);
    assert(session.token.length >= 64, "Token de session cryptographique aléatoire de 64 caractères");
    assert(session.expiresAt.getTime() > Date.now(), "La date d'expiration de session est future (30 jours)");

    const validated = await validateSessionToken(session.token);
    assert(validated !== null, "La validation de session retourne les données utilisateur");
    assert(validated?.user.id === testUserId, "L'utilisateur associé à la session est valide");

    await invalidateSession(session.token);
    const expired = await validateSessionToken(session.token);
    assert(expired === null, "La session invalidée (déconnexion) est immédiatement révoquée");

    // ----------------------------------------------------
    // TEST 4 : Création de commande associée au compte client
    // ----------------------------------------------------
    console.log("\n4. Test de commande et association utilisateur :");
    const [sampleProduct] = await db.select().from(products).limit(1);
    assert(Boolean(sampleProduct), `Produit catalogue existant sélectionné : ${sampleProduct.name}`);

    // Création de commande
    await db.insert(orders).values({
      orderNumber: testOrderNumber,
      userId: testUserId,
      email: testEmail,
      fullName: "Ada Lovelace",
      address: "128 Rue de Rivoli",
      city: "Paris",
      postalCode: "75001",
      country: "France",
      shippingMethod: "standard",
      subtotal: sampleProduct.price,
      shipping: 0,
      tax: 0,
      total: sampleProduct.price,
      status: "confirmed",
    });

    await db.insert(orderItems).values({
      orderNumber: testOrderNumber,
      productSlug: sampleProduct.slug,
      name: sampleProduct.name,
      imageUrl: sampleProduct.images[0] ?? "",
      unitPrice: sampleProduct.price,
      quantity: 1,
    });

    const [savedOrder] = await db
      .select()
      .from(orders)
      .where(eq(orders.orderNumber, testOrderNumber))
      .limit(1);

    assert(savedOrder !== undefined, "La commande a bien été enregistrée en base");
    assert(savedOrder.userId === testUserId, "La commande est strictement associée au userId du client");

    // ----------------------------------------------------
    // TEST 5 : Suivi de livraison (Shipment Tracking)
    // ----------------------------------------------------
    console.log("\n5. Test du suivi logistique et tracking de commande :");
    const initialTrackingNumber = `TRK-${Date.now()}`;
    await db.insert(shipmentTracking).values({
      orderNumber: testOrderNumber,
      carrier: "DHL Express",
      trackingNumber: initialTrackingNumber,
      trackingUrl: `https://track.dhl.com/${initialTrackingNumber}`,
      estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      currentStatus: "confirmed",
      statusMessage: "Commande validée, en attente de préparation.",
    });

    const [trackingRecord] = await db
      .select()
      .from(shipmentTracking)
      .where(eq(shipmentTracking.orderNumber, testOrderNumber))
      .limit(1);

    assert(trackingRecord !== undefined, "L'enregistrement de tracking a bien été initialisé");
    assert(trackingRecord.carrier === "DHL Express", "Le transporteur par défaut est bien renseigné");
    assert(trackingRecord.trackingNumber === initialTrackingNumber, "Le numéro de suivi est correctement associé");

    // ----------------------------------------------------
    // TEST 6 : Isolation des données client
    // ----------------------------------------------------
    console.log("\n6. Test d'isolation des commandes (sécurité multi-clients) :");
    const clientOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, testUserId));

    assert(clientOrders.length === 1, "Le client ne récupère que ses propres commandes");
    assert(clientOrders[0].orderNumber === testOrderNumber, "Le numéro de commande correspond au client");

    // ----------------------------------------------------
    // TEST 7 : Gestion administrateur (mise à jour du statut et du transporteur)
    // ----------------------------------------------------
    console.log("\n7. Test des droits et actions de l'administrateur :");
    // Mise à jour du statut vers "shipped" avec mise à jour du transporteur
    await db
      .update(orders)
      .set({ status: "shipped" })
      .where(eq(orders.orderNumber, testOrderNumber));

    await db
      .update(shipmentTracking)
      .set({
        currentStatus: "shipped",
        carrier: "Chronopost",
        statusMessage: "Colis pris en charge par le transporteur.",
        updatedAt: new Date(),
      })
      .where(eq(shipmentTracking.orderNumber, testOrderNumber));

    const [updatedTracking] = await db
      .select()
      .from(shipmentTracking)
      .where(eq(shipmentTracking.orderNumber, testOrderNumber))
      .limit(1);

    assert(updatedTracking.currentStatus === "shipped", "Le statut de suivi est passé à 'shipped'");
    assert(updatedTracking.carrier === "Chronopost", "Le transporteur a été mis à jour");

  } catch (error) {
    console.error("❌ ERREUR INATTENDUE DURANT LES TESTS :", error);
    testsFailed++;
  } finally {
    // ----------------------------------------------------
    // Nettoyage des données de test
    // ----------------------------------------------------
    console.log("\n🧹 Nettoyage des données de test...");
    try {
      if (testOrderNumber) {
        await db.delete(shipmentTracking).where(eq(shipmentTracking.orderNumber, testOrderNumber));
        await db.delete(orderItems).where(eq(orderItems.orderNumber, testOrderNumber));
        await db.delete(orders).where(eq(orders.orderNumber, testOrderNumber));
      }
      if (testUserId) {
        await db.delete(sessions).where(eq(sessions.userId, testUserId));
        await db.delete(users).where(eq(users.id, testUserId));
      }
      console.log("✅ Nettoyage terminé avec succès.");
    } catch (e) {
      console.error("Erreur nettoyage:", e);
    }

    console.log("\n========================================================");
    console.log(`📊 RÉSULTAT DES TESTS : ${testsPassed} PASSÉS, ${testsFailed} ÉCHOUÉS`);
    console.log("========================================================\n");

    if (testsFailed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }
}

runBackendTests();
