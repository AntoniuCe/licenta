import React, { useEffect, useMemo, useState } from "react";
import {
  ShoppingBag,
  Shield,
  LogOut,
  Search,
  Sparkles,
  CreditCard,
  Package,
  Plus,
  Minus,
  Trash2,
  User,
  Lock,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Star,
  Image as ImageIcon,
  ArrowRight,
  SlidersHorizontal,
} from "lucide-react";

const API_BASE = "http://localhost:8080/api";
const FILE_BASE = "http://localhost:8080";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

async function apiFetch(path, options = {}, token = "") {
  const headers = {
    ...(options.headers || {}),
  };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      (typeof data === "object" && (data?.error || data?.message)) ||
      "Request failed";
    throw new Error(message);
  }

  return data;
}

function parseJwt(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function normalizeProduct(p) {
  return {
    id: p.id ?? p.ID,
    name: p.name ?? p.Name ?? "",
    description: p.description ?? p.Description ?? "",
    category: p.category ?? p.Category ?? "general",
    price: p.price ?? p.Price ?? 0,
    stock: p.stock ?? p.Stock ?? 0,
    is_featured: p.is_featured ?? p.IsFeatured ?? false,
    images: (p.images ?? p.Images ?? []).map((img) => ({
      id: img.id ?? img.ID,
      product_id: img.product_id ?? img.ProductID,
      image_url: img.image_url ?? img.ImageURL ?? "",
      is_primary: img.is_primary ?? img.IsPrimary ?? false,
    })),
  };
}

function normalizeCart(data) {
  const items = data?.items ?? data?.Items ?? [];
  return {
    id: data?.id ?? data?.ID,
    user_id: data?.user_id ?? data?.UserID,
    items: items.map((item) => ({
      id: item.id ?? item.ID,
      cart_id: item.cart_id ?? item.CartID,
      product_id: item.product_id ?? item.ProductID,
      quantity: item.quantity ?? item.Quantity ?? 0,
    })),
  };
}

function Card({ className = "", children }) {
  return (
    <div
      className={cn(
        "rounded-[28px] border border-slate-700/60 bg-slate-900/80 shadow-[0_12px_40px_rgba(2,6,23,0.35)] backdrop-blur-xl",
        className
      )}
    >
      {children}
    </div>
  );
}

function Message({ message }) {
  if (!message) return null;

  const styles = {
    success: "border-emerald-400/20 bg-emerald-500/10 text-emerald-200",
    error: "border-rose-400/20 bg-rose-500/10 text-rose-200",
    info: "border-blue-400/20 bg-blue-500/10 text-blue-200",
  };

  return (
    <div
      className={cn(
        "mb-6 rounded-2xl border px-4 py-3 text-sm",
        styles[message.type] || styles.info
      )}
    >
      {message.text}
    </div>
  );
}

function AuthScreen({
  mode,
  onModeChange,
  onLogin,
  onRegister,
  loading,
  message,
}) {
  const [form, setForm] = useState({ email: "", password: "" });

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0b1220] text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.16),transparent_25%),radial-gradient(circle_at_top_right,rgba(99,102,241,0.14),transparent_25%),radial-gradient(circle_at_bottom,rgba(14,165,233,0.10),transparent_30%)]" />
      <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center px-6 py-10">
        <div className="grid w-full gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="flex flex-col justify-center">
            <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-2 text-sm text-blue-300">
              <Sparkles size={16} />
              Marketplace UI
            </div>

            <h1 className="max-w-3xl text-5xl font-black leading-[0.95] text-white md:text-7xl">
              Welcome back.
              <span className="block bg-gradient-to-r from-blue-400 via-indigo-400 to-sky-400 bg-clip-text text-transparent">
                Build your demo store.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg text-slate-300">
              Interfață modernă pentru proiectul tău de licență. După autentificare
              vezi catalogul, detaliile produselor, coșul, comenzile și panoul de administrare.
            </p>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              <Card className="p-5">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-300">
                  <LayoutGrid size={20} />
                </div>
                <div className="text-lg font-semibold text-white">Catalog dinamic</div>
                <p className="mt-2 text-sm text-slate-400">
                  Tu doar adaugi produse și poze în admin panel.
                </p>
              </Card>

              <Card className="p-5">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-300">
                  <Shield size={20} />
                </div>
                <div className="text-lg font-semibold text-white">Acces securizat</div>
                <p className="mt-2 text-sm text-slate-400">
                  Prima pagină este login, iar shop-ul apare după autentificare.
                </p>
              </Card>

              <Card className="p-5">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-300">
                  <ImageIcon size={20} />
                </div>
                <div className="text-lg font-semibold text-white">Galerie produs</div>
                <p className="mt-2 text-sm text-slate-400">
                  Fiecare produs poate avea mai multe imagini și slider.
                </p>
              </Card>
            </div>
          </div>

          <Card className="self-center p-7 md:p-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <div className="text-sm uppercase tracking-[0.25em] text-slate-400">
                  Access Portal
                </div>
                <h2 className="mt-2 text-3xl font-bold text-white">
                  {mode === "login" ? "Autentificare" : "Creare cont"}
                </h2>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800 text-blue-300">
                {mode === "login" ? <Lock size={20} /> : <User size={20} />}
              </div>
            </div>

            <Message message={message} />

            <div className="mb-5 flex rounded-2xl border border-slate-700 bg-slate-950/60 p-1">
              <button
                onClick={() => onModeChange("login")}
                className={cn(
                  "flex-1 rounded-2xl px-4 py-3 text-sm font-semibold transition",
                  mode === "login"
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:bg-slate-800/70"
                )}
              >
                Login
              </button>
              <button
                onClick={() => onModeChange("register")}
                className={cn(
                  "flex-1 rounded-2xl px-4 py-3 text-sm font-semibold transition",
                  mode === "register"
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:bg-slate-800/70"
                )}
              >
                Register
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm text-slate-300">Email</label>
                <input
                  value={form.email}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="student@example.com"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">Parolă</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, password: e.target.value }))
                  }
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400"
                />
              </div>

              <button
                onClick={() =>
                  mode === "login" ? onLogin(form) : onRegister(form)
                }
                disabled={loading}
                className="w-full rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 px-4 py-3 font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Se procesează..."
                  : mode === "login"
                  ? "Intră în platformă"
                  : "Creează cont"}
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MarketplaceHeader({
  activeTab,
  setActiveTab,
  role,
  cartCount,
  onLogout,
  globalSearch,
  setGlobalSearch,
}) {
  const tabs = [
    { key: "products", label: "Produse" },
    { key: "cart", label: `Coș ${cartCount ? `(${cartCount})` : ""}` },
    { key: "orders", label: "Comenzi" },
    ...(role === "admin" ? [{ key: "admin", label: "Admin" }] : []),
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg">
              <ShoppingBag size={22} />
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.28em] text-blue-400">
                Marketplace
              </div>
              <h1 className="text-2xl font-black text-white">K3s Demo Store</h1>
            </div>
          </div>

          <div className="flex flex-1 items-center gap-3 lg:max-w-2xl">
            <div className="flex flex-1 items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-300 shadow-sm">
              <Search size={18} />
              <input
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Caută produse, categorii, descrieri..."
                className="w-full bg-transparent outline-none placeholder:text-slate-500"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "rounded-2xl px-4 py-2 text-sm font-medium transition",
                  activeTab === tab.key
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800 text-slate-200 hover:bg-slate-700"
                )}
              >
                {tab.label}
              </button>
            ))}

            <button
              onClick={onLogout}
              className="ml-1 rounded-2xl bg-rose-900/30 px-4 py-2 text-sm font-medium text-rose-200 transition hover:bg-rose-900/50"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

