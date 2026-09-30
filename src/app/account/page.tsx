"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { OrderTracker, type TrackingData } from "@/components/order-tracker";
import { formatPrice } from "@/lib/format";
import { Img } from "@/components/ui";
import type { Address } from "@/db/schema";

type OrderItem = {
  id: number;
  orderNumber: string;
  productSlug: string;
  name: string;
  imageUrl: string;
  unitPrice: number;
  quantity: number;
};

type OrderData = {
  id: number;
  orderNumber: string;
  fullName: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  shippingMethod: string;
  paymentMethod?: string | null;
  cardBrand?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  locationAccuracy?: string | null;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
  tracking?: TrackingData | null;
};

function AccountContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "orders";

  const { user, loading: authLoading, logout, refreshUser } = useAuth();
  const [tab, setTab] = useState(initialTab);

  // Données des commandes
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [receiptOrder, setReceiptOrder] = useState<OrderData | null>(null);

  // Données profil
  const [profileForm, setProfileForm] = useState({ firstName: "", lastName: "", email: "" });
  const [profileMsg, setProfileMsg] = useState("");
  const [profileError, setProfileError] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Données sécurité
  const [passForm, setPassForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [passMsg, setPassMsg] = useState("");
  const [passError, setPassError] = useState("");
  const [savingPass, setSavingPass] = useState(false);

  // Données adresses
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [newAddr, setNewAddr] = useState({
    fullName: "",
    street: "",
    city: "",
    postalCode: "",
    country: "France",
    phone: "",
    isDefault: false,
  });
  const [showAddAddr, setShowAddAddr] = useState(false);
  const [addrMsg, setAddrMsg] = useState("");

  // Redirection si non connecté
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/account");
    }
  }, [authLoading, user, router]);

  // Initialisation formulaire profil
  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      });
    }
  }, [user]);

  // Chargement des commandes
  useEffect(() => {
    if (user) {
      setLoadingOrders(true);
      fetch("/api/user/orders")
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data.orders)) {
            setOrders(data.orders);
            if (data.orders.length > 0 && !selectedOrder) {
              setSelectedOrder(data.orders[0]);
            }
          }
        })
        .catch(() => {})
        .finally(() => setLoadingOrders(false));

      fetch("/api/user/addresses")
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data.addresses)) {
            setAddresses(data.addresses);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg("");
    setProfileError("");

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur de mise à jour");
      await refreshUser();
      setProfileMsg("Informations personnelles mises à jour avec succès.");
    } catch (err: any) {
      setProfileError(err.message || "Erreur serveur");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passForm.newPassword !== passForm.confirm) {
      setPassError("Les nouveaux mots de passe ne correspondent pas.");
      return;
    }
    setSavingPass(true);
    setPassMsg("");
    setPassError("");

    try {
      const res = await fetch("/api/user/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passForm.currentPassword,
          newPassword: passForm.newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur de mot de passe");
      setPassMsg("Votre mot de passe a été modifié avec succès.");
      setPassForm({ currentPassword: "", newPassword: "", confirm: "" });
    } catch (err: any) {
      setPassError(err.message || "Erreur serveur");
    } finally {
      setSavingPass(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/user/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAddr),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur adresse");
      setAddresses((prev) => [data.address, ...prev]);
      setShowAddAddr(false);
      setNewAddr({ fullName: "", street: "", city: "", postalCode: "", country: "France", phone: "", isDefault: false });
      setAddrMsg("Adresse ajoutée avec succès.");
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteAddress = async (id: number) => {
    if (!confirm("Voulez-vous vraiment supprimer cette adresse ?")) return;
    try {
      await fetch(`/api/user/addresses/${id}`, { method: "DELETE" });
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    } catch {}
  };

  if (authLoading || !user) {
    return (
      <div className="mx-auto max-w-4xl px-5 py-24 text-center text-sm text-ink-soft">
        Chargement de votre compte...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 lg:px-8 lg:py-14">
      {/* Bannière de séparation Espace Admin pour les administrateurs */}
      {user.role === "admin" ? (
        <div className="mb-8 rounded-2xl border border-amber-500/30 bg-slate-900 p-6 text-white shadow-xl animate-fade-in">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="rounded bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                  Session Administrateur
                </span>
                <span className="text-xs text-slate-400">· Interface Client</span>
              </div>
              <h2 className="font-display text-xl text-white">
                Votre console d&apos;administration dédiée est séparée de cette page.
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Toutes vos opérations (commandes, expéditions, catalogue, stocks, clients, rôles, profil et sécurité) sont centralisées sur votre console backoffice.
              </p>
            </div>
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 text-xs font-bold text-slate-950 shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-orange-400 transition"
            >
              <span>Accéder à la Console Admin</span>
              <span>⚙ →</span>
            </Link>
          </div>
        </div>
      ) : null}

      {/* En-tête Espace Client */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink/10 pb-8">
        <div>
          <span className="text-eyebrow text-clay">
            {user.role === "admin" ? "Espace client (Aperçu Administrateur)" : "Espace client"}
          </span>
          <h1 className="font-display text-4xl lg:text-5xl">Bonjour, {user.firstName}.</h1>
          <p className="mt-1 text-xs text-ink-soft">
            Gérez vos commandes, modifiez vos informations et suivez vos colis.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {user.role === "admin" ? (
            <Link
              href="/admin"
              className="rounded-full bg-slate-900 px-5 py-2.5 text-xs font-bold text-amber-400 shadow-sm hover:bg-slate-800 transition"
            >
              Console Admin ⚙
            </Link>
          ) : null}
          <button
            onClick={logout}
            className="rounded-full border border-ink/20 px-5 py-2.5 text-xs font-medium text-ink transition hover:border-red-500 hover:text-red-600"
          >
            Se déconnecter
          </button>
        </div>
      </div>

      {/* Navigation par Onglets */}
      <div className="mt-8 flex gap-2 overflow-x-auto border-b border-ink/10 pb-4">
        {[
          { id: "orders", label: "Mes commandes & suivi", count: orders.length },
          { id: "profile", label: "Informations personnelles" },
          { id: "addresses", label: "Adresses de livraison", count: addresses.length },
          { id: "security", label: "Sécurité & mot de passe" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-full px-5 py-2.5 text-xs font-medium transition whitespace-nowrap ${
              tab === t.id
                ? "bg-ink text-cream"
                : "border border-ink/15 text-ink-soft hover:border-ink hover:text-ink"
            }`}
          >
            {t.label} {t.count !== undefined ? `(${t.count})` : ""}
          </button>
        ))}
      </div>

      {/* 1. Onglet Commandes & Suivi */}
      {tab === "orders" ? (
        <div className="mt-8 space-y-10">
          {loadingOrders ? (
            <p className="text-sm text-ink-soft">Chargement de vos commandes...</p>
          ) : orders.length === 0 ? (
            <div className="rounded-3xl border border-ink/10 bg-white/70 p-12 text-center">
              <span className="text-4xl">📦</span>
              <h2 className="font-display mt-4 text-2xl">Aucune commande pour le moment</h2>
              <p className="mt-2 text-xs text-ink-soft max-w-sm mx-auto">
                Explorez notre catalogue et trouvez des objets durables et de qualité pour votre quotidien.
              </p>
              <Link
                href="/shop"
                className="mt-6 inline-block rounded-full bg-ink px-8 py-3.5 text-eyebrow text-cream transition hover:bg-clay"
              >
                Découvrir la boutique
              </Link>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-[1.1fr_1.3fr]">
              {/* Liste des commandes */}
              <div className="space-y-4">
                <h2 className="font-display text-2xl">Historique des commandes</h2>
                {orders.map((o) => {
                  const isSelected = selectedOrder?.orderNumber === o.orderNumber;
                  return (
                    <div
                      key={o.orderNumber}
                      onClick={() => setSelectedOrder(o)}
                      className={`cursor-pointer rounded-2xl border p-5 transition ${
                        isSelected
                          ? "border-clay bg-white shadow-md ring-1 ring-clay/20"
                          : "border-ink/10 bg-white/60 hover:border-ink/30"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-mono font-bold text-ink">{o.orderNumber}</span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                            o.status === "delivered"
                              ? "bg-emerald-100 text-emerald-800"
                              : o.status === "cancelled"
                                ? "bg-red-100 text-red-700"
                                : "bg-clay/10 text-clay"
                          }`}
                        >
                          {o.status === "confirmed"
                            ? "Confirmée"
                            : o.status === "processing"
                              ? "Préparée"
                              : o.status === "shipped"
                                ? "Expédiée"
                                : o.status === "out_for_delivery"
                                  ? "En livraison"
                                  : o.status === "delivered"
                                    ? "Livrée"
                                    : "Annulée"}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-xs text-ink-soft">
                        <span>
                          {new Intl.DateTimeFormat("fr-FR", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          }).format(new Date(o.createdAt))}
                        </span>
                        <span className="font-semibold text-ink text-sm">{formatPrice(o.total)}</span>
                      </div>

                      {/* Miniatures des articles */}
                      <div className="mt-3 flex items-center gap-2 border-t border-ink/10 pt-3">
                        {o.items.slice(0, 4).map((it) => (
                          <div
                            key={it.id}
                            className="h-10 w-8 overflow-hidden rounded bg-sand border border-ink/10"
                            title={it.name}
                          >
                            <Img src={it.imageUrl} alt={it.name} className="h-full w-full object-cover" />
                          </div>
                        ))}
                        {o.items.length > 4 ? (
                          <span className="text-[11px] text-ink-soft">+{o.items.length - 4}</span>
                        ) : null}
                      </div>

                      <div className="mt-4 flex items-center justify-between text-xs">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOrder(o);
                          }}
                          className="font-medium text-clay hover:underline"
                        >
                          Suivi & Détail →
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setReceiptOrder(o);
                          }}
                          className="text-ink-soft underline underline-offset-2 hover:text-ink"
                        >
                          Récapitulatif / Reçu
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Détail & Suivi de la commande sélectionnée */}
              {selectedOrder ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-2xl">Détail de la commande</h2>
                    <button
                      onClick={() => setReceiptOrder(selectedOrder)}
                      className="rounded-full border border-ink/20 px-4 py-1.5 text-xs font-medium hover:bg-sand"
                    >
                      📄 Imprimer le récapitulatif
                    </button>
                  </div>

                  {/* Barre de suivi de la commande */}
                  <OrderTracker
                    orderNumber={selectedOrder.orderNumber}
                    status={selectedOrder.status}
                    tracking={selectedOrder.tracking}
                  />

                  {/* Liste des articles commandés */}
                  <div className="rounded-2xl border border-ink/10 bg-white/70 p-6">
                    <h3 className="font-display text-lg mb-4">Articles commandés</h3>
                    <ul className="divide-y divide-ink/10">
                      {selectedOrder.items.map((item) => (
                        <li key={item.id} className="flex items-center gap-4 py-3">
                          <div className="h-16 w-12 shrink-0 overflow-hidden rounded bg-sand border border-ink/10">
                            <Img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <Link
                              href={`/product/${item.productSlug}`}
                              className="font-medium text-xs text-ink hover:text-clay truncate block"
                            >
                              {item.name}
                            </Link>
                            <span className="text-[11px] text-ink-soft block">
                              Quantité : {item.quantity}
                            </span>
                          </div>
                          <span className="text-xs font-semibold text-ink">
                            {formatPrice(item.unitPrice * item.quantity)}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <dl className="mt-4 space-y-1.5 border-t border-ink/10 pt-4 text-xs">
                      <div className="flex justify-between text-ink-soft">
                        <dt>Sous-total</dt>
                        <dd>{formatPrice(selectedOrder.subtotal)}</dd>
                      </div>
                      <div className="flex justify-between text-ink-soft">
                        <dt>Livraison ({selectedOrder.shippingMethod})</dt>
                        <dd>{selectedOrder.shipping === 0 ? "Offerte" : formatPrice(selectedOrder.shipping)}</dd>
                      </div>
                      <div className="flex justify-between text-ink-soft">
                        <dt>Taxes</dt>
                        <dd>{formatPrice(selectedOrder.tax)}</dd>
                      </div>
                      <div className="flex justify-between border-t border-ink/10 pt-2 text-sm font-bold text-ink">
                        <dt>Total</dt>
                        <dd className="text-clay">{formatPrice(selectedOrder.total)}</dd>
                      </div>
                    </dl>

                    {/* Mode de règlement */}
                    <div className="mt-4 flex items-center justify-between rounded-xl border border-ink/10 bg-white p-3 text-xs">
                      <span className="text-ink-soft">Mode de règlement :</span>
                      <span className="font-semibold text-ink flex items-center gap-1.5">
                        {selectedOrder.paymentMethod === "cod" ? (
                          <>💵 Paiement à la livraison</>
                        ) : selectedOrder.cardBrand === "visa" ? (
                          <>💳 Carte Visa</>
                        ) : selectedOrder.cardBrand === "mastercard" ? (
                          <>💳 Mastercard</>
                        ) : (
                          <>💳 Carte Bancaire</>
                        )}
                      </span>
                    </div>

                    <div className="mt-3 rounded-xl bg-sand/60 p-4 text-xs text-ink-soft space-y-2">
                      <p className="font-semibold text-ink">Adresse de livraison :</p>
                      <p>
                        {selectedOrder.fullName} · {selectedOrder.address}, {selectedOrder.city} {selectedOrder.postalCode}, {selectedOrder.country}
                      </p>
                      {selectedOrder.latitude && selectedOrder.longitude ? (
                        <div className="mt-2 flex items-center justify-between rounded-lg bg-emerald-50 border border-emerald-200 p-2.5 text-[11px] text-emerald-900">
                          <div>
                            <span className="font-bold">📍 Coordonnées GPS livreur :</span>{" "}
                            <span className="font-mono">{selectedOrder.latitude}, {selectedOrder.longitude}</span>
                          </div>
                          <a
                            href={`https://www.google.com/maps?q=${selectedOrder.latitude},${selectedOrder.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-emerald-700 underline hover:text-emerald-900"
                          >
                            Voir sur Maps ↗
                          </a>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      ) : null}

      {/* 2. Onglet Profil */}
      {tab === "profile" ? (
        <div className="mt-8 max-w-lg">
          <div className="rounded-3xl border border-ink/10 bg-white/70 p-8 shadow-sm">
            <h2 className="font-display text-2xl">Vos coordonnées</h2>
            <p className="mt-1 text-xs text-ink-soft">
              Mettez à jour vos informations de contact pour vos factures et commandes.
            </p>

            {profileMsg ? (
              <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-3 text-xs text-green-800">
                {profileMsg}
              </div>
            ) : null}
            {profileError ? (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                {profileError}
              </div>
            ) : null}

            <form onSubmit={handleUpdateProfile} className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-eyebrow block text-xs text-ink-soft">Prénom</label>
                  <input
                    required
                    value={profileForm.firstName}
                    onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-ink/15 bg-cream px-4 py-3 text-sm outline-none focus:border-clay"
                  />
                </div>
                <div>
                  <label className="text-eyebrow block text-xs text-ink-soft">Nom</label>
                  <input
                    required
                    value={profileForm.lastName}
                    onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-ink/15 bg-cream px-4 py-3 text-sm outline-none focus:border-clay"
                  />
                </div>
              </div>

              <div>
                <label className="text-eyebrow block text-xs text-ink-soft">Adresse email</label>
                <input
                  type="email"
                  required
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-ink/15 bg-cream px-4 py-3 text-sm outline-none focus:border-clay"
                />
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="rounded-full bg-ink px-8 py-3.5 text-eyebrow text-cream transition hover:bg-clay disabled:opacity-50"
              >
                {savingProfile ? "Enregistrement..." : "Enregistrer les modifications"}
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {/* 3. Onglet Adresses de livraison */}
      {tab === "addresses" ? (
        <div className="mt-8 space-y-6 max-w-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl">Adresses de livraison</h2>
              <p className="text-xs text-ink-soft">
                Vos adresses pour une validation de commande en un clic.
              </p>
            </div>
            <button
              onClick={() => setShowAddAddr((v) => !v)}
              className="rounded-full bg-ink px-5 py-2.5 text-xs text-cream transition hover:bg-clay"
            >
              {showAddAddr ? "Annuler" : "+ Ajouter une adresse"}
            </button>
          </div>

          {addrMsg ? (
            <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-xs text-green-800">
              {addrMsg}
            </div>
          ) : null}

          {showAddAddr ? (
            <div className="rounded-2xl border border-ink/10 bg-white/70 p-6 animate-fade-in">
              <h3 className="font-display text-lg mb-4">Nouvelle adresse de livraison</h3>
              <form onSubmit={handleAddAddress} className="space-y-4">
                <div>
                  <label className="text-eyebrow block text-xs text-ink-soft">Nom complet du destinataire</label>
                  <input
                    required
                    value={newAddr.fullName}
                    onChange={(e) => setNewAddr({ ...newAddr, fullName: e.target.value })}
                    placeholder="Ada Lovelace"
                    className="mt-1 w-full rounded-lg border border-ink/15 bg-cream px-3 py-2 text-sm outline-none focus:border-clay"
                  />
                </div>
                <div>
                  <label className="text-eyebrow block text-xs text-ink-soft">Rue et numéro</label>
                  <input
                    required
                    value={newAddr.street}
                    onChange={(e) => setNewAddr({ ...newAddr, street: e.target.value })}
                    placeholder="128 Rue de Rivoli"
                    className="mt-1 w-full rounded-lg border border-ink/15 bg-cream px-3 py-2 text-sm outline-none focus:border-clay"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-eyebrow block text-xs text-ink-soft">Ville</label>
                    <input
                      required
                      value={newAddr.city}
                      onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                      placeholder="Paris"
                      className="mt-1 w-full rounded-lg border border-ink/15 bg-cream px-3 py-2 text-sm outline-none focus:border-clay"
                    />
                  </div>
                  <div>
                    <label className="text-eyebrow block text-xs text-ink-soft">Code postal</label>
                    <input
                      required
                      value={newAddr.postalCode}
                      onChange={(e) => setNewAddr({ ...newAddr, postalCode: e.target.value })}
                      placeholder="75001"
                      className="mt-1 w-full rounded-lg border border-ink/15 bg-cream px-3 py-2 text-sm outline-none focus:border-clay"
                    />
                  </div>
                  <div>
                    <label className="text-eyebrow block text-xs text-ink-soft">Pays</label>
                    <input
                      required
                      value={newAddr.country}
                      onChange={(e) => setNewAddr({ ...newAddr, country: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-ink/15 bg-cream px-3 py-2 text-sm outline-none focus:border-clay"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={newAddr.isDefault}
                    onChange={(e) => setNewAddr({ ...newAddr, isDefault: e.target.checked })}
                    className="rounded border-ink/20"
                  />
                  <label htmlFor="isDefault" className="text-xs text-ink-soft cursor-pointer">
                    Définir comme adresse de livraison par défaut
                  </label>
                </div>

                <button
                  type="submit"
                  className="rounded-full bg-ink px-6 py-2.5 text-xs text-cream transition hover:bg-clay"
                >
                  Enregistrer l&apos;adresse
                </button>
              </form>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            {addresses.map((a) => (
              <div
                key={a.id}
                className="relative rounded-2xl border border-ink/10 bg-white/70 p-5 shadow-sm"
              >
                {a.isDefault ? (
                  <span className="absolute right-4 top-4 rounded-full bg-clay/10 px-2.5 py-0.5 text-[10px] font-semibold text-clay">
                    Par défaut
                  </span>
                ) : null}
                <p className="font-semibold text-sm text-ink">{a.fullName}</p>
                <p className="mt-1 text-xs text-ink-soft leading-relaxed">
                  {a.street}
                  <br />
                  {a.postalCode} {a.city}, {a.country}
                </p>
                {a.phone ? <p className="mt-2 text-xs text-ink-soft">Tél : {a.phone}</p> : null}
                <div className="mt-4 flex gap-3 border-t border-ink/10 pt-3 text-xs">
                  <button
                    onClick={() => handleDeleteAddress(a.id)}
                    className="text-red-600 hover:underline"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* 4. Onglet Sécurité & Mot de passe */}
      {tab === "security" ? (
        <div className="mt-8 max-w-lg">
          <div className="rounded-3xl border border-ink/10 bg-white/70 p-8 shadow-sm">
            <h2 className="font-display text-2xl">Modifier votre mot de passe</h2>
            <p className="mt-1 text-xs text-ink-soft">
              Assurez-vous de choisir un mot de passe robuste comportant au moins 8 caractères.
            </p>

            {passMsg ? (
              <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-3 text-xs text-green-800">
                {passMsg}
              </div>
            ) : null}
            {passError ? (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                {passError}
              </div>
            ) : null}

            <form onSubmit={handleChangePassword} className="mt-6 space-y-4">
              <div>
                <label className="text-eyebrow block text-xs text-ink-soft">Mot de passe actuel</label>
                <input
                  type="password"
                  required
                  value={passForm.currentPassword}
                  onChange={(e) => setPassForm({ ...passForm, currentPassword: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-ink/15 bg-cream px-4 py-3 text-sm outline-none focus:border-clay"
                />
              </div>

              <div>
                <label className="text-eyebrow block text-xs text-ink-soft">Nouveau mot de passe</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={passForm.newPassword}
                  onChange={(e) => setPassForm({ ...passForm, newPassword: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-ink/15 bg-cream px-4 py-3 text-sm outline-none focus:border-clay"
                />
              </div>

              <div>
                <label className="text-eyebrow block text-xs text-ink-soft">Confirmer le nouveau mot de passe</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={passForm.confirm}
                  onChange={(e) => setPassForm({ ...passForm, confirm: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-ink/15 bg-cream px-4 py-3 text-sm outline-none focus:border-clay"
                />
              </div>

              <button
                type="submit"
                disabled={savingPass}
                className="rounded-full bg-ink px-8 py-3.5 text-eyebrow text-cream transition hover:bg-clay disabled:opacity-50"
              >
                {savingPass ? "Modification..." : "Changer mon mot de passe"}
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {/* Modale Récapitulatif / Reçu imprimable */}
      {receiptOrder ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl rounded-3xl border border-ink/10 bg-white p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-ink/10 pb-4">
              <div>
                <span className="font-display text-xl">MarketPam</span>
                <p className="text-xs text-ink-soft">Récapitulatif de commande & Reçu d&apos;achat</p>
              </div>
              <button
                onClick={() => setReceiptOrder(null)}
                className="rounded-full p-2 text-ink-soft hover:bg-sand hover:text-ink"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-ink-soft block">Numéro de commande</span>
                <span className="font-mono font-bold text-ink text-sm">{receiptOrder.orderNumber}</span>
              </div>
              <div>
                <span className="text-ink-soft block">Date</span>
                <span className="font-medium text-ink">
                  {new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short" }).format(
                    new Date(receiptOrder.createdAt),
                  )}
                </span>
              </div>
              <div>
                <span className="text-ink-soft block">Client</span>
                <span className="font-medium text-ink">{receiptOrder.fullName}</span>
                <span className="text-ink-soft block">{receiptOrder.email}</span>
              </div>
              <div>
                <span className="text-ink-soft block">Adresse de livraison</span>
                <span className="text-ink leading-relaxed block">
                  {receiptOrder.address}, {receiptOrder.city} {receiptOrder.postalCode}, {receiptOrder.country}
                </span>
              </div>
            </div>

            <table className="mt-6 w-full text-left text-xs border-t border-ink/10">
              <thead>
                <tr className="border-b border-ink/10 text-ink-soft">
                  <th className="py-2.5">Article</th>
                  <th className="py-2.5 text-center">Quantité</th>
                  <th className="py-2.5 text-right">Prix unitaire</th>
                  <th className="py-2.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {receiptOrder.items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-3 font-medium text-ink">{item.name}</td>
                    <td className="py-3 text-center">{item.quantity}</td>
                    <td className="py-3 text-right">{formatPrice(item.unitPrice)}</td>
                    <td className="py-3 text-right font-semibold">{formatPrice(item.unitPrice * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-6 border-t border-ink/10 pt-4 text-xs space-y-1.5">
              <div className="flex justify-between text-ink-soft">
                <span>Sous-total HT</span>
                <span>{formatPrice(receiptOrder.subtotal)}</span>
              </div>
              <div className="flex justify-between text-ink-soft">
                <span>Frais d&apos;expédition</span>
                <span>{receiptOrder.shipping === 0 ? "Offerts" : formatPrice(receiptOrder.shipping)}</span>
              </div>
              <div className="flex justify-between text-ink-soft">
                <span>TVA estimée</span>
                <span>{formatPrice(receiptOrder.tax)}</span>
              </div>
              <div className="flex justify-between border-t border-ink/10 pt-2 text-base font-bold text-ink">
                <span>Total TTC</span>
                <span>{formatPrice(receiptOrder.total)}</span>
              </div>
            </div>

            <div className="mt-8 flex gap-3 print:hidden">
              <button
                onClick={() => window.print()}
                className="flex-1 rounded-full bg-ink py-3 text-eyebrow text-cream transition hover:bg-clay text-center"
              >
                🖨️ Imprimer le récapitulatif
              </button>
              <button
                onClick={() => setReceiptOrder(null)}
                className="rounded-full border border-ink/20 px-6 py-3 text-eyebrow hover:bg-sand"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center text-sm text-ink-soft">Chargement...</div>}>
      <AccountContent />
    </Suspense>
  );
}
