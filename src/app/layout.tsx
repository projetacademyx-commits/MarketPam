import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";
import { CartProvider } from "@/components/cart-provider";
import { StorefrontShell } from "@/components/storefront-shell";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MarketPam — Goods worth keeping",
  description:
    "A curated marketplace for apparel, home objects, sound, skincare, coffee and carry goods. Buy from independent makers or start selling your own.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={`${inter.variable} ${playfair.variable}`}>
      <body className="min-h-screen bg-cream text-ink antialiased">
        <AuthProvider>
          <CartProvider>
            <StorefrontShell>{children}</StorefrontShell>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