function HeroSection({ onBrowse }) {
  return (
    <section className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
      <Card className="relative overflow-hidden p-8 md:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.10),transparent_25%),radial-gradient(circle_at_bottom_right,rgba(99,102,241,0.10),transparent_25%)]" />
        <div className="relative">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-sm text-blue-300">
            <Sparkles size={14} />
            Featured marketplace design
          </div>

          <h2 className="max-w-3xl text-4xl font-black leading-tight text-white md:text-6xl">
            Discover products
            <span className="block bg-gradient-to-r from-blue-400 via-indigo-400 to-sky-400 bg-clip-text text-transparent">
              ready for your demo.
            </span>
          </h2>

          <p className="mt-4 max-w-2xl text-lg text-slate-300">
            Catalog modern, administrare ușoară, imagini multiple și o interfață
            care arată mai mult ca un magazin real.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={onBrowse}
              className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white"
            >
              Vezi produse
              <ArrowRight size={18} />
            </button>

            <div className="rounded-2xl border border-slate-700 bg-slate-950/60 px-5 py-3 text-sm text-slate-300">
              React + Go + PostgreSQL + k3s
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4">
        <Card className="p-5">
          <div className="text-sm text-slate-400">Cluster țintă</div>
          <div className="mt-2 text-2xl font-bold text-white">k3s / Raspberry Pi</div>
        </Card>
        <Card className="p-5">
          <div className="text-sm text-slate-400">Backend</div>
          <div className="mt-2 text-2xl font-bold text-white">Go + Gin + Postgres</div>
        </Card>
        <Card className="p-5">
          <div className="text-sm text-slate-400">Flow</div>
          <div className="mt-2 text-lg font-semibold text-white">
            Login → Browse → Details → Cart → Orders → Admin
          </div>
        </Card>
      </div>
    </section>
  );
}

