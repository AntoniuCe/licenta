import React, { useCallback, useEffect, useState } from "react";
import { apiFetch, API_BASE, FILE_BASE } from "../lib/api";
import { normalizeCart, normalizeProduct, parseJwt } from "../utils/helpers";
import AuthScreen from "../components/auth/AuthScreen";
import { AdminView } from "../components/admin/AdminViews";
import { CartView, OrderView } from "../components/cart/CartViews";
import { ProductsView, ProductDetailsView, FeaturedCarousel } from "../components/products/ProductViews";
import { MarketplaceHeader, HeroSection, Footer } from "../components/layout/Layout";

const EMPTY_FORM = {
  name: "", description: "", category: "", price: "", stock: "",
  images: [], is_featured: false,
};

export default function MarketplacePage() {
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [role, setRole] = useState(() => {
    const t = localStorage.getItem("token");
    return t ? (parseJwt(t)?.role || "") : "";
  });
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem("token"));
  const [activeTab, setActiveTab] = useState("products");
  const [authMode, setAuthMode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [globalSearch, setGlobalSearch] = useState("");

  // Products
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  // Cart
  const [cart, setCart] = useState(null);

  // Orders
  const [orderResult, setOrderResult] = useState(null);
  const [orders, setOrders] = useState([]);

  // Admin
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [adminSearch, setAdminSearch] = useState("");
  const [adminSort, setAdminSort] = useState("name");
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersSearch, setUsersSearch] = useState("");
  const [actingUserId, setActingUserId] = useState(null);

  const showMsg = (text, type = "info") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const api = useCallback(
    (path, opts = {}) => apiFetch(path, opts, token),
    [token]
  );

  // ── Auth ──────────────────────────────────────────────────────────────
  const applyAuth = (data) => {
    const t = data.token;
    localStorage.setItem("token", t);
    setToken(t);
    const claims = parseJwt(t);
    setRole(claims?.role || "");
    setIsAuthenticated(true);
    setAuthMode(null);
    setActiveTab("products");
    showMsg("Autentificat cu succes!", "success");
  };

  const handleLogin = async ({ email, password }) => {
    setLoading(true);
    try {
      const data = await apiFetch("/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      applyAuth(data);
    } catch (e) {
      showMsg(e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async ({ email, password }) => {
    setLoading(true);
    try {
      await apiFetch("/register", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      showMsg("Cont creat! Te poți autentifica.", "success");
      setAuthMode("login");
    } catch (e) {
      showMsg(e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = (data) => {
    applyAuth(data);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken("");
    setRole("");
    setIsAuthenticated(false);
    setCart(null);
    setOrders([]);
    setActiveTab("products");
    showMsg("Te-ai deconectat.", "info");
  };

  // ── Products ──────────────────────────────────────────────────────────
  const fetchProducts = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (globalSearch) params.set("search", globalSearch);
      if (category && category !== "all") params.set("category", category);
      const data = await apiFetch(`/products${params.toString() ? "?" + params : ""}`);
      setProducts((data || []).map(normalizeProduct));
    } catch (e) {
      showMsg("Nu am putut încărca produsele.", "error");
    }
  }, [globalSearch, category]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // ── Cart ──────────────────────────────────────────────────────────────
  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await api("/cart");
      setCart(normalizeCart(data));
    } catch { }
  }, [api, isAuthenticated]);

  useEffect(() => { if (isAuthenticated) fetchCart(); }, [fetchCart, isAuthenticated]);

  const handleAddToCart = async (productId, quantity = 1) => {
    try {
      await api("/cart", {
        method: "POST",
        body: JSON.stringify({ product_id: productId, quantity }),
      });
      await fetchCart();
      showMsg("Adăugat în coș!", "success");
    } catch (e) {
      showMsg(e.message, "error");
    }
  };

  const handleUpdateCartItem = async (itemId, quantity) => {
    try {
      await api(`/cart/${itemId}`, {
        method: "PUT",
        body: JSON.stringify({ quantity }),
      });
      await fetchCart();
    } catch (e) {
      showMsg(e.message, "error");
    }
  };

  const handleRemoveCartItem = async (itemId) => {
    try {
      await api(`/cart/${itemId}`, { method: "DELETE" });
      await fetchCart();
    } catch (e) {
      showMsg(e.message, "error");
    }
  };

  const handleClearCart = async () => {
    try {
      await api("/cart", { method: "DELETE" });
      await fetchCart();
    } catch (e) {
      showMsg(e.message, "error");
    }
  };

  // ── Orders ────────────────────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await api("/orders");
      setOrders(data || []);
    } catch { }
  }, [api, isAuthenticated]);

  useEffect(() => { if (isAuthenticated) fetchOrders(); }, [fetchOrders, isAuthenticated]);

  const handleCreateOrder = async () => {
    try {
      const data = await api("/orders", { method: "POST" });
      setOrderResult(data);
      await fetchCart();
      await fetchOrders();
      showMsg("Comandă creată cu succes!", "success");
    } catch (e) {
      showMsg(e.message, "error");
    }
  };

  const handlePayOrder = async (orderId, cardDetails) => {
    try {
      await api(`/orders/${orderId}/pay`, {
        method: "POST",
        body: JSON.stringify({ method: "card", ...cardDetails }),
      });
      // Clear cart state immediately so the UI empties out
      setCart({ id: null, user_id: null, items: [] });
      setOrderResult(null);
      // Refresh both orders and cart from server
      await Promise.all([fetchOrders(), fetchCart()]);
      showMsg("Plată procesată! Verifică emailul pentru confirmare.", "success");
    } catch (e) {
      showMsg(e.message, "error");
    }
  };

  // ── Admin ─────────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    if (role !== "admin") return;
    setUsersLoading(true);
    try {
      const data = await api("/admin/users");
      setUsers(data || []);
    } catch { } finally {
      setUsersLoading(false);
    }
  }, [api, role]);

  useEffect(() => { if (role === "admin") fetchUsers(); }, [fetchUsers, role]);

  const handleCreateProduct = async () => {
    try {
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("description", form.description);
      fd.append("category", form.category);
      fd.append("price", form.price);
      fd.append("stock", form.stock);
      fd.append("is_featured", form.is_featured ? "true" : "false");
      form.images.forEach((f) => fd.append("images", f));
      await api("/admin/products", { method: "POST", body: fd });
      setForm(EMPTY_FORM);
      await fetchProducts();
      showMsg("Produs creat!", "success");
    } catch (e) {
      showMsg(e.message, "error");
    }
  };

  const handleUpdateProduct = async () => {
    try {
      const fd = new FormData();
      if (form.name) fd.append("name", form.name);
      if (form.description) fd.append("description", form.description);
      if (form.category) fd.append("category", form.category);
      if (form.price) fd.append("price", form.price);
      if (form.stock) fd.append("stock", form.stock);
      fd.append("is_featured", form.is_featured ? "true" : "false");
      form.images.forEach((f) => fd.append("images", f));
      await api(`/admin/products/${editingId}`, { method: "PUT", body: fd });
      setForm(EMPTY_FORM);
      setEditingId(null);
      await fetchProducts();
      showMsg("Produs actualizat!", "success");
    } catch (e) {
      showMsg(e.message, "error");
    }
  };

  const handleStartEdit = (product) => {
    setForm({
      name: product.name, description: product.description,
      category: product.category, price: String(product.price),
      stock: String(product.stock), images: [],
      is_featured: product.is_featured,
    });
    setEditingId(product.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm("Ștergi produsul?")) return;
    try {
      await api(`/admin/products/${id}`, { method: "DELETE" });
      await fetchProducts();
      showMsg("Produs șters.", "info");
    } catch (e) {
      showMsg(e.message, "error");
    }
  };

  const handleDeleteImage = async (productId, imageId) => {
    try {
      await api(`/admin/products/${productId}/images/${imageId}`, { method: "DELETE" });
      await fetchProducts();
    } catch (e) {
      showMsg(e.message, "error");
    }
  };

  const handleSetPrimaryImage = async (productId, imageId) => {
    try {
      await api(`/admin/products/${productId}/images/${imageId}/primary`, { method: "PUT" });
      await fetchProducts();
    } catch (e) {
      showMsg(e.message, "error");
    }
  };

  const handleSetFeatured = async (productId, isFeatured) => {
    try {
      await api(`/admin/products/${productId}/featured`, {
        method: "PUT",
        body: JSON.stringify({ is_featured: isFeatured }),
      });
      await fetchProducts();
      showMsg(isFeatured ? "Produs evidențiat!" : "Evidențiere eliminată.", "success");
    } catch (e) {
      showMsg(e.message, "error");
    }
  };

  const handlePromoteUser = async (userId) => {
    setActingUserId(userId);
    try {
      await api(`/admin/users/${userId}/role`, {
        method: "PUT",
        body: JSON.stringify({ role: "admin" }),
      });
      await fetchUsers();
    } catch (e) {
      showMsg(e.message, "error");
    } finally {
      setActingUserId(null);
    }
  };

  const handleDemoteUser = async (userId) => {
    setActingUserId(userId);
    try {
      await api(`/admin/users/${userId}/role`, {
        method: "PUT",
        body: JSON.stringify({ role: "user" }),
      });
      await fetchUsers();
    } catch (e) {
      showMsg(e.message, "error");
    } finally {
      setActingUserId(null);
    }
  };

  const cartCount = cart?.items?.reduce((s, i) => s + i.quantity, 0) || 0;

  // ── Auth screen ───────────────────────────────────────────────────────
  if (authMode) {
    return (
      <AuthScreen
        mode={authMode}
        onModeChange={setAuthMode}
        onLogin={handleLogin}
        onRegister={handleRegister}
        onGoogleSuccess={handleGoogleSuccess}
        loading={loading}
        message={message}
        onCancel={() => setAuthMode(null)}
      />
    );
  }

  const featuredProducts = products.filter((p) => p.is_featured);

  return (
    <div className="min-h-screen bg-[#080d16] text-slate-100">
      <MarketplaceHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        role={role}
        cartCount={cartCount}
        onLogout={handleLogout}
        onOpenAuth={() => setAuthMode("login")}
        globalSearch={globalSearch}
        setGlobalSearch={setGlobalSearch}
        isAuthenticated={isAuthenticated}
      />

      {message && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-sm font-medium shadow-xl border backdrop-blur-xl
          ${message.type === "success" ? "bg-emerald-500/20 border-emerald-400/30 text-emerald-200" :
            message.type === "error" ? "bg-rose-500/20 border-rose-400/30 text-rose-200" :
            "bg-blue-500/20 border-blue-400/30 text-blue-200"}`}>
          {message.text}
        </div>
      )}

      <main className="mx-auto max-w-7xl px-6 py-10 space-y-10">
        {activeTab === "products" && (
          <>
            {!selectedProduct && featuredProducts.length > 0 && (
              <FeaturedCarousel
                products={featuredProducts}
                onSelect={setSelectedProduct}
                isAuthenticated={isAuthenticated}
                onAddToCart={handleAddToCart}
                onRequireAuth={() => setAuthMode("login")}
              />
            )}
            {selectedProduct ? (
              <ProductDetailsView
                product={selectedProduct}
                isAuthenticated={isAuthenticated}
                onBack={() => setSelectedProduct(null)}
                onAddToCart={handleAddToCart}
                onRequireAuth={() => setAuthMode("login")}
              />
            ) : (
              <ProductsView
                products={products}
                isAuthenticated={isAuthenticated}
                onAddToCart={handleAddToCart}
                onRequireAuth={() => setAuthMode("login")}
                search={search}
                setSearch={setSearch}
                category={category}
                setCategory={setCategory}
                setSelectedProduct={setSelectedProduct}
              />
            )}
          </>
        )}

        {activeTab === "cart" && isAuthenticated && (
          <CartView
            cart={cart}
            products={products}
            onUpdateItem={handleUpdateCartItem}
            onRemoveItem={handleRemoveCartItem}
            onClearCart={handleClearCart}
            onCreateOrder={handleCreateOrder}
            onPayOrder={handlePayOrder}
            orderResult={orderResult}
            orders={orders}
          />
        )}

        {activeTab === "orders" && isAuthenticated && (
          <OrderView
            orders={orders}
            onPayOrder={handlePayOrder}
          />
        )}

        {activeTab === "admin" && role === "admin" && (
          <AdminView
            products={products}
            form={form}
            setForm={setForm}
            editingId={editingId}
            onCreateProduct={handleCreateProduct}
            onUpdateProduct={handleUpdateProduct}
            onStartEdit={handleStartEdit}
            onCancelEdit={() => { setEditingId(null); setForm(EMPTY_FORM); }}
            onDeleteProduct={handleDeleteProduct}
            onDeleteImage={handleDeleteImage}
            onSetPrimaryImage={handleSetPrimaryImage}
            onSetFeatured={handleSetFeatured}
            adminSearch={adminSearch}
            setAdminSearch={setAdminSearch}
            adminSort={adminSort}
            setAdminSort={setAdminSort}
            users={users}
            onPromoteUser={handlePromoteUser}
            onDemoteUser={handleDemoteUser}
            usersLoading={usersLoading}
            usersSearch={usersSearch}
            setUsersSearch={setUsersSearch}
            actingUserId={actingUserId}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}
