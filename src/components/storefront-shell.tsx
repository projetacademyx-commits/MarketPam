"use client";

import { usePathname } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CartDrawer } from "@/components/cart-drawer";

export function StorefrontShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) {
    return <main className="min-h-screen bg-slate-950 text-slate-100">{children}</main>;
  }

  return (
    <>
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
      <CartDrawer />
    </>
  );
}
