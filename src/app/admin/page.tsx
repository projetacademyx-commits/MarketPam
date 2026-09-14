"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { formatPrice } from "@/lib/format";
import { Img } from "@/components/ui";

type AdminOverview = {
  revenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  lowStock: Array<{ id: number; name: string; slug: string; stock: number; price: number }>;
  recentOrders: any[];
};

type AdminOrder = {
  id: number;
  orderNumber: string;
  userId: number | null;
  email: string;
  fullName: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  shippingMethod: string;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  status: string;
  createdAt: string;
  items: any[];
  tracking?: {
    carrier: string;
    trackingNumber: string;
    trackingUrl?: string;
    estimatedDelivery?: string;
    currentStatus: string;
    statusMessage: string;
    updatedAt: string;
  } | null;
};

type AdminProduct = {
  id: number;
  slug: string;
  name: string;
  brand: string;
  categorySlug: string;
  summary?: string;
  description?: string;
  price: number;
  compareAtPrice?: number | null;
  stock: number;
  featured: boolean;
  badge?: string | null;
  images: string[];
};

type AdminCategory = {
  id: number;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  imageUrl: string;
  sortOrder: number;
};

type AdminUser = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt: string;
  orderCount: number;
  totalSpent: number;
};

function AdminBackoffice() {
  const router = useRouter();
  const { user, loading: authLoading, logout, refreshUser } = useAuth();
  const [activeNav, setActiveNav] = useState<
    "dashboard" | "orders" | "products" | "categories" | "users" | "settings" | "affiliate"
  >("dashboard");

  // ─── Affiliation ───────────────────────────────────────────────────────────
  type AffiliateProductAdmin = {
    id: number;
    slug: string;
    name: string;
    brand: string;
    categorySlug: string;
    summary: string;
    description: string;
    price: number;
    compareAtPrice: number | null;
    images: string[];
    affiliateUrl: string;
    affiliateSource: string;
    badge: string | null;
    featured: boolean;
    stock: number;
    isActive: boolean;
    clickCount: number;
    createdAt: string;
  };
  const [affiliateProducts, setAffiliateProducts] = useState<AffiliateProductAdmin[]>([]);
  const [affiliateStats, setAffiliateStats] = useState<{ totalProducts: number; totalClicks: number; topProducts: any[] } | null>(null);
  const [isAffiliateModalOpen, setIsAffiliateModalOpen] = useState(false);
  const [editingAffiliate, setEditingAffiliate] = useState<AffiliateProductAdmin | null>(null);
  const [affiliateForm, setAffiliateForm] = useState({
    name: "",
    slug: "",
    brand: "Externe",
    categorySlug: "home",
    summary: "",
    description: "",
    price: 2999,
    compareAtPrice: 0,
    images: "",
    affiliateUrl: "",
    affiliateSource: "aliexpress",
    badge: "",
    featured: false,
    stock: 999,
    isActive: true,
  });
  const [affiliatePreview, setAffiliatePreview] = useState(false);

  // Données
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);

  // Profil & Sécurité Admin
  const [adminProfileForm, setAdminProfileForm] = useState({ firstName: "", lastName: "", email: "" });
  const [adminProfileMsg, setAdminProfileMsg] = useState("");
  const [adminProfileErr, setAdminProfileErr] = useState("");
  const [savingAdminProfile, setSavingAdminProfile] = useState(false);

  const [adminPassForm, setAdminPassForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [adminPassMsg, setAdminPassMsg] = useState("");
  const [adminPassErr, setAdminPassErr] = useState("");
  const [savingAdminPass, setSavingAdminPass] = useState(false);

  // Filtres
  const [orderFilter, setOrderFilter] = useState("all");
  const [orderSearch, setOrderSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");

  // Modales & Formulaires
  const [editingOrder, setEditingOrder] = useState<AdminOrder | null>(null);
  const [orderModalForm, setOrderModalForm] = useState({
    status: "",
    carrier: "",
    trackingNumber: "",
    trackingUrl: "",
    estimatedDelivery: "",
    statusMessage: "",
  });

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [productForm, setProductForm] = useState({
    name: "",
    slug: "",
    brand: "MarketPam",
    categorySlug: "apparel",
    summary: "",
    description: "",
    price: 4900,
    compareAtPrice: 0,
    stock: 25,
    featured: false,
    badge: "",
    images: "",
  });

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    slug: "",
    tagline: "",
    description: "",
    imageUrl: "",
    sortOrder: 0,
  });

  // États de chargement et retours
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  // Sécurité et vérification du rôle
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login?redirect=/admin");
      } else if (user.role !== "admin") {
        router.push("/account");
      }
    }
  }, [authLoading, user, router]);

  // Chargements des données
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [ovRes, ordRes, prodRes, catRes, userRes, affRes, affStatsRes] = await Promise.all([
        fetch("/api/admin/overview"),
        fetch("/api/admin/orders"),
        fetch("/api/admin/products"),
        fetch("/api/admin/categories"),
        fetch("/api/admin/users"),
        fetch("/api/admin/affiliate"),
        fetch("/api/admin/affiliate/stats"),
      ]);

      if (ovRes.ok) setOverview(await ovRes.json());
      if (ordRes.ok) {
        const d = await ordRes.json();
        setOrders(d.orders || []);
      }
      if (prodRes.ok) {
        const d = await prodRes.json();
        setProducts(d.products || []);
      }
      if (catRes.ok) {
        const d = await catRes.json();
        setCategories(d.categories || []);
      }
      if (userRes.ok) {
        const d = await userRes.json();
        setUsers(d.users || []);
      }
      if (affRes.ok) {
        const d = await affRes.json();
        setAffiliateProducts(d.products || []);
      }
      if (affStatsRes.ok) {
        setAffiliateStats(await affStatsRes.json());
      }
    } catch (err) {
      console.error("Erreur chargement données admin:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "admin") {
      fetchAllData();
      setAdminProfileForm({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      });
    }
  }, [user]);

  // Gestion du profil Administrateur
  const handleUpdateAdminProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAdminProfile(true);
    setAdminProfileMsg("");
    setAdminProfileErr("");
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(adminProfileForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur de mise à jour");
      await refreshUser();
      setAdminProfileMsg("Profil administrateur mis à jour avec succès.");
      showToast("Profil admin mis à jour.");
    } catch (err: any) {
      setAdminProfileErr(err.message || "Erreur serveur");
    } finally {
      setSavingAdminProfile(false);
    }
  };

  // Gestion du mot de passe Administrateur
  const handleChangeAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassForm.newPassword !== adminPassForm.confirm) {
      setAdminPassErr("Les nouveaux mots de passe ne correspondent pas.");
      return;
    }
    setSavingAdminPass(true);
    setAdminPassMsg("");
    setAdminPassErr("");
    try {
      const res = await fetch("/api/user/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: adminPassForm.currentPassword,
          newPassword: adminPassForm.newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur de mot de passe");
      setAdminPassMsg("Mot de passe administrateur modifié avec succès.");
      setAdminPassForm({ currentPassword: "", newPassword: "", confirm: "" });
      showToast("Mot de passe admin modifié.");
    } catch (err: any) {
      setAdminPassErr(err.message || "Erreur serveur");
    } finally {
      setSavingAdminPass(false);
    }
  };

  // Gestion de la commande (statut & expédition)
  const handleSaveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;

    try {
      const res = await fetch(`/api/admin/orders/${editingOrder.orderNumber}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderModalForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur de mise à jour");

      setEditingOrder(null);
      showToast(`Commande ${editingOrder.orderNumber} mise à jour avec succès.`);
      fetchAllData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Gestion des produits
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const imgArray = productForm.images
        ? productForm.images.split(",").map((s) => s.trim()).filter(Boolean)
        : ["/images/products/placeholder.jpg"];

      const payload = {
        ...productForm,
        price: Number(productForm.price),
        compareAtPrice: productForm.compareAtPrice ? Number(productForm.compareAtPrice) : null,
        stock: Number(productForm.stock),
        images: imgArray,
      };

      const url = editingProduct
        ? `/api/admin/products/${editingProduct.id}`
        : "/api/admin/products";

      const method = editingProduct ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur de sauvegarde produit");

      setIsProductModalOpen(false);
      setEditingProduct(null);
      showToast(editingProduct ? "Produit modifié avec succès." : "Nouveau produit créé avec succès.");
      fetchAllData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleStockQuickChange = async (productId: number, newStock: number) => {
    try {
      await fetch(`/api/admin/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: Math.max(0, newStock) }),
      });
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, stock: Math.max(0, newStock) } : p)),
      );
      showToast("Niveau de stock actualisé.");
    } catch {}
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm("Voulez-vous vraiment supprimer définitivement ce produit ?")) return;
    try {
      await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      showToast("Produit supprimé du catalogue.");
      fetchAllData();
    } catch {}
  };

  // ─── Gestion des produits affiliés ──────────────────────────────────────────
  const handleSaveAffiliate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const imgArray = affiliateForm.images
        ? affiliateForm.images.split(",").map((s) => s.trim()).filter(Boolean)
        : [];

      const payload = {
        ...affiliateForm,
        price: Number(affiliateForm.price),
        compareAtPrice: affiliateForm.compareAtPrice ? Number(affiliateForm.compareAtPrice) : null,
        stock: Number(affiliateForm.stock),
        images: imgArray,
      };

      const url = editingAffiliate
        ? `/api/admin/affiliate/${editingAffiliate.id}`
        : "/api/admin/affiliate";
      const method = editingAffiliate ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur de sauvegarde");

      setIsAffiliateModalOpen(false);
      setEditingAffiliate(null);
      setAffiliatePreview(false);
      showToast(editingAffiliate ? "Produit affilié modifié." : "Nouveau produit affilié créé !");
      fetchAllData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteAffiliate = async (id: number) => {
    if (!confirm("Supprimer définitivement ce produit affilié ?")) return;
    try {
      await fetch(`/api/admin/affiliate/${id}`, { method: "DELETE" });
      showToast("Produit affilié supprimé.");
      fetchAllData();
    } catch {}
  };

  const handleToggleAffiliateActive = async (id: number, isActive: boolean) => {
    try {
      await fetch(`/api/admin/affiliate/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      setAffiliateProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isActive } : p)),
      );
      showToast(isActive ? "Produit activé." : "Produit désactivé.");
    } catch {}
  };

  const openAffiliateModal = (product?: AffiliateProductAdmin) => {
    if (product) {
      setEditingAffiliate(product);
      setAffiliateForm({
        name: product.name,
        slug: product.slug,
        brand: product.brand,
        categorySlug: product.categorySlug,
        summary: product.summary,
        description: product.description,
        price: product.price,
        compareAtPrice: product.compareAtPrice || 0,
        images: product.images.join(", "),
        affiliateUrl: product.affiliateUrl,
        affiliateSource: product.affiliateSource,
        badge: product.badge || "",
        featured: product.featured,
        stock: product.stock,
        isActive: product.isActive,
      });
    } else {
      setEditingAffiliate(null);
      setAffiliateForm({
        name: "",
        slug: "",
        brand: "Externe",
        categorySlug: "home",
        summary: "",
        description: "",
        price: 2999,
        compareAtPrice: 0,
        images: "",
        affiliateUrl: "",
        affiliateSource: "aliexpress",
        badge: "",
        featured: false,
        stock: 999,
        isActive: true,
      });
    }
    setAffiliatePreview(false);
    setIsAffiliateModalOpen(true);
  };

  // Gestion des catégories
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(categoryForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur catégorie");

      setIsCategoryModalOpen(false);
      setCategoryForm({ name: "", slug: "", tagline: "", description: "", imageUrl: "", sortOrder: 0 });
      showToast("Catégorie créée avec succès.");
      fetchAllData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Gestion des rôles utilisateurs
  const handleUserRoleChange = async (userId: number, role: "customer" | "admin") => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur de rôle");

      showToast(`Rôle utilisateur mis à jour vers : ${role}`);
      fetchAllData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (authLoading || !user || user.role !== "admin") {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900 text-white">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-sm font-medium tracking-wide text-slate-300">
            Initialisation de la console d&apos;administration...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
      {/* 1. SIDEBAR DÉDIÉE ADMIN */}
      <aside className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-800/80 bg-slate-900/95 backdrop-blur-xl">
        {/* Logo Backoffice */}
        <div className="flex h-20 items-center justify-between border-b border-slate-800 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 font-bold text-white shadow-lg shadow-orange-500/20">
              MP
            </div>
            <div>
              <span className="font-display text-lg font-bold tracking-tight text-white block">
                MarketPam
              </span>
              <span className="text-[10px] font-semibold tracking-wider text-amber-400 uppercase block">
                Console Admin
              </span>
            </div>
          </div>
          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" title="Serveur opérationnel" />
        </div>

        {/* Navigation Sidebar */}
        <nav className="flex-1 space-y-1.5 px-4 py-6 overflow-y-auto">
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            Gestion Principale
          </p>

          <button
            onClick={() => setActiveNav("dashboard")}
            className={`flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-sm font-medium transition-all ${
              activeNav === "dashboard"
                ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-base">📊</span>
              <span>Tableau de bord</span>
            </div>
          </button>

          <button
            onClick={() => setActiveNav("orders")}
            className={`flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-sm font-medium transition-all ${
              activeNav === "orders"
                ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-base">📦</span>
              <span>Commandes & Suivi</span>
            </div>
            {orders.length > 0 ? (
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                  activeNav === "orders"
                    ? "bg-slate-950 text-amber-400"
                    : "bg-slate-800 text-slate-300"
                }`}
              >
                {orders.length}
              </span>
            ) : null}
          </button>

          <button
            onClick={() => setActiveNav("products")}
            className={`flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-sm font-medium transition-all ${
              activeNav === "products"
                ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-base">🏷️</span>
              <span>Catalogue & Stocks</span>
            </div>
            {products.length > 0 ? (
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                  activeNav === "products"
                    ? "bg-slate-950 text-amber-400"
                    : "bg-slate-800 text-slate-300"
                }`}
              >
                {products.length}
              </span>
            ) : null}
          </button>

          <button
            onClick={() => setActiveNav("categories")}
            className={`flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-sm font-medium transition-all ${
              activeNav === "categories"
                ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-base">🗂️</span>
              <span>Rayons & Catégories</span>
            </div>
            {categories.length > 0 ? (
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                  activeNav === "categories"
                    ? "bg-slate-950 text-amber-400"
                    : "bg-slate-800 text-slate-300"
                }`}
              >
                {categories.length}
              </span>
            ) : null}
          </button>

          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 pt-5 mb-2">
            Comptes & Accès
          </p>

          <button
            onClick={() => setActiveNav("users")}
            className={`flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-sm font-medium transition-all ${
              activeNav === "users"
                ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-base">👥</span>
              <span>Clients & Rôles</span>
            </div>
            {users.length > 0 ? (
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                  activeNav === "users"
                    ? "bg-slate-950 text-amber-400"
                    : "bg-slate-800 text-slate-300"
                }`}
              >
                {users.length}
              </span>
            ) : null}
          </button>

          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 pt-5 mb-2">
            Affiliation B2C
          </p>

          <button
            onClick={() => setActiveNav("affiliate")}
            className={`flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-sm font-medium transition-all ${
              activeNav === "affiliate"
                ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-base">🔗</span>
              <span>Produits Affiliés</span>
            </div>
            {affiliateProducts.length > 0 ? (
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                  activeNav === "affiliate"
                    ? "bg-slate-950 text-amber-400"
                    : "bg-slate-800 text-slate-300"
                }`}
              >
                {affiliateProducts.length}
              </span>
            ) : null}
          </button>

          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 pt-5 mb-2">
            Système & Sécurité
          </p>

          <button
            onClick={() => setActiveNav("settings")}
            className={`flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-sm font-medium transition-all ${
              activeNav === "settings"
                ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-base">⚙️</span>
              <span>Paramètres & Sécurité</span>
            </div>
          </button>
        </nav>

        {/* Pied de Sidebar */}
        <div className="border-t border-slate-800 p-4 space-y-3 bg-slate-950/40">
          <Link
            href="/"
            target="_blank"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/60 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-700 hover:text-white"
          >
            <span>Voir le site client</span>
            <span>↗</span>
          </Link>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/20 font-bold text-amber-400 text-xs border border-amber-500/30">
                {user.firstName[0]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-white">
                  {user.firstName} {user.lastName}
                </p>
                <p className="truncate text-[10px] text-slate-400">Super Admin</p>
              </div>
            </div>

            <button
              onClick={logout}
              title="Se déconnecter"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition"
            >
              ⏻
            </button>
          </div>
        </div>
      </aside>

      {/* 2. ZONE DE CONTENU PRINCIPALE */}
      <div className="flex-1 pl-72">
        {/* Topbar Administrateur */}
        <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-slate-800/80 bg-slate-900/80 px-8 backdrop-blur-md">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white capitalize">
              {activeNav === "dashboard" && "Tableau de Bord & Ventes"}
              {activeNav === "orders" && "Gestion des Commandes & Expéditions"}
              {activeNav === "products" && "Catalogue Produits & Niveaux de Stocks"}
              {activeNav === "categories" && "Organisation des Rayons & Catégories"}
              {activeNav === "users" && "Gestion des Clients & Droits d'Accès"}
              {activeNav === "settings" && "Paramètres Généraux & Sécurité Administrateur"}
              {activeNav === "affiliate" && "Gestion des Produits Affiliés B2C"}
            </h1>
            <p className="text-xs text-slate-400">
              Console de gestion globale MarketPam · Espace 100% dédié à l&apos;administration.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchAllData}
              className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-semibold text-slate-300 hover:border-slate-600 hover:bg-slate-700 hover:text-white transition"
            >
              🔄 Actualiser
            </button>

            {activeNav === "products" && (
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setProductForm({
                    name: "",
                    slug: "",
                    brand: "MarketPam",
                    categorySlug: "apparel",
                    summary: "",
                    description: "",
                    price: 4900,
                    compareAtPrice: 0,
                    stock: 25,
                    featured: false,
                    badge: "",
                    images: "",
                  });
                  setIsProductModalOpen(true);
                }}
                className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-orange-400 transition"
              >
                + Nouveau Produit
              </button>
            )}

            {activeNav === "categories" && (
              <button
                onClick={() => setIsCategoryModalOpen(true)}
                className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-orange-400 transition"
              >
                + Nouveau Rayon
              </button>
            )}

            {activeNav === "affiliate" && (
              <button
                id="new-affiliate-product-btn"
                onClick={() => openAffiliateModal()}
                className="rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-violet-500/20 hover:from-violet-500 hover:to-purple-500 transition"
              >
                🔗 Nouveau Produit Affilié
              </button>
            )}
          </div>
        </header>

        {/* Notifications Toast */}
        {toastMessage ? (
          <div className="fixed bottom-6 right-6 z-50 rounded-xl border border-emerald-500/30 bg-emerald-950/90 px-5 py-3 text-xs font-semibold text-emerald-300 shadow-2xl backdrop-blur-md animate-fade-up">
            ✓ {toastMessage}
          </div>
        ) : null}

        {/* Contenu dynamique par onglet */}
        <main className="p-8 max-w-7xl mx-auto space-y-8">
          {/* A. TABLEAU DE BORD */}
          {activeNav === "dashboard" && overview && (
            <div className="space-y-8 animate-fade-in">
              {/* Cartes KPI */}
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-sm">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>Chiffre d&apos;affaires</span>
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-emerald-400 text-[10px] font-bold">
                      Validé
                    </span>
                  </div>
                  <p className="mt-2 font-display text-3xl font-bold text-white tracking-tight">
                    {formatPrice(overview.revenue)}
                  </p>
                  <p className="mt-2 text-[11px] text-slate-400">Total des commandes non annulées</p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-sm">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>Commandes Traitées</span>
                    <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-blue-400 text-[10px] font-bold">
                      Activité
                    </span>
                  </div>
                  <p className="mt-2 font-display text-3xl font-bold text-white tracking-tight">
                    {overview.totalOrders}
                  </p>
                  <p className="mt-2 text-[11px] text-slate-400">Commandes enregistrées en base</p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-sm">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>Base Clients</span>
                    <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-purple-400 text-[10px] font-bold">
                      Comptes
                    </span>
                  </div>
                  <p className="mt-2 font-display text-3xl font-bold text-white tracking-tight">
                    {overview.totalCustomers}
                  </p>
                  <p className="mt-2 text-[11px] text-slate-400">Clients inscrits avec session</p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-sm">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span>Catalogue Produits</span>
                    <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-amber-400 text-[10px] font-bold">
                      Stock
                    </span>
                  </div>
                  <p className="mt-2 font-display text-3xl font-bold text-white tracking-tight">
                    {overview.totalProducts}
                  </p>
                  <p className="mt-2 text-[11px] text-slate-400">Références actives en boutique</p>
                </div>
              </div>

              {/* Alertes et commandes récentes */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Alertes de stock */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-base font-bold text-white">Alertes Stocks Faibles</h2>
                      <p className="text-xs text-slate-400">Articles nécessitant un réapprovisionnement (≤ 10)</p>
                    </div>
                    <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-bold text-red-400">
                      {overview.lowStock.length} alertes
                    </span>
                  </div>

                  {overview.lowStock.length === 0 ? (
                    <p className="text-xs text-slate-400 py-4">Tous les stocks sont à des niveaux optimaux.</p>
                  ) : (
                    <div className="divide-y divide-slate-800 text-xs">
                      {overview.lowStock.map((item) => (
                        <div key={item.id} className="py-3 flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-white">{item.name}</p>
                            <p className="text-[11px] text-slate-400">{formatPrice(item.price)}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="rounded-lg bg-red-500/20 px-2.5 py-1 font-bold text-red-400">
                              {item.stock} en stock
                            </span>
                            <button
                              onClick={() => handleStockQuickChange(item.id, item.stock + 20)}
                              className="rounded-lg bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:bg-slate-700"
                            >
                              +20 unités
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Dernières commandes */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-base font-bold text-white">Dernières Commandes</h2>
                      <p className="text-xs text-slate-400">Commandes récentes passées sur la boutique</p>
                    </div>
                    <button
                      onClick={() => setActiveNav("orders")}
                      className="text-xs font-semibold text-amber-400 hover:underline"
                    >
                      Voir toutes →
                    </button>
                  </div>

                  <div className="divide-y divide-slate-800 text-xs">
                    {overview.recentOrders.slice(0, 5).map((order) => (
                      <div key={order.id} className="py-3 flex items-center justify-between">
                        <div>
                          <p className="font-mono font-bold text-white">{order.orderNumber}</p>
                          <p className="text-[11px] text-slate-400">{order.fullName} · {formatPrice(order.total)}</p>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            order.status === "delivered"
                              ? "bg-emerald-500/15 text-emerald-400"
                              : order.status === "cancelled"
                                ? "bg-red-500/15 text-red-400"
                                : "bg-amber-500/15 text-amber-400"
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* B. GESTION DES COMMANDES & SUIVI */}
          {activeNav === "orders" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Rechercher numéro, client, email..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs text-white outline-none focus:border-amber-500 w-64"
                  />
                  <select
                    value={orderFilter}
                    onChange={(e) => setOrderFilter(e.target.value)}
                    className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white outline-none"
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="confirmed">Confirmée</option>
                    <option value="processing">Préparée</option>
                    <option value="shipped">Expédiée</option>
                    <option value="out_for_delivery">En livraison</option>
                    <option value="delivered">Livrée</option>
                    <option value="cancelled">Annulée</option>
                  </select>
                </div>
                <span className="text-xs text-slate-400">{orders.length} commande(s) répertoriée(s)</span>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400">
                    <tr>
                      <th className="p-4">Numéro</th>
                      <th className="p-4">Date</th>
                      <th className="p-4">Client</th>
                      <th className="p-4">Statut</th>
                      <th className="p-4">Transporteur & Suivi</th>
                      <th className="p-4">Date estimée</th>
                      <th className="p-4 text-right">Montant</th>
                      <th className="p-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {orders
                      .filter((o) => {
                        const matchesFilter = orderFilter === "all" || o.status === orderFilter;
                        const matchesSearch =
                          !orderSearch ||
                          o.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) ||
                          o.fullName.toLowerCase().includes(orderSearch.toLowerCase()) ||
                          o.email.toLowerCase().includes(orderSearch.toLowerCase());
                        return matchesFilter && matchesSearch;
                      })
                      .map((o) => (
                        <tr key={o.orderNumber} className="hover:bg-slate-800/40 transition">
                          <td className="p-4 font-mono font-bold text-white">{o.orderNumber}</td>
                          <td className="p-4 text-slate-400">
                            {new Intl.DateTimeFormat("fr-FR", { dateStyle: "short" }).format(
                              new Date(o.createdAt),
                            )}
                          </td>
                          <td className="p-4">
                            <span className="font-semibold text-white block">{o.fullName}</span>
                            <span className="text-[11px] text-slate-400">{o.email}</span>
                          </td>
                          <td className="p-4">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                o.status === "delivered"
                                  ? "bg-emerald-500/15 text-emerald-400"
                                  : o.status === "cancelled"
                                    ? "bg-red-500/15 text-red-400"
                                    : "bg-amber-500/15 text-amber-400"
                              }`}
                            >
                              {o.status}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="font-medium text-white block">
                              {o.tracking?.carrier || "Non assigné"}
                            </span>
                            <span className="font-mono text-[11px] text-slate-400">
                              {o.tracking?.trackingNumber || "Aucun numéro"}
                            </span>
                          </td>
                          <td className="p-4 text-slate-400">
                            {o.tracking?.estimatedDelivery
                              ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "short" }).format(
                                  new Date(o.tracking.estimatedDelivery),
                                )
                              : "—"}
                          </td>
                          <td className="p-4 text-right font-bold text-white">{formatPrice(o.total)}</td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => {
                                setEditingOrder(o);
                                setOrderModalForm({
                                  status: o.status,
                                  carrier: o.tracking?.carrier || "DHL Express",
                                  trackingNumber: o.tracking?.trackingNumber || "",
                                  trackingUrl: o.tracking?.trackingUrl || "",
                                  estimatedDelivery: o.tracking?.estimatedDelivery
                                    ? new Date(o.tracking.estimatedDelivery).toISOString().slice(0, 10)
                                    : "",
                                  statusMessage: o.tracking?.statusMessage || "",
                                });
                              }}
                              className="rounded-lg bg-amber-500/20 px-3 py-1.5 text-xs font-bold text-amber-400 hover:bg-amber-500/30 transition"
                            >
                              Gérer le suivi ✎
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* C. CATALOGUE & STOCKS */}
          {activeNav === "products" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <input
                  type="text"
                  placeholder="Rechercher par nom ou slug..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs text-white outline-none focus:border-amber-500 w-72"
                />
                <span className="text-xs text-slate-400">{products.length} référence(s) en catalogue</span>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400">
                    <tr>
                      <th className="p-4">Produit</th>
                      <th className="p-4">Rayon</th>
                      <th className="p-4">Prix</th>
                      <th className="p-4">Stock</th>
                      <th className="p-4">Mise en avant</th>
                      <th className="p-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {products
                      .filter((p) => !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()))
                      .map((p) => (
                        <tr key={p.id} className="hover:bg-slate-800/40 transition">
                          <td className="p-4 flex items-center gap-3">
                            <div className="h-12 w-10 overflow-hidden rounded-lg bg-slate-800 border border-slate-700 shrink-0">
                              <Img src={p.images[0]} alt={p.name} className="h-full w-full object-cover" />
                            </div>
                            <div>
                              <p className="font-bold text-white">{p.name}</p>
                              <p className="font-mono text-[10px] text-slate-400">{p.slug}</p>
                            </div>
                          </td>
                          <td className="p-4 capitalize">{p.categorySlug}</td>
                          <td className="p-4 font-bold text-white">{formatPrice(p.price)}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleStockQuickChange(p.id, p.stock - 1)}
                                className="h-6 w-6 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold"
                              >
                                −
                              </button>
                              <span
                                className={`rounded px-2 py-0.5 font-bold ${
                                  p.stock <= 5 ? "bg-red-500/20 text-red-400" : "bg-emerald-500/20 text-emerald-400"
                                }`}
                              >
                                {p.stock}
                              </span>
                              <button
                                onClick={() => handleStockQuickChange(p.id, p.stock + 1)}
                                className="h-6 w-6 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="p-4">
                            {p.featured ? (
                              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                                ⭐ En avant
                              </span>
                            ) : (
                              <span className="text-slate-500">Standard</span>
                            )}
                          </td>
                          <td className="p-4 text-center space-x-2">
                            <button
                              onClick={() => {
                                setEditingProduct(p);
                                setProductForm({
                                  name: p.name,
                                  slug: p.slug,
                                  brand: p.brand,
                                  categorySlug: p.categorySlug,
                                  summary: p.summary || "",
                                  description: p.description || "",
                                  price: p.price,
                                  compareAtPrice: p.compareAtPrice || 0,
                                  stock: p.stock,
                                  featured: p.featured,
                                  badge: p.badge || "",
                                  images: p.images.join(", "),
                                });
                                setIsProductModalOpen(true);
                              }}
                              className="rounded bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-300 hover:bg-slate-700"
                            >
                              Éditer
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p.id)}
                              className="rounded bg-red-500/20 px-2.5 py-1 text-xs font-semibold text-red-400 hover:bg-red-500/30"
                            >
                              Supprimer
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* D. RAYONS & CATÉGORIES */}
          {activeNav === "categories" && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {categories.map((c) => (
                  <div key={c.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-400">
                        {c.slug}
                      </span>
                      <span className="text-xs text-slate-400">Ordre : {c.sortOrder}</span>
                    </div>
                    <h3 className="font-bold text-lg text-white">{c.name}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2">{c.description || "Aucune description"}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* E. CLIENTS & GESTION DES RÔLES */}
          {activeNav === "users" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <input
                  type="text"
                  placeholder="Rechercher par email ou nom..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs text-white outline-none focus:border-amber-500 w-72"
                />
                <span className="text-xs text-slate-400">{users.length} utilisateur(s) enregistré(s)</span>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400">
                    <tr>
                      <th className="p-4">Client</th>
                      <th className="p-4">Adresse Email</th>
                      <th className="p-4">Date d&apos;inscription</th>
                      <th className="p-4">Commandes</th>
                      <th className="p-4">Volume d&apos;achat</th>
                      <th className="p-4">Rôle</th>
                      <th className="p-4 text-center">Action Administrateur</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {users
                      .filter((u) => {
                        const q = userSearch.toLowerCase();
                        return (
                          !q ||
                          u.email.toLowerCase().includes(q) ||
                          u.firstName.toLowerCase().includes(q) ||
                          u.lastName.toLowerCase().includes(q)
                        );
                      })
                      .map((u) => (
                        <tr key={u.id} className="hover:bg-slate-800/40 transition">
                          <td className="p-4 font-bold text-white">
                            {u.firstName} {u.lastName}
                          </td>
                          <td className="p-4 text-slate-400">{u.email}</td>
                          <td className="p-4 text-slate-400">
                            {new Intl.DateTimeFormat("fr-FR", { dateStyle: "short" }).format(
                              new Date(u.createdAt),
                            )}
                          </td>
                          <td className="p-4 font-bold text-white">{u.orderCount}</td>
                          <td className="p-4 font-bold text-amber-400">{formatPrice(u.totalSpent)}</td>
                          <td className="p-4">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                u.role === "admin"
                                  ? "bg-amber-500 text-slate-950"
                                  : "bg-slate-800 text-slate-300"
                              }`}
                            >
                              {u.role === "admin" ? "Administrateur" : "Client"}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            {u.id !== user.id ? (
                              <button
                                onClick={() =>
                                  handleUserRoleChange(u.id, u.role === "admin" ? "customer" : "admin")
                                }
                                className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition"
                              >
                                Définir comme {u.role === "admin" ? "Client" : "Admin"}
                              </button>
                            ) : (
                              <span className="text-slate-500 text-[11px]">(Votre compte)</span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* G. PRODUITS AFFILIÉS B2C */}
          {activeNav === "affiliate" && (
            <div className="space-y-8 animate-fade-in">
              {/* Stats Affiliation */}
              {affiliateStats && (
                <div className="grid gap-5 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
                    <p className="text-xs text-slate-400 uppercase tracking-wider">Produits affiliés</p>
                    <p className="mt-2 text-3xl font-black text-white">{affiliateStats.totalProducts}</p>
                    <p className="mt-1 text-[11px] text-slate-500">Dans le catalogue d'affiliation</p>
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
                    <p className="text-xs text-slate-400 uppercase tracking-wider">Clics totaux</p>
                    <p className="mt-2 text-3xl font-black text-violet-400">{affiliateStats.totalClicks || 0}</p>
                    <p className="mt-1 text-[11px] text-slate-500">Intentions d'achat trackées</p>
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
                    <p className="text-xs text-slate-400 uppercase tracking-wider">Top produit</p>
                    <p className="mt-2 text-base font-bold text-white truncate">
                      {affiliateStats.topProducts?.[0]?.name || "—"}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {affiliateStats.topProducts?.[0]?.clickCount || 0} clics
                    </p>
                  </div>
                </div>
              )}

              {/* Tableau des produits */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
                <div className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-white">Catalogue d'Affiliation</h2>
                  <span className="rounded-full bg-violet-500/20 px-2.5 py-0.5 text-[10px] font-bold text-violet-400">
                    {affiliateProducts.length} produit{affiliateProducts.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {affiliateProducts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <span className="text-5xl mb-4">🔗</span>
                    <p className="text-sm font-medium text-slate-400">Aucun produit affilié encore.</p>
                    <p className="text-xs text-slate-500 mt-1">Cliquez sur &quot;Nouveau Produit Affilié&quot; pour commencer.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-500">
                        <tr>
                          <th className="px-6 py-3">Produit</th>
                          <th className="px-6 py-3">Source</th>
                          <th className="px-6 py-3">Prix</th>
                          <th className="px-6 py-3">Clics</th>
                          <th className="px-6 py-3">Statut</th>
                          <th className="px-6 py-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {affiliateProducts.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                {p.images?.[0] && (
                                  <img
                                    src={p.images[0]}
                                    alt={p.name}
                                    className="h-10 w-10 rounded-lg object-cover border border-slate-700"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = "none";
                                    }}
                                  />
                                )}
                                <div>
                                  <p className="font-semibold text-white text-xs line-clamp-1">{p.name}</p>
                                  <p className="text-[10px] text-slate-400">{p.brand}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-300 capitalize">
                                {p.affiliateSource}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-white font-bold text-xs">
                              {formatPrice(p.price)}
                            </td>
                            <td className="px-6 py-4">
                              <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-xs font-bold text-violet-400">
                                {p.clickCount} clics
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <button
                                onClick={() => handleToggleAffiliateActive(p.id, !p.isActive)}
                                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold transition ${
                                  p.isActive
                                    ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                                    : "bg-slate-700 text-slate-400 hover:bg-slate-600"
                                }`}
                              >
                                {p.isActive ? "✓ Actif" : "Inactif"}
                              </button>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => openAffiliateModal(p)}
                                  className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-[10px] font-semibold text-slate-300 hover:bg-slate-700 transition"
                                >
                                  ✏️ Modifier
                                </button>
                                <button
                                  onClick={() => handleDeleteAffiliate(p.id)}
                                  className="rounded-lg border border-red-900/30 bg-red-950/30 px-3 py-1.5 text-[10px] font-semibold text-red-400 hover:bg-red-900/40 transition"
                                >
                                  🗑️
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Lien vers le catalogue public */}
              <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white">Catalogue public d'affiliation</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Page visible par les visiteurs avec bouton &quot;Acheter&quot; tracké.
                  </p>
                </div>
                <a
                  href="/affiliate"
                  target="_blank"
                  className="rounded-xl border border-violet-500/30 bg-violet-600 px-4 py-2 text-xs font-bold text-white hover:bg-violet-500 transition"
                >
                  Voir le catalogue ↗
                </a>
              </div>
            </div>
          )}

          {/* F. PARAMÈTRES & SÉCURITÉ ADMINISTRATEUR */}
          {activeNav === "settings" && (
            <div className="space-y-8 animate-fade-in max-w-5xl">
              <div className="grid gap-6 lg:grid-cols-2">
                {/* 1. Carte Profil Admin */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
                  <div className="border-b border-slate-800 pb-3">
                    <div className="flex items-center justify-between">
                      <h2 className="text-base font-bold text-white">Profil Administrateur</h2>
                      <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-400">
                        Super Admin
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Informations associées à votre session administrateur sur MarketPam.
                    </p>
                  </div>

                  {adminProfileMsg ? (
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/80 p-3 text-xs text-emerald-300">
                      ✓ {adminProfileMsg}
                    </div>
                  ) : null}
                  {adminProfileErr ? (
                    <div className="rounded-xl border border-red-500/30 bg-red-950/80 p-3 text-xs text-red-300">
                      ⚠ {adminProfileErr}
                    </div>
                  ) : null}

                  <form onSubmit={handleUpdateAdminProfile} className="space-y-4 text-xs">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-slate-400 block mb-1">Prénom</label>
                        <input
                          required
                          value={adminProfileForm.firstName}
                          onChange={(e) =>
                            setAdminProfileForm({ ...adminProfileForm, firstName: e.target.value })
                          }
                          className="w-full rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-white outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 block mb-1">Nom</label>
                        <input
                          required
                          value={adminProfileForm.lastName}
                          onChange={(e) =>
                            setAdminProfileForm({ ...adminProfileForm, lastName: e.target.value })
                          }
                          className="w-full rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-white outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1">Adresse email officielle</label>
                      <input
                        type="email"
                        required
                        value={adminProfileForm.email}
                        onChange={(e) =>
                          setAdminProfileForm({ ...adminProfileForm, email: e.target.value })
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-white outline-none focus:border-amber-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={savingAdminProfile}
                      className="rounded-xl bg-amber-500 px-5 py-2.5 font-bold text-slate-950 hover:bg-amber-400 transition disabled:opacity-50"
                    >
                      {savingAdminProfile ? "Mise à jour..." : "Enregistrer le profil"}
                    </button>
                  </form>
                </div>

                {/* 2. Carte Sécurité & Mot de Passe Admin */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
                  <div className="border-b border-slate-800 pb-3">
                    <h2 className="text-base font-bold text-white">Sécurité & Clé d&apos;Accès Admin</h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Modifiez votre mot de passe pour sécuriser l&apos;accès à la console de gestion.
                    </p>
                  </div>

                  {adminPassMsg ? (
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/80 p-3 text-xs text-emerald-300">
                      ✓ {adminPassMsg}
                    </div>
                  ) : null}
                  {adminPassErr ? (
                    <div className="rounded-xl border border-red-500/30 bg-red-950/80 p-3 text-xs text-red-300">
                      ⚠ {adminPassErr}
                    </div>
                  ) : null}

                  <form onSubmit={handleChangeAdminPassword} className="space-y-4 text-xs">
                    <div>
                      <label className="text-slate-400 block mb-1">Mot de passe actuel</label>
                      <input
                        type="password"
                        required
                        value={adminPassForm.currentPassword}
                        onChange={(e) =>
                          setAdminPassForm({ ...adminPassForm, currentPassword: e.target.value })
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-white outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1">Nouveau mot de passe (8+ caractères)</label>
                      <input
                        type="password"
                        required
                        minLength={8}
                        value={adminPassForm.newPassword}
                        onChange={(e) =>
                          setAdminPassForm({ ...adminPassForm, newPassword: e.target.value })
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-white outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1">Confirmer le mot de passe</label>
                      <input
                        type="password"
                        required
                        minLength={8}
                        value={adminPassForm.confirm}
                        onChange={(e) =>
                          setAdminPassForm({ ...adminPassForm, confirm: e.target.value })
                        }
                        className="w-full rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-white outline-none focus:border-amber-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={savingAdminPass}
                      className="rounded-xl bg-amber-500 px-5 py-2.5 font-bold text-slate-950 hover:bg-amber-400 transition disabled:opacity-50"
                    >
                      {savingAdminPass ? "Modification..." : "Mettre à jour le mot de passe"}
                    </button>
                  </form>
                </div>
              </div>

              {/* 3. Carte Diagnostics & Système */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
                <h3 className="text-base font-bold text-white mb-1">Infrastructure & Environnement</h3>
                <p className="text-xs text-slate-400 mb-4">
                  État des composants logiciels et des connexions aux données.
                </p>

                <div className="grid gap-4 sm:grid-cols-3 text-xs">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                    <span className="text-slate-400 block mb-1">Moteur Base de Données</span>
                    <span className="font-semibold text-white">PostgreSQL 16</span>
                    <span className="mt-1 block text-[10px] text-emerald-400">● Connecté (127.0.0.1:5432)</span>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                    <span className="text-slate-400 block mb-1">ORM & Schéma</span>
                    <span className="font-semibold text-white">Drizzle ORM</span>
                    <span className="mt-1 block text-[10px] text-emerald-400">● 6 Tables synchronisées</span>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                    <span className="text-slate-400 block mb-1">Sécurité des Sessions</span>
                    <span className="font-semibold text-white">Tokens SHA-256</span>
                    <span className="mt-1 block text-[10px] text-slate-300">Cookies HttpOnly Lax (30j)</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODALE D'ÉDITION COMMANDE / EXPÉDITION */}
      {editingOrder ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl text-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-lg font-bold text-white">Gestion Expédition & Statut Commande</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Commande <span className="font-mono font-bold text-amber-400">{editingOrder.orderNumber}</span> · Client : <span className="text-white font-semibold">{editingOrder.fullName}</span> ({editingOrder.email})
                </p>
              </div>
              <button
                onClick={() => setEditingOrder(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Articles commandés */}
            {editingOrder.items && editingOrder.items.length > 0 && (
              <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-2">
                <p className="font-semibold text-slate-300 text-xs">Articles de la commande :</p>
                <div className="max-h-36 overflow-y-auto divide-y divide-slate-800/80">
                  {editingOrder.items.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between py-2 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="h-8 w-7 shrink-0 overflow-hidden rounded bg-slate-800 border border-slate-700">
                          <Img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                        </div>
                        <span className="truncate text-white font-medium">{item.name}</span>
                        <span className="text-slate-400">×{item.quantity}</span>
                      </div>
                      <span className="font-semibold text-white shrink-0 ml-2">
                        {formatPrice(item.unitPrice * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between border-t border-slate-800 pt-2 text-xs font-bold text-amber-400">
                  <span>Total commande</span>
                  <span>{formatPrice(editingOrder.total)}</span>
                </div>
              </div>
            )}

            {/* Adresse de livraison */}
            <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-xs text-slate-400">
              <span className="font-semibold text-slate-300 block">Adresse de livraison :</span>
              <p className="mt-0.5">{editingOrder.address}, {editingOrder.city} {editingOrder.postalCode}, {editingOrder.country}</p>
            </div>

            <form onSubmit={handleSaveOrder} className="mt-5 space-y-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Statut actuel</label>
                <select
                  value={orderModalForm.status}
                  onChange={(e) => setOrderModalForm({ ...orderModalForm, status: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-white outline-none focus:border-amber-500"
                >
                  <option value="confirmed">Confirmée</option>
                  <option value="processing">Préparée (en préparation)</option>
                  <option value="shipped">Expédiée</option>
                  <option value="out_for_delivery">En livraison</option>
                  <option value="delivered">Livrée</option>
                  <option value="cancelled">Annulée</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Transporteur</label>
                  <input
                    value={orderModalForm.carrier}
                    onChange={(e) => setOrderModalForm({ ...orderModalForm, carrier: e.target.value })}
                    placeholder="DHL Express, Chronopost..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-white outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Numéro de suivi</label>
                  <input
                    value={orderModalForm.trackingNumber}
                    onChange={(e) => setOrderModalForm({ ...orderModalForm, trackingNumber: e.target.value })}
                    placeholder="TRK-9812739"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-white outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">URL de suivi directe</label>
                <input
                  value={orderModalForm.trackingUrl}
                  onChange={(e) => setOrderModalForm({ ...orderModalForm, trackingUrl: e.target.value })}
                  placeholder="https://track.dhl.com/..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-white outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Date estimée de livraison</label>
                <input
                  type="date"
                  value={orderModalForm.estimatedDelivery}
                  onChange={(e) => setOrderModalForm({ ...orderModalForm, estimatedDelivery: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-white outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Message d&apos;étape visible par le client</label>
                <input
                  value={orderModalForm.statusMessage}
                  onChange={(e) => setOrderModalForm({ ...orderModalForm, statusMessage: e.target.value })}
                  placeholder="Colis en cours d'acheminement..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-white outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-amber-500 py-3 font-bold text-slate-950 hover:bg-amber-400 transition"
                >
                  Enregistrer les modifications
                </button>
                <button
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-5 py-3 font-semibold text-slate-300 hover:bg-slate-700"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* MODALE PRODUIT AFFILIÉ (NOUVEAU / ÉDITION) */}
      {isAffiliateModalOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-fade-in">
          <div className="relative flex w-full max-w-5xl gap-5 max-h-[92vh]">
            {/* Formulaire */}
            <div className="flex-1 rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl text-slate-200 overflow-y-auto">
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-slate-900 px-6 py-4">
                <h2 className="text-base font-bold text-white">
                  {editingAffiliate ? "✏️ Modifier le Produit Affilié" : "🔗 Nouveau Produit Affilié"}
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAffiliatePreview(!affiliatePreview)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      affiliatePreview
                        ? "bg-violet-600 text-white"
                        : "border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    {affiliatePreview ? "👁 Aperçu ON" : "👁 Aperçu"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsAffiliateModalOpen(false); setAffiliatePreview(false); }}
                    className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <form onSubmit={handleSaveAffiliate} className="space-y-4 p-6">
                {/* Ligne 1: Nom + Slug */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Nom du produit *</label>
                    <input
                      required
                      value={affiliateForm.name}
                      onChange={(e) => {
                        const name = e.target.value;
                        const slug = editingAffiliate
                          ? affiliateForm.slug
                          : name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
                        setAffiliateForm({ ...affiliateForm, name, slug });
                      }}
                      placeholder="Montre Smart Pro X200"
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Slug URL *</label>
                    <input
                      required
                      value={affiliateForm.slug}
                      onChange={(e) => setAffiliateForm({ ...affiliateForm, slug: e.target.value })}
                      placeholder="montre-smart-pro-x200"
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                {/* Ligne 2: Marque + Source + Catégorie */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Marque</label>
                    <input
                      value={affiliateForm.brand}
                      onChange={(e) => setAffiliateForm({ ...affiliateForm, brand: e.target.value })}
                      placeholder="Brand XYZ"
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Source affiliée</label>
                    <select
                      value={affiliateForm.affiliateSource}
                      onChange={(e) => setAffiliateForm({ ...affiliateForm, affiliateSource: e.target.value })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500"
                    >
                      <option value="aliexpress">AliExpress</option>
                      <option value="amazon">Amazon</option>
                      <option value="ebay">eBay</option>
                      <option value="etsy">Etsy</option>
                      <option value="wish">Wish</option>
                      <option value="autre">Autre</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Catégorie</label>
                    <select
                      value={affiliateForm.categorySlug}
                      onChange={(e) => setAffiliateForm({ ...affiliateForm, categorySlug: e.target.value })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500"
                    >
                      <option value="home">Maison</option>
                      <option value="apparel">Mode</option>
                      <option value="electronics">Électronique</option>
                      <option value="beauty">Beauté</option>
                      <option value="sports">Sport</option>
                      <option value="toys">Jouets</option>
                    </select>
                  </div>
                </div>

                {/* Résumé */}
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Résumé court</label>
                  <input
                    value={affiliateForm.summary}
                    onChange={(e) => setAffiliateForm({ ...affiliateForm, summary: e.target.value })}
                    placeholder="Montre connectée avec 15 jours d'autonomie..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Description longue</label>
                  <textarea
                    rows={3}
                    value={affiliateForm.description}
                    onChange={(e) => setAffiliateForm({ ...affiliateForm, description: e.target.value })}
                    placeholder="Description détaillée du produit..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500 resize-none"
                  />
                </div>

                {/* Prix */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Prix (centimes) *</label>
                    <input
                      required
                      type="number"
                      min="1"
                      value={affiliateForm.price}
                      onChange={(e) => setAffiliateForm({ ...affiliateForm, price: Number(e.target.value) })}
                      placeholder="4999"
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500"
                    />
                    <p className="mt-1 text-[10px] text-slate-500">
                      = {affiliateForm.price ? (affiliateForm.price / 100).toFixed(2) + " €" : "0,00 €"}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Prix barré (centimes)</label>
                    <input
                      type="number"
                      min="0"
                      value={affiliateForm.compareAtPrice}
                      onChange={(e) => setAffiliateForm({ ...affiliateForm, compareAtPrice: Number(e.target.value) })}
                      placeholder="7999"
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500"
                    />
                    <p className="mt-1 text-[10px] text-slate-500">
                      = {affiliateForm.compareAtPrice ? (affiliateForm.compareAtPrice / 100).toFixed(2) + " €" : "0,00 €"}
                    </p>
                  </div>
                </div>

                {/* URL Affiliée (sécurisée côté serveur) */}
                <div>
                  <label className="text-xs text-slate-400 block mb-1">
                    🔒 Lien d'affiliation * <span className="text-violet-400">(jamais exposé au visiteur)</span>
                  </label>
                  <input
                    required
                    type="url"
                    value={affiliateForm.affiliateUrl}
                    onChange={(e) => setAffiliateForm({ ...affiliateForm, affiliateUrl: e.target.value })}
                    placeholder="https://www.aliexpress.com/item/..."
                    className="w-full rounded-xl border border-violet-500/40 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500"
                  />
                </div>

                {/* Images */}
                <div>
                  <label className="text-xs text-slate-400 block mb-1">
                    Images (URLs séparées par des virgules)
                  </label>
                  <input
                    value={affiliateForm.images}
                    onChange={(e) => setAffiliateForm({ ...affiliateForm, images: e.target.value })}
                    placeholder="https://... , https://..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500"
                  />
                </div>

                {/* Badge + Options */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Badge</label>
                    <input
                      value={affiliateForm.badge}
                      onChange={(e) => setAffiliateForm({ ...affiliateForm, badge: e.target.value })}
                      placeholder="Bestseller"
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Stock affiché</label>
                    <input
                      type="number"
                      min="0"
                      value={affiliateForm.stock}
                      onChange={(e) => setAffiliateForm({ ...affiliateForm, stock: Number(e.target.value) })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500"
                    />
                  </div>
                  <div className="flex flex-col gap-2 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={affiliateForm.featured}
                        onChange={(e) => setAffiliateForm({ ...affiliateForm, featured: e.target.checked })}
                        className="rounded accent-violet-500"
                      />
                      <span className="text-xs text-slate-300">⭐ En vedette</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={affiliateForm.isActive}
                        onChange={(e) => setAffiliateForm({ ...affiliateForm, isActive: e.target.checked })}
                        className="rounded accent-emerald-500"
                      />
                      <span className="text-xs text-slate-300">✓ Actif</span>
                    </label>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2 border-t border-slate-800">
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 py-3 text-sm font-bold text-white hover:from-violet-500 hover:to-purple-500 transition shadow-lg shadow-violet-500/20"
                  >
                    {editingAffiliate ? "Sauvegarder les modifications" : "🔗 Publier le produit affilié"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsAffiliateModalOpen(false); setAffiliatePreview(false); }}
                    className="rounded-xl border border-slate-700 bg-slate-800 px-5 py-3 text-sm font-semibold text-slate-300 hover:bg-slate-700 transition"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>

            {/* Aperçu Live */}
            {affiliatePreview && (
              <div className="w-72 flex-shrink-0 rounded-2xl border border-violet-500/30 bg-slate-950 p-4 overflow-y-auto">
                <p className="text-[10px] font-bold uppercase tracking-widest text-violet-400 mb-4">
                  👁 Aperçu carte client
                </p>
                <div className="rounded-2xl border border-slate-700 bg-white overflow-hidden">
                  {/* Image preview */}
                  <div className="relative aspect-square bg-slate-100 overflow-hidden">
                    {affiliateForm.images ? (
                      <img
                        src={affiliateForm.images.split(",")[0]?.trim()}
                        alt="Aperçu"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/images/products/placeholder.jpg";
                        }}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-3xl text-slate-400">
                        🖼️
                      </div>
                    )}
                    <div className="absolute left-2 top-2 flex flex-col gap-1">
                      {affiliateForm.badge && (
                        <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[9px] font-bold text-white">
                          {affiliateForm.badge}
                        </span>
                      )}
                      {affiliateForm.compareAtPrice > 0 && affiliateForm.compareAtPrice > affiliateForm.price && (
                        <span className="rounded-full bg-red-500 px-2 py-0.5 text-[9px] font-bold text-white">
                          -{Math.round(((affiliateForm.compareAtPrice - affiliateForm.price) / affiliateForm.compareAtPrice) * 100)}%
                        </span>
                      )}
                      {affiliateForm.featured && (
                        <span className="rounded-full bg-violet-600 px-2 py-0.5 text-[9px] font-bold text-white">
                          ⭐ Sélection
                        </span>
                      )}
                    </div>
                    <div className="absolute right-2 top-2">
                      <span className="inline-flex items-center rounded-full bg-red-600 px-1.5 py-0.5 text-[9px] font-bold text-white capitalize">
                        {affiliateForm.affiliateSource}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-3 space-y-2">
                    <p className="text-[9px] font-semibold uppercase text-slate-400">{affiliateForm.brand || "Marque"}</p>
                    <p className="text-xs font-bold text-slate-800 line-clamp-2">
                      {affiliateForm.name || "Nom du produit"}
                    </p>
                    {affiliateForm.summary && (
                      <p className="text-[10px] text-slate-500 line-clamp-2">{affiliateForm.summary}</p>
                    )}
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-base font-black text-slate-900">
                        {affiliateForm.price ? (affiliateForm.price / 100).toFixed(2) + " €" : "0,00 €"}
                      </span>
                      {affiliateForm.compareAtPrice > 0 && (
                        <span className="text-xs text-slate-400 line-through">
                          {(affiliateForm.compareAtPrice / 100).toFixed(2)} €
                        </span>
                      )}
                    </div>
                    <div className="rounded-lg bg-amber-500 py-2 text-center text-xs font-bold text-slate-950">
                      🛒 Acheter maintenant
                    </div>
                    <p className="text-center text-[9px] text-slate-400">
                      Redirigé vers {affiliateForm.affiliateSource}
                    </p>
                  </div>
                </div>

                {/* Info tracking */}
                <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                  <p className="text-[9px] text-emerald-400 font-semibold">✓ Lien affilié sécurisé</p>
                  <p className="text-[9px] text-slate-500 mt-0.5">
                    URL masquée — tracking auto avant redirection
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* MODALE PRODUIT (NOUVEAU / ÉDITION) */}
      {isProductModalOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl text-slate-200 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-white">
              {editingProduct ? "Modifier le Produit" : "Nouveau Produit au Catalogue"}
            </h2>

            <form onSubmit={handleSaveProduct} className="mt-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Nom du produit</label>
                  <input
                    required
                    value={productForm.name}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        name: e.target.value,
                        slug: !editingProduct
                          ? e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-")
                          : productForm.slug,
                      })
                    }
                    placeholder="Manteau en Laine"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-white outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Slug unique</label>
                  <input
                    required
                    value={productForm.slug}
                    onChange={(e) => setProductForm({ ...productForm, slug: e.target.value })}
                    placeholder="manteau-en-laine"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-white outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Rayon / Catégorie</label>
                  <select
                    value={productForm.categorySlug}
                    onChange={(e) => setProductForm({ ...productForm, categorySlug: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-white outline-none focus:border-amber-500"
                  >
                    <option value="apparel">Apparel</option>
                    <option value="home">Home</option>
                    <option value="tech">Sound & Tech</option>
                    <option value="beauty">Skin & Scent</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Marque</label>
                  <input
                    value={productForm.brand}
                    onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-white outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Prix (en centimes)</label>
                  <input
                    type="number"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                    placeholder="4900 pour 49,00 €"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-white outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Prix barré</label>
                  <input
                    type="number"
                    value={productForm.compareAtPrice}
                    onChange={(e) => setProductForm({ ...productForm, compareAtPrice: Number(e.target.value) })}
                    placeholder="6500"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-white outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Stock initial</label>
                  <input
                    type="number"
                    required
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-white outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Phrase d&apos;accroche</label>
                <input
                  value={productForm.summary}
                  onChange={(e) => setProductForm({ ...productForm, summary: e.target.value })}
                  placeholder="Élégant, minimaliste et conçu pour durer."
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-white outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Description complète</label>
                <textarea
                  rows={3}
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-white outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">URLs des images (séparées par virgule)</label>
                <input
                  value={productForm.images}
                  onChange={(e) => setProductForm({ ...productForm, images: e.target.value })}
                  placeholder="https://images.unsplash.com/..., https://..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-white outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="featured"
                  checked={productForm.featured}
                  onChange={(e) => setProductForm({ ...productForm, featured: e.target.checked })}
                  className="rounded border-slate-700"
                />
                <label htmlFor="featured" className="text-slate-300 cursor-pointer">
                  Mettre en avant sur la page d&apos;accueil
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-amber-500 py-3 font-bold text-slate-950 hover:bg-amber-400 transition"
                >
                  {editingProduct ? "Mettre à jour" : "Créer le produit"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-5 py-3 font-semibold text-slate-300 hover:bg-slate-700"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* MODALE CATÉGORIE */}
      {isCategoryModalOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl text-slate-200">
            <h2 className="text-lg font-bold text-white">Nouveau Rayon / Catégorie</h2>

            <form onSubmit={handleSaveCategory} className="mt-5 space-y-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Nom de la catégorie</label>
                <input
                  required
                  value={categoryForm.name}
                  onChange={(e) =>
                    setCategoryForm({
                      ...categoryForm,
                      name: e.target.value,
                      slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                    })
                  }
                  placeholder="Horlogerie"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-white outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Slug</label>
                <input
                  required
                  value={categoryForm.slug}
                  onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                  placeholder="horlogerie"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-white outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Description courte</label>
                <input
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  placeholder="Montres artisanales et pièces mécaniques"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-white outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-amber-500 py-3 font-bold text-slate-950 hover:bg-amber-400 transition"
                >
                  Créer la catégorie
                </button>
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-5 py-3 font-semibold text-slate-300 hover:bg-slate-700"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-slate-950 text-white text-sm">
          Chargement de la console d&apos;administration...
        </div>
      }
    >
      <AdminBackoffice />
    </Suspense>
  );
}