function SectionTitle({ eyebrow, title, subtitle, action }) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow && (
          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-blue-400">
            {eyebrow}
          </div>
        )}
        <h2 className="text-3xl font-black text-white">{title}</h2>
        {subtitle && <p className="mt-2 text-slate-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function FeaturedProducts({ products, setSelectedProduct }) {
  const featured = products.filter((p) => p.is_featured).slice(0, 4);

  if (!featured.length) return null;

  return (
    <section className="space-y-5">
      <SectionTitle
        eyebrow="Featured"
        title="Produse evidențiate"
        subtitle="Produse marcate manual din Admin Console."
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {featured.map((product) => {
          const primaryImage =
            product.images?.find((img) => img.is_primary) || product.images?.[0];

          return (
            <Card
              key={product.id}
              className="group cursor-pointer p-4 transition hover:-translate-y-1"
            >
              <button
                onClick={() => setSelectedProduct(product)}
                className="w-full text-left"
              >
                <div className="overflow-hidden rounded-3xl bg-slate-950/40">
                  <img
                    src={
                      primaryImage?.image_url
                        ? `${FILE_BASE}${primaryImage.image_url}`
                        : "https://placehold.co/600x400?text=No+Image"
                    }
                    alt={product.name}
                    className="h-48 w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                  />
                </div>

                <div className="mt-4">
                  <div className="mb-2 inline-flex rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-300">
                    {product.category}
                  </div>
                  <h3 className="text-lg font-bold text-white">{product.name}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-400">
                    {product.description}
                  </p>
                  <div className="mt-3 text-xl font-black text-white">
                    {product.price} RON
                  </div>
                </div>
              </button>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

function ProductGallery({ images = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setCurrentIndex(0);
  }, [images]);

  if (!images.length) {
    return <Card className="p-8 text-center text-slate-400">No images</Card>;
  }

  const currentImage = images[currentIndex];

  const prevImage = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const nextImage = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-3xl border border-slate-700 bg-slate-900">
        <img
          src={`${FILE_BASE}${currentImage.image_url}`}
          alt="Product"
          className="h-[420px] w-full object-cover"
        />

        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-slate-950/70 p-2 text-white"
            >
              <ChevronLeft size={20} />
            </button>

            <button
              onClick={nextImage}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-slate-950/70 p-2 text-white"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>

      <div className="flex gap-3 overflow-x-auto">
        {images.map((img, index) => (
          <button
            key={img.id || index}
            onClick={() => setCurrentIndex(index)}
            className={cn(
              "overflow-hidden rounded-2xl border",
              currentIndex === index ? "border-blue-500" : "border-slate-700"
            )}
          >
            <img
              src={`${FILE_BASE}${img.image_url}`}
              alt={`thumb-${index}`}
              className="h-20 w-20 object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

function ProductCard({ product, token, onAddToCart, setSelectedProduct }) {
  const [qty, setQty] = useState(1);

  const primaryImage =
    product.images?.find((img) => img.is_primary) || product.images?.[0];

  return (
    <Card className="group p-5 transition hover:-translate-y-1">
      <div className="mb-4 overflow-hidden rounded-3xl bg-slate-950/40">
        <img
          src={
            primaryImage?.image_url
              ? `${FILE_BASE}${primaryImage.image_url}`
              : "https://placehold.co/600x400?text=No+Image"
          }
          alt={product.name}
          className="h-56 w-full object-cover transition duration-300 group-hover:scale-[1.03]"
        />
      </div>

      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <div className="mb-2 inline-flex rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-300">
            {product.category || "general"}
          </div>
          <h3 className="text-xl font-bold text-white">{product.name}</h3>
          <p className="mt-2 min-h-10 text-sm text-slate-400">
            {product.description || "Fără descriere"}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-800 px-3 py-2 text-sm text-slate-300">
          Stock: {product.stock}
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="text-3xl font-black text-white">{product.price} RON</div>
        {product.is_featured && (
          <div className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-200">
            Evidențiat
          </div>
        )}
      </div>

      <button
        onClick={() => setSelectedProduct(product)}
        className="mb-3 w-full rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-slate-700"
      >
        Vezi detalii
      </button>

      <div className="flex items-center gap-3">
        <input
          type="number"
          min="1"
          value={qty}
          onChange={(e) => setQty(Number(e.target.value))}
          className="w-24 rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-white outline-none"
        />
        <button
          disabled={!token || product.stock <= 0}
          onClick={() => onAddToCart(product.id, qty)}
          className="flex-1 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 px-4 py-3 font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {token ? "Add to cart" : "Login required"}
        </button>
      </div>
    </Card>
  );
}

function ProductsView({
  products,
  token,
  onAddToCart,
  search,
  setSearch,
  category,
  setCategory,
  setSelectedProduct,
}) {
  const categories = [
    "all",
    ...new Set(products.map((p) => (p.category || "general").toLowerCase())),
  ];

  const filteredProducts = products.filter((product) => {
    const productCategory = (product.category || "general").toLowerCase();
    const matchesCategory =
      category === "all" || productCategory === category;
    const matchesSearch =
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      (product.description || "").toLowerCase().includes(search.toLowerCase()) ||
      productCategory.includes(search.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  return (
    <section className="space-y-6">
      <SectionTitle
        eyebrow="Catalog"
        title="Toate produsele"
        subtitle="Caută, filtrează și explorează produsele din baza ta de date."
        action={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-300 shadow-sm">
              <SlidersHorizontal size={18} />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-transparent outline-none"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat} className="bg-slate-900">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-300 shadow-sm">
              <Search size={18} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Caută în catalog..."
                className="bg-transparent outline-none placeholder:text-slate-500"
              />
            </div>
          </div>
        }
      />

      {filteredProducts.length === 0 ? (
        <Card className="p-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-slate-400">
            <Package size={26} />
          </div>
          <h3 className="text-xl font-bold text-white">Niciun produs găsit</h3>
          <p className="mt-2 text-slate-400">
            Încearcă alt text de căutare sau altă categorie.
          </p>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              token={token}
              onAddToCart={onAddToCart}
              setSelectedProduct={setSelectedProduct}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function ProductDetailsView({ product, onBack, onAddToCart }) {
  const [qty, setQty] = useState(1);

  return (
    <section className="space-y-6">
      <button
        onClick={onBack}
        className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-200 shadow-sm"
      >
        ← Înapoi
      </button>

      <div className="grid gap-6 lg:grid-cols-2">
        <ProductGallery images={product.images || []} />

        <Card className="p-6">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-300">
              {product.category || "general"}
            </div>
            {product.is_featured && (
              <div className="inline-flex rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-200">
                Produs evidențiat
              </div>
            )}
          </div>

          <h2 className="text-3xl font-black text-white">{product.name}</h2>
          <p className="mt-4 text-slate-300">{product.description}</p>

          <div className="mt-6 text-4xl font-black text-white">
            {product.price} RON
          </div>

          <div className="mt-3 text-sm text-slate-400">
            Stock disponibil: {product.stock}
          </div>

          <div className="mt-6 flex items-center gap-3">
            <input
              type="number"
              min="1"
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              className="w-24 rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-white outline-none"
            />
            <button
              onClick={() => onAddToCart(product.id, qty)}
              className="flex-1 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 px-4 py-3 font-semibold text-white"
            >
              Adaugă în coș
            </button>
          </div>
        </Card>
      </div>
    </section>
  );
}

function CartView({ cart, onUpdateItem, onRemoveItem, onClearCart }) {
  const items = cart?.items || [];

  return (
    <section className="space-y-6">
      <SectionTitle
        eyebrow="Cart"
        title="Coșul tău"
        subtitle="Gestionează rapid produsele selectate."
        action={
          <button
            onClick={onClearCart}
            className="rounded-2xl bg-rose-500/10 px-4 py-3 font-medium text-rose-200"
          >
            Golește coșul
          </button>
        }
      />

      {items.length === 0 ? (
        <Card className="p-10 text-center">
          <Package className="mx-auto mb-3 text-slate-500" size={42} />
          <p className="text-slate-400">Coșul este gol.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <Card
              key={item.id}
              className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <div className="text-lg font-semibold text-white">
                  Product ID: {item.product_id}
                </div>
                <div className="mt-1 text-sm text-slate-400">
                  Item ID: {item.id}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() =>
                    onUpdateItem(item.id, Math.max(0, item.quantity - 1))
                  }
                  className="rounded-2xl border border-slate-700 bg-slate-800 p-3 text-slate-200"
                >
                  <Minus size={16} />
                </button>
                <span className="min-w-8 text-center font-bold text-white">
                  {item.quantity}
                </span>
                <button
                  onClick={() => onUpdateItem(item.id, item.quantity + 1)}
                  className="rounded-2xl border border-slate-700 bg-slate-800 p-3 text-slate-200"
                >
                  <Plus size={16} />
                </button>
                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="rounded-2xl bg-rose-500/10 p-3 text-rose-200"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}

function OrderView({ onCreateOrder, orderResult, onPayOrder }) {
  return (
    <section className="space-y-6">
      <Card className="p-6">
        <h2 className="text-3xl font-black text-white">Order Control</h2>
        <p className="mt-2 text-slate-400">
          Creează comanda și trimite plata din interfață.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={onCreateOrder}
            className="rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 px-5 py-3 font-semibold text-white"
          >
            Creează comandă
          </button>

          {orderResult?.id && (
            <button
              onClick={() => onPayOrder(orderResult.id)}
              className="rounded-2xl bg-emerald-500/10 px-5 py-3 font-semibold text-emerald-200"
            >
              Marchează plata
            </button>
          )}
        </div>
      </Card>

      {orderResult && (
        <Card className="p-6">
          <h3 className="mb-4 text-xl font-bold text-white">Răspuns backend</h3>
          <pre className="overflow-x-auto rounded-2xl border border-slate-700 bg-slate-950/60 p-4 text-sm text-slate-300">
            {JSON.stringify(orderResult, null, 2)}
          </pre>
        </Card>
      )}
    </section>
  );
}

function AdminProductEditor({
  form,
  setForm,
  editingId,
  onSubmit,
  onCancelEdit,
}) {
  return (
    <Card className="p-6">
      <h2 className="text-3xl font-black text-white">
        {editingId ? "Edit Product" : "Admin Console"}
      </h2>
      <p className="mt-2 text-slate-400">
        Creezi, actualizezi și adaugi mai multe imagini la produse.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <input
          placeholder="Nume produs"
          value={form.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          className="rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-white outline-none"
        />

        <input
          placeholder="Categorie"
          value={form.category}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, category: e.target.value }))
          }
          className="rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-white outline-none"
        />

        <input
          placeholder="Preț"
          type="number"
          value={form.price}
          onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
          className="rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-white outline-none"
        />

        <input
          placeholder="Stoc"
          type="number"
          value={form.stock}
          onChange={(e) => setForm((prev) => ({ ...prev, stock: e.target.value }))}
          className="rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-white outline-none"
        />

        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              images: Array.from(e.target.files || []),
            }))
          }
          className="rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-white outline-none md:col-span-2"
        />

        <label className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-white md:col-span-2">
          <input
            type="checkbox"
            checked={form.is_featured}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, is_featured: e.target.checked }))
            }
          />
          Produs evidențiat
        </label>

        <textarea
          placeholder="Descriere"
          value={form.description}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, description: e.target.value }))
          }
          className="min-h-32 rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-white outline-none md:col-span-2"
        />
      </div>

      {form.images?.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-3">
          {form.images.map((file, index) => (
            <div
              key={index}
              className="rounded-2xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-300"
            >
              {file.name}
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          onClick={onSubmit}
          className="rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 px-5 py-3 font-semibold text-white"
        >
          {editingId ? "Update produs" : "Creează produs"}
        </button>

        {editingId && (
          <button
            onClick={onCancelEdit}
            className="rounded-2xl border border-slate-700 bg-slate-800 px-5 py-3 font-semibold text-slate-200"
          >
            Renunță
          </button>
        )}
      </div>
    </Card>
  );
}

function AdminProductsTable({
  products,
  onEdit,
  onDelete,
  onDeleteImage,
  onSetPrimaryImage,
  onSetFeatured,
}) {
  return (
    <div className="space-y-4">
      {products.map((product) => {
        const primaryImage =
          product.images?.find((img) => img.is_primary) || product.images?.[0];

        return (
          <Card key={product.id} className="p-5">
            <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
              <div>
                <div className="overflow-hidden rounded-3xl bg-slate-950/40">
                  <img
                    src={
                      primaryImage?.image_url
                        ? `${FILE_BASE}${primaryImage.image_url}`
                        : "https://placehold.co/600x400?text=No+Image"
                    }
                    alt={product.name}
                    className="h-56 w-full object-cover"
                  />
                </div>
              </div>

              <div>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <div className="inline-flex rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-300">
                        {product.category}
                      </div>
                      {product.is_featured && (
                        <div className="inline-flex rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-200">
                          Evidențiat
                        </div>
                      )}
                    </div>
                    <h3 className="text-2xl font-bold text-white">
                      {product.name}
                    </h3>
                    <p className="mt-2 text-slate-400">{product.description}</p>
                    <div className="mt-3 text-lg font-semibold text-white">
                      {product.price} RON
                    </div>
                    <div className="mt-1 text-sm text-slate-400">
                      Stock: {product.stock}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => onEdit(product)}
                      className="flex items-center gap-2 rounded-2xl bg-blue-500/10 px-4 py-3 text-blue-300"
                    >
                      <Pencil size={16} />
                      Edit
                    </button>

                    <button
                      onClick={() => onSetFeatured(product.id, !product.is_featured)}
                      className={cn(
                        "flex items-center gap-2 rounded-2xl px-4 py-3",
                        product.is_featured
                          ? "bg-amber-500/10 text-amber-200"
                          : "bg-slate-800 text-slate-200"
                      )}
                    >
                      <Star size={16} />
                      {product.is_featured ? "Unfeature" : "Feature"}
                    </button>

                    <button
                      onClick={() => onDelete(product.id)}
                      className="flex items-center gap-2 rounded-2xl bg-rose-500/10 px-4 py-3 text-rose-200"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>

                <div className="mt-5">
                  <div className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Images
                  </div>

                  {product.images?.length ? (
                    <div className="flex flex-wrap gap-4">
                      {product.images.map((img) => (
                        <div
                          key={img.id}
                          className="rounded-3xl border border-slate-700 bg-slate-950/50 p-3"
                        >
                          <img
                            src={`${FILE_BASE}${img.image_url}`}
                            alt="product"
                            className="h-24 w-24 rounded-2xl object-cover"
                          />
                          <div className="mt-3 flex flex-col gap-2">
                            <button
                              onClick={() =>
                                onSetPrimaryImage(product.id, img.id)
                              }
                              className={cn(
                                "flex items-center justify-center gap-2 rounded-2xl px-3 py-2 text-xs font-medium",
                                img.is_primary
                                  ? "bg-amber-500/10 text-amber-200"
                                  : "border border-slate-700 bg-slate-900 text-slate-300"
                              )}
                            >
                              <Star size={14} />
                              {img.is_primary ? "Primary" : "Set primary"}
                            </button>

                            <button
                              onClick={() => onDeleteImage(product.id, img.id)}
                              className="rounded-2xl bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-200"
                            >
                              Delete image
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-slate-400">No images</div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function AdminView({
  products,
  form,
  setForm,
  editingId,
  onCreateProduct,
  onUpdateProduct,
  onStartEdit,
  onCancelEdit,
  onDeleteProduct,
  onDeleteImage,
  onSetPrimaryImage,
  onSetFeatured,
  adminSearch,
  setAdminSearch,
  adminSort,
  setAdminSort,
}) {
  const filteredAdminProducts = [...products]
    .filter((product) => {
      const q = adminSearch.toLowerCase();

      return (
        product.name.toLowerCase().includes(q) ||
        product.category.toLowerCase().includes(q) ||
        (product.description || "").toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (adminSort === "name") return a.name.localeCompare(b.name);
      if (adminSort === "stock") return b.stock - a.stock;
      if (adminSort === "price") return b.price - a.price;
      return 0;
    });

  return (
    <section className="space-y-6">
      <AdminProductEditor
        form={form}
        setForm={setForm}
        editingId={editingId}
        onSubmit={editingId ? onUpdateProduct : onCreateProduct}
        onCancelEdit={onCancelEdit}
      />

      <Card className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-xl font-bold text-white">Caută în produse</h3>
            <p className="mt-1 text-sm text-slate-400">
              Caută rapid după nume, categorie sau descriere.
            </p>
          </div>

          <div className="flex flex-col gap-3 md:flex-row">
            <div className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-300 shadow-sm md:min-w-[360px]">
              <Search size={18} />
              <input
                value={adminSearch}
                onChange={(e) => setAdminSearch(e.target.value)}
                placeholder="Ex: laptop, haine, mouse..."
                className="w-full bg-transparent outline-none placeholder:text-slate-500"
              />
            </div>

            <div className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-300 shadow-sm">
              <SlidersHorizontal size={18} />
              <select
                value={adminSort}
                onChange={(e) => setAdminSort(e.target.value)}
                className="bg-transparent outline-none"
              >
                <option value="name" className="bg-slate-900">Sort: Nume</option>
                <option value="stock" className="bg-slate-900">Sort: Stock</option>
                <option value="price" className="bg-slate-900">Sort: Preț</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      <AdminProductsTable
        products={filteredAdminProducts}
        onEdit={onStartEdit}
        onDelete={onDeleteProduct}
        onDeleteImage={onDeleteImage}
        onSetPrimaryImage={onSetPrimaryImage}
        onSetFeatured={onSetFeatured}
      />
    </section>
  );
}

function Footer() {
  return (
    <footer className="mt-12 border-t border-slate-800 bg-slate-950">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 md:grid-cols-4">
        <div>
          <div className="text-xs uppercase tracking-[0.24em] text-blue-400">
            Marketplace
          </div>
          <h3 className="mt-2 text-xl font-black text-white">K3s Demo Store</h3>
          <p className="mt-3 text-sm text-slate-400">
            Frontend React + backend Go pentru un proiect de licență tip e-commerce.
          </p>
        </div>

        <div>
          <h4 className="font-semibold text-white">Catalog</h4>
          <div className="mt-3 space-y-2 text-sm text-slate-400">
            <div>Produse</div>
            <div>Categorii</div>
            <div>Featured items</div>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-white">Platformă</h4>
          <div className="mt-3 space-y-2 text-sm text-slate-400">
            <div>Docker local</div>
            <div>k3s deployment</div>
            <div>Admin dashboard</div>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-white">Tehnologii</h4>
          <div className="mt-3 space-y-2 text-sm text-slate-400">
            <div>React</div>
            <div>Go + Gin</div>
            <div>PostgreSQL</div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [authMode, setAuthMode] = useState("login");
  const [activeTab, setActiveTab] = useState("products");
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({ items: [] });
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [orderResult, setOrderResult] = useState(null);
  const [search, setSearch] = useState("");
  const [globalSearch, setGlobalSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editingProductId, setEditingProductId] = useState(null);
  const [adminSearch, setAdminSearch] = useState("");
  const [adminSort, setAdminSort] = useState("name");
  const [adminForm, setAdminForm] = useState({
    name: "",
    description: "",
    category: "",
    price: "",
    stock: "",
    is_featured: false,
    images: [],
  });

  const claims = useMemo(() => (token ? parseJwt(token) : null), [token]);
  const role = claims?.role || "user";
  const cartCount = (cart?.items || []).reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const displaySearch = globalSearch || search;

  const shownProducts = useMemo(() => {
    if (!displaySearch) return products;
    return products.filter((product) => {
      const q = displaySearch.toLowerCase();
      return (
        product.name.toLowerCase().includes(q) ||
        product.category.toLowerCase().includes(q) ||
        (product.description || "").toLowerCase().includes(q)
      );
    });
  }, [products, displaySearch]);

  const showMessage = (text, type = "info") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3500);
  };

  const resetAdminForm = () => {
    setEditingProductId(null);
    setAdminForm({
      name: "",
      description: "",
      category: "",
      price: "",
      stock: "",
      is_featured: false,
      images: [],
    });
  };

  const loadProducts = async () => {
    try {
      const data = await apiFetch("/products");
      const normalized = (Array.isArray(data) ? data : []).map(normalizeProduct);
      setProducts(normalized);

      if (selectedProduct) {
        const refreshed = normalized.find((p) => p.id === selectedProduct.id);
        if (refreshed) setSelectedProduct(refreshed);
      }
    } catch (error) {
      showMessage(error.message, "error");
    }
  };

  const loadCart = async () => {
    if (!token) {
      setCart({ items: [] });
      return;
    }

    try {
      const data = await apiFetch("/cart", {}, token);
      setCart(normalizeCart(data));
    } catch {
      setCart({ items: [] });
    }
  };

  useEffect(() => {
    if (token) {
      loadProducts();
      loadCart();
    }
  }, [token]);

  useEffect(() => {
    if (globalSearch) {
      setSearch(globalSearch);
      setCategory("all");
      setActiveTab("products");
      setSelectedProduct(null);
    }
  }, [globalSearch]);

  const handleRegister = async (form) => {
    try {
      setLoading(true);
      await apiFetch("/register", {
        method: "POST",
        body: JSON.stringify(form),
      });
      showMessage("Cont creat. Acum te poți loga.", "success");
      setAuthMode("login");
    } catch (error) {
      showMessage(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (form) => {
    try {
      setLoading(true);
      const data = await apiFetch("/login", {
        method: "POST",
        body: JSON.stringify(form),
      });
      localStorage.setItem("token", data.token);
      setToken(data.token);
      setActiveTab("products");
      showMessage("Login reușit.", "success");
    } catch (error) {
      showMessage(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken("");
    setProducts([]);
    setCart({ items: [] });
    setOrderResult(null);
    setSearch("");
    setGlobalSearch("");
    setCategory("all");
    setSelectedProduct(null);
    resetAdminForm();
    setAdminSearch("");
    setAuthMode("login");
  };

  const handleAddToCart = async (productId, quantity) => {
    try {
      await apiFetch(
        "/cart",
        {
          method: "POST",
          body: JSON.stringify({
            product_id: productId,
            quantity: Number(quantity),
          }),
        },
        token
      );
      await loadCart();
      showMessage("Produs adăugat în coș.", "success");
    } catch (error) {
      showMessage(error.message, "error");
    }
  };

  const handleUpdateCartItem = async (itemId, quantity) => {
    try {
      await apiFetch(
        `/cart/${itemId}`,
        {
          method: "PUT",
          body: JSON.stringify({ quantity }),
        },
        token
      );
      await loadCart();
      showMessage("Coș actualizat.", "success");
    } catch (error) {
      showMessage(error.message, "error");
    }
  };

  const handleRemoveCartItem = async (itemId) => {
    try {
      await apiFetch(`/cart/${itemId}`, { method: "DELETE" }, token);
      await loadCart();
      showMessage("Produs șters din coș.", "success");
    } catch (error) {
      showMessage(error.message, "error");
    }
  };

  const handleClearCart = async () => {
    try {
      await apiFetch("/cart", { method: "DELETE" }, token);
      await loadCart();
      showMessage("Coș golit.", "success");
    } catch (error) {
      showMessage(error.message, "error");
    }
  };

  const handleCreateOrder = async () => {
    try {
      const data = await apiFetch("/orders", { method: "POST" }, token);
      setOrderResult(data);
      showMessage("Comandă creată.", "success");
      setActiveTab("orders");
    } catch (error) {
      showMessage(error.message, "error");
    }
  };

  const handlePayOrder = async (orderId) => {
    try {
      const data = await apiFetch(`/orders/${orderId}/pay`, { method: "POST" }, token);
      setOrderResult(data);
      showMessage("Plată marcată.", "success");
    } catch (error) {
      showMessage(error.message, "error");
    }
  };

  const handleCreateProduct = async () => {
    try {
      const formData = new FormData();
      formData.append("name", adminForm.name);
      formData.append("description", adminForm.description);
      formData.append("category", adminForm.category);
      formData.append("price", adminForm.price);
      formData.append("stock", adminForm.stock);
      formData.append("is_featured", String(adminForm.is_featured));

      adminForm.images.forEach((file) => {
        formData.append("images", file);
      });

      await apiFetch(
        "/admin/products",
        {
          method: "POST",
          body: formData,
        },
        token
      );

      resetAdminForm();
      await loadProducts();
      showMessage("Produs creat cu succes.", "success");
    } catch (error) {
      showMessage(error.message, "error");
    }
  };

  const handleStartEdit = (product) => {
    setEditingProductId(product.id);
    setAdminForm({
      name: product.name,
      description: product.description,
      category: product.category,
      price: String(product.price),
      stock: String(product.stock),
      is_featured: product.is_featured ?? false,
      images: [],
    });
    setActiveTab("admin");
  };

  const handleCancelEdit = () => {
    resetAdminForm();
  };

  const handleUpdateProduct = async () => {
    try {
      const formData = new FormData();
      formData.append("name", adminForm.name);
      formData.append("description", adminForm.description);
      formData.append("category", adminForm.category);
      formData.append("price", adminForm.price);
      formData.append("stock", adminForm.stock);
      formData.append("is_featured", String(adminForm.is_featured));

      adminForm.images.forEach((file) => {
        formData.append("images", file);
      });

      await apiFetch(
        `/admin/products/${editingProductId}`,
        {
          method: "PUT",
          body: formData,
        },
        token
      );

      resetAdminForm();
      await loadProducts();
      showMessage("Produs actualizat.", "success");
    } catch (error) {
      showMessage(error.message, "error");
    }
  };

  const handleSetFeatured = async (productId, value) => {
    try {
      await apiFetch(
        `/admin/products/${productId}/featured`,
        {
          method: "PUT",
          body: JSON.stringify({ is_featured: value }),
        },
        token
      );

      await loadProducts();
      showMessage(
        value ? "Produs marcat ca evidențiat." : "Produs scos din evidențiate.",
        "success"
      );
    } catch (error) {
      showMessage(error.message, "error");
    }
  };

  const handleDeleteProduct = async (productId) => {
    try {
      await apiFetch(`/admin/products/${productId}`, { method: "DELETE" }, token);
      if (selectedProduct?.id === productId) setSelectedProduct(null);
      resetAdminForm();
      await loadProducts();
      showMessage("Produs șters.", "success");
    } catch (error) {
      showMessage(error.message, "error");
    }
  };

  const handleDeleteImage = async (productId, imageId) => {
    try {
      await apiFetch(
        `/admin/products/${productId}/images/${imageId}`,
        { method: "DELETE" },
        token
      );
      await loadProducts();
      showMessage("Imagine ștearsă.", "success");
    } catch (error) {
      showMessage(error.message, "error");
    }
  };

  const handleSetPrimaryImage = async (productId, imageId) => {
    try {
      await apiFetch(
        `/admin/products/${productId}/images/${imageId}/primary`,
        { method: "PUT" },
        token
      );
      await loadProducts();
      showMessage("Imagine principală actualizată.", "success");
    } catch (error) {
      showMessage(error.message, "error");
    }
  };

  if (!token) {
    return (
      <AuthScreen
        mode={authMode}
        onModeChange={setAuthMode}
        onLogin={handleLogin}
        onRegister={handleRegister}
        loading={loading}
        message={message}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100">
      <MarketplaceHeader
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab !== "products") setSelectedProduct(null);
        }}
        role={role}
        cartCount={cartCount}
        onLogout={handleLogout}
        globalSearch={globalSearch}
        setGlobalSearch={setGlobalSearch}
      />

      <main className="mx-auto max-w-7xl px-6 py-8">
        <Message message={message} />

        <div className="space-y-10">
          {activeTab === "products" && !selectedProduct && (
            <>
              <HeroSection onBrowse={() => setActiveTab("products")} />
              <FeaturedProducts
                products={shownProducts}
                setSelectedProduct={setSelectedProduct}
              />
            </>
          )}

          {activeTab === "products" &&
            (selectedProduct ? (
              <ProductDetailsView
                product={selectedProduct}
                onBack={() => setSelectedProduct(null)}
                onAddToCart={handleAddToCart}
              />
            ) : (
              <ProductsView
                products={shownProducts}
                token={token}
                onAddToCart={handleAddToCart}
                search={search}
                setSearch={setSearch}
                category={category}
                setCategory={setCategory}
                setSelectedProduct={setSelectedProduct}
              />
            ))}

          {activeTab === "cart" && (
            <CartView
              cart={cart}
              onUpdateItem={handleUpdateCartItem}
              onRemoveItem={handleRemoveCartItem}
              onClearCart={handleClearCart}
            />
          )}

          {activeTab === "orders" && (
            <OrderView
              onCreateOrder={handleCreateOrder}
              orderResult={orderResult}
              onPayOrder={handlePayOrder}
            />
          )}

          {activeTab === "admin" && role === "admin" && (
            <AdminView
              products={products}
              form={adminForm}
              setForm={setAdminForm}
              editingId={editingProductId}
              onCreateProduct={handleCreateProduct}
              onUpdateProduct={handleUpdateProduct}
              onStartEdit={handleStartEdit}
              onCancelEdit={handleCancelEdit}
              onDeleteProduct={handleDeleteProduct}
              onDeleteImage={handleDeleteImage}
              onSetPrimaryImage={handleSetPrimaryImage}
              onSetFeatured={handleSetFeatured}
              adminSearch={adminSearch}
              setAdminSearch={setAdminSearch}
              adminSort={adminSort}
              setAdminSort={setAdminSort}
            />
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}