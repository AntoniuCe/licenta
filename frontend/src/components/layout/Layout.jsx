import React from "react";
import { ArrowRight, LogOut, Search, ShoppingBag } from "lucide-react";
import { Card } from "../common/UI";
import { cn } from "../../utils/helpers";

export function MarketplaceHeader({
  activeTab,
  onTabChange,
  role,
  cartCount,
  onLogout,
  onOpenAuth,
  globalSearch,
  setGlobalSearch,
  isAuthenticated,
}) {
  const tabs = [
    { key: "products", label: "Produse" },
    ...(isAuthenticated ? [{ key: "cart", label: `Coș ${cartCount ? `(${cartCount})` : ""}` }] : []),
    ...(isAuthenticated ? [{ key: "orders", label: "Comenzi" }] : []),
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
              <div className="text-xs uppercase tracking-[0.28em] text-blue-400">Marketplace</div>
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
                onClick={() => onTabChange(tab.key)}
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

            {isAuthenticated ? (
              <button
                onClick={onLogout}
                className="ml-1 inline-flex items-center gap-2 rounded-2xl bg-rose-900/30 px-4 py-2 text-sm font-medium text-rose-200 transition hover:bg-rose-900/50"
              >
                <LogOut size={16} /> Logout
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="ml-1 rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                Login / Register
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export function HeroSection({ onBrowse, onOpenAuth, isAuthenticated }) {
  return (
    <section className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
      <Card className="relative overflow-hidden p-8 md:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.10),transparent_25%),radial-gradient(circle_at_bottom_right,rgba(99,102,241,0.10),transparent_25%)]" />
        <div className="relative">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-sm text-blue-300">
            Featured marketplace design
          </div>

          <h2 className="max-w-3xl text-4xl font-black leading-tight text-white md:text-6xl">
            Discover products
            <span className="block bg-gradient-to-r from-blue-400 via-indigo-400 to-sky-400 bg-clip-text text-transparent">
              fără login obligatoriu.
            </span>
          </h2>

          <p className="mt-4 max-w-2xl text-lg text-slate-300">
            Vizitatorii văd catalogul direct. Login-ul rămâne disponibil pentru coș,
            comenzi și panoul de administrare.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={onBrowse}
              className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white"
            >
              Vezi produse
              <ArrowRight size={18} />
            </button>

            {!isAuthenticated && (
              <button
                onClick={onOpenAuth}
                className="rounded-2xl border border-slate-700 bg-slate-950/60 px-5 py-3 text-sm text-slate-300"
              >
                Intră în cont
              </button>
            )}
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
            Public shop → Login → Cart / Orders → Admin
          </div>
        </Card>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950/80">
      <div className="mx-auto max-w-7xl px-6 py-10 text-sm text-slate-400">
        <div className="flex flex-col justify-between gap-3 md:flex-row">
          <div>
            <div className="font-semibold text-white">K3s Demo Store</div>
            <div>Refactorizat pe foldere: components, pages, lib, utils.</div>
          </div>
          <div>React + Go + PostgreSQL</div>
        </div>
      </div>
    </footer>
  );
}
