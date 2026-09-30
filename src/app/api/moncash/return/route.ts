import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, shipmentTracking } from "@/db/schema";
import { getMonCashAmount, verifyMonCashPayment } from "@/lib/moncash";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const providerOrderId = url.searchParams.get("orderId");
  if (!providerOrderId || !/^\d{9,18}$/.test(providerOrderId)) {
    return NextResponse.redirect(new URL("/checkout?payment=unverified", url.origin));
  }

  const [order] = await db.select().from(orders).where(eq(orders.moncashOrderId, providerOrderId)).limit(1);
  if (!order) return NextResponse.redirect(new URL("/checkout?payment=unverified", url.origin));

  try {
    const payment = await verifyMonCashPayment(providerOrderId);
    const reportedAmount = payment.amount === undefined ? null : Number(payment.amount);
    const expectedAmount = getMonCashAmount(order.total);
    const amountMatches = reportedAmount === null || reportedAmount === expectedAmount;
    const orderMatches = payment.orderId === undefined || String(payment.orderId) === providerOrderId;
    const paid = payment.message?.toLowerCase() === "successful" && amountMatches && orderMatches;

    if (paid && order.paymentStatus !== "paid") {
      await db.update(orders)
        .set({ paymentStatus: "paid", status: "confirmed" })
        .where(eq(orders.orderNumber, order.orderNumber));
      await db.update(shipmentTracking)
        .set({ currentStatus: "confirmed", statusMessage: "Paiement MonCash confirmé. Commande en préparation." })
        .where(eq(shipmentTracking.orderNumber, order.orderNumber));
    } else if (order.paymentStatus !== "paid" && !paid && payment.message && payment.message.toLowerCase() !== "successful") {
      await db.update(orders)
        .set({ paymentStatus: "failed", status: "cancelled" })
        .where(eq(orders.orderNumber, order.orderNumber));
      await db.update(shipmentTracking)
        .set({ currentStatus: "cancelled", statusMessage: "Paiement MonCash non confirmé." })
        .where(eq(shipmentTracking.orderNumber, order.orderNumber));
    }

    return NextResponse.redirect(new URL(`/order/${order.orderNumber}`, url.origin));
  } catch (error) {
    console.error("Vérification retour MonCash échouée:", error);
    return NextResponse.redirect(new URL(`/order/${order.orderNumber}?payment=pending`, url.origin));
  }
}