import React, { useEffect, useRef, useState } from "react";
import {
  ArrowLeft, ArrowRight, ChevronLeft, ChevronRight,
  Package, Search, SlidersHorizontal, Star, ShoppingCart
} from "lucide-react";
import { FILE_BASE } from "../../lib/api";
import { Card, SectionTitle } from "../common/UI";

// ── Star rating display ───────────────────────────────────────────────────────
function StarRating({ rating, count }) {
  if (!rating) return null;
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex">
        {[1,2,3,4,5].map(i => (
          <Star key={i} size={12}
            className={i <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-slate-600 fill-slate-600"} />
        ))}
      </div>
      <span className="text-xs text-slate-400">{rating.toFixed(1)} ({count})</span>
    </div>
  );
}

// ── Featured Carousel ─────────────────────────────────────────────────────────
export function FeaturedCarousel({ products, onSelect, isAuthenticated, onAddToCart, onRequireAuth }) {
  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState(1);
  const autoRef = useRef(null);

  const go = (dir) => {
    if (isAnimating) return;
    setDirection(dir);
    setIsAnimating(true);
    setTimeout(() => {
      setCurrent(c => (c + dir + products.length) % products.length);
      setIsAnimating(false);
    }, 300);
  };

  useEffect(() => {
    autoRef.current = setInterval(() => go(1), 5000);
    return () => clearInterval(autoRef.current);
  }, [products.length, isAnimating]);

  const resetAuto = () => {
    clearInterval(autoRef.current);
    autoRef.current = setInterval(() => go(1), 5000);
  };

  const prev = () => { go(-1); resetAuto(); };
  const next = () => { go(1); resetAuto(); };

  if (!products.length) return null;

  const product = products[current];
  const image = product.images?.find(i => i.is_primary) || product.images?.[0];

  return (
    <div className="relative overflow-hidden rounded-[32px] border border-slate-700/50"
      style={{ background: "linear-gradient(135deg, #0f1a2e 0%, #0a1628 100%)" }}>

      {/* Background image blur */}
      {image && (
        <div className="absolute inset-0">
          <img src={`${FILE_BASE}${image.image_url}`} alt=""
            className="w-full h-full object-cover opacity-10 scale-110 blur-2xl" />
          <div className="absolute inset-0" style={{
            background: "linear-gradient(135deg, rgba(8,13,22,0.92) 0%, rgba(8,13,22,0.75) 50%, rgba(8,13,22,0.95) 100%)"
          }} />
        </div>
      )}

      <div className="relative grid lg:grid-cols-[1fr_420px] min-h-[380px]">
        {/* Text side */}
        <div className="flex flex-col justify-center p-8 md:p-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300 w-fit mb-4">
            <Star size={12} className="fill-amber-400 text-amber-400" />
            Produs evidențiat
          </div>

          <div
            className="transition-all duration-300"
            style={{
              opacity: isAnimating ? 0 : 1,
              transform: isAnimating ? `translateX(${direction > 0 ? "-20px" : "20px"})` : "translateX(0)"
            }}
          >
            <div className="text-blue-400 text-sm font-medium mb-2">{product.category}</div>
            <h2 className="text-3xl md:text-5xl font-black text-white leading-tight mb-4">
              {product.name}
            </h2>
            <p className="text-slate-300 text-base leading-relaxed max-w-lg mb-6 line-clamp-3">
              {product.description}
            </p>

            <div className="flex items-center gap-6 mb-8">
              <div className="text-4xl font-black text-white">{product.price} <span className="text-xl text-slate-400">RON</span></div>
              <div className="text-sm text-slate-400 border-l border-slate-700 pl-6">
                <StarRating rating={product.rating} count={product.review_count} />
                <div className="mt-1">Stoc: {product.stock}</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => onSelect(product)}
                className="inline-flex items-center gap-2 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 px-5 py-3 font-semibold text-white transition-all">
                <ArrowRight size={16} />
                Vezi detalii
              </button>
              <button
                disabled={product.stock <= 0}
                onClick={() => isAuthenticated ? onAddToCart(product.id, 1) : onRequireAuth()}
                className="inline-flex items-center gap-2 rounded-2xl px-5 py-3 font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(135deg, #2563eb, #4f46e5)" }}>
                <ShoppingCart size={16} />
                {isAuthenticated ? "Adaugă în coș" : "Login pentru coș"}
              </button>
            </div>
          </div>
        </div>

        {/* Image side */}
        <div className="hidden lg:flex items-center justify-center p-8">
          <div
            className="w-full max-w-sm aspect-square rounded-3xl overflow-hidden border border-white/10 bg-slate-950/60 transition-all duration-300"
            style={{
              opacity: isAnimating ? 0 : 1,
              transform: isAnimating ? "scale(0.95)" : "scale(1)"
            }}
          >
            <img
              src={image ? `${FILE_BASE}${image.image_url}` : "https://placehold.co/600x600?text=No+Image"}
              alt={product.name}
              className="w-full h-full object-contain p-6"
            />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-6 left-8 md:left-12 flex items-center gap-4">
        <button onClick={prev}
          className="w-9 h-9 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all">
          <ChevronLeft size={16} />
        </button>
        <div className="flex gap-2">
          {products.map((_, i) => (
            <button key={i} onClick={() => { setCurrent(i); resetAuto(); }}
              className={`rounded-full transition-all ${i === current
                ? "w-6 h-2 bg-white"
                : "w-2 h-2 bg-white/30 hover:bg-white/50"}`} />
          ))}
        </div>
        <button onClick={next}
          className="w-9 h-9 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all">
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="absolute top-4 right-4 text-xs text-slate-500 font-mono">
        {current + 1} / {products.length}
      </div>
    </div>
  );
}

// ── Product gallery (detail view) ─────────────────────────────────────────────
function ProductGallery({ images = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentImage = images[currentIndex];

  return (
    <div className="space-y-3">
        <Card className="overflow-hidden p-0">
      <div className="aspect-[4/3] w-full bg-slate-950/60">
        <img
          src={currentImage?.image_url ? `${FILE_BASE}${currentImage.image_url}` : "https://placehold.co/1000x700?text=No+Image"}
          alt="product"
          className="w-full h-full object-contain p-6"
        />
      </div>
    </Card>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, index) => (
            <button key={img.id || index} onClick={() => setCurrentIndex(index)}
              className={`overflow-hidden rounded-2xl border-2 shrink-0 transition-colors ${currentIndex === index ? "border-blue-500" : "border-slate-700"}`}>
              <img src={`${FILE_BASE}${img.image_url}`} alt={`thumb-${index}`}
                className="h-16 w-16 object-contain p-1" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Product card ──────────────────────────────────────────────────────────────
function ProductCard({ product, isAuthenticated, onAddToCart, onRequireAuth, setSelectedProduct }) {
  const [qty, setQty] = useState(1);
  const primaryImage = product.images?.find(i => i.is_primary) || product.images?.[0];

  return (
    <Card className="group flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-slate-600/60">
      <div className="relative overflow-hidden bg-slate-950/40 aspect-[4/3]">
        <img
          src={primaryImage?.image_url ? `${FILE_BASE}${primaryImage.image_url}` : "https://placehold.co/600x400?text=No+Image"}
          alt={product.name}
          className="w-full h-full object-contain p-3 transition-transform duration-500 group-hover:scale-105"
        />
        {product.is_featured && (
          <div className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-amber-500/90 px-2.5 py-1 text-xs font-bold text-amber-950">
            <Star size={11} className="fill-current" />
            Featured
          </div>
        )}
        <div className="absolute top-3 right-3 rounded-xl bg-slate-900/80 backdrop-blur-sm px-2.5 py-1 text-xs text-slate-300 border border-slate-700/50">
          {product.stock > 0 ? `${product.stock} buc` : "Stoc epuizat"}
        </div>
      </div>

      <div className="flex flex-col flex-1 p-5 gap-3">
        <div>
          <div className="mb-1.5 inline-flex rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-300">
            {product.category || "general"}
          </div>
          <h3 className="text-lg font-bold text-white leading-snug">{product.name}</h3>
          <p className="mt-1.5 text-sm text-slate-400 line-clamp-2">{product.description || "Fără descriere"}</p>
          <div className="mt-2">
            <StarRating rating={product.rating} count={product.review_count} />
          </div>
        </div>

        <div className="text-2xl font-black text-white mt-auto">{product.price} <span className="text-base text-slate-400 font-normal">RON</span></div>

        <button onClick={() => setSelectedProduct(product)}
          className="w-full rounded-2xl border border-slate-700 bg-slate-800/60 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-slate-700 hover:border-slate-600">
          Vezi detalii
        </button>

        <div className="flex items-center gap-2">
          <input type="number" min="1" value={qty}
            onChange={e => setQty(Math.max(1, Number(e.target.value)))}
            className="w-16 rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-white text-center outline-none text-sm" />
          <button
            disabled={product.stock <= 0}
            onClick={() => isAuthenticated ? onAddToCart(product.id, qty) : onRequireAuth()}
            className="flex-1 rounded-2xl px-4 py-2.5 font-semibold text-white text-sm transition disabled:cursor-not-allowed disabled:opacity-40 flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, #2563eb, #4f46e5, #0ea5e9)" }}>
            <ShoppingCart size={15} />
            {isAuthenticated ? "Adaugă" : "Login"}
          </button>
        </div>
      </div>
    </Card>
  );
}

// ── Products catalog view ─────────────────────────────────────────────────────
export function ProductsView({
  products, isAuthenticated, onAddToCart, onRequireAuth,
  search, setSearch, category, setCategory, setSelectedProduct,
}) {
  const categories = ["all", ...new Set(products.map(p => (p.category || "general").toLowerCase()))];

  const filteredProducts = products.filter(product => {
    const cat = (product.category || "general").toLowerCase();
    const matchCat = category === "all" || cat === category;
    const q = search.toLowerCase();
    const matchSearch = !q || product.name.toLowerCase().includes(q) ||
      (product.description || "").toLowerCase().includes(q) || cat.includes(q);
    return matchCat && matchSearch;
  });

  return (
    <section className="space-y-6">
      <SectionTitle
        eyebrow="Catalog"
        title="Toate produsele"
        subtitle="Caută, filtrează și explorează produsele din catalog."
        action={
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-300 shadow-sm">
              <SlidersHorizontal size={16} className="text-slate-500" />
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="bg-transparent outline-none text-sm">
                {categories.map(cat => (
                  <option key={cat} value={cat} className="bg-slate-900 capitalize">{cat}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-300 shadow-sm">
              <Search size={16} className="text-slate-500" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Caută în catalog..."
                className="bg-transparent outline-none placeholder:text-slate-600 text-sm" />
            </div>
          </div>
        }
      />

      {filteredProducts.length === 0 ? (
        <Card className="p-16 text-center">
          <Package className="mx-auto mb-4 text-slate-600" size={44} />
          <h3 className="text-xl font-bold text-white mb-2">Niciun produs găsit</h3>
          <p className="text-slate-400">Încearcă alt text de căutare sau categorie.</p>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filteredProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              isAuthenticated={isAuthenticated}
              onAddToCart={onAddToCart}
              onRequireAuth={onRequireAuth}
              setSelectedProduct={setSelectedProduct}
            />
          ))}
        </div>
      )}
    </section>
  );
}

// ── Product detail view ───────────────────────────────────────────────────────
export function ProductDetailsView({ product, isAuthenticated, onBack, onAddToCart, onRequireAuth }) {
  const [qty, setQty] = useState(1);

  return (
    <section className="space-y-6">
      <button onClick={onBack}
        className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 transition-colors">
        <ArrowLeft size={15} /> Înapoi la catalog
      </button>

      <div className="grid gap-6 lg:grid-cols-2">
        <ProductGallery images={product.images || []} />

        <Card className="p-6 flex flex-col gap-5">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <div className="inline-flex rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-300">
                {product.category || "general"}
              </div>
              {product.is_featured && (
                <div className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300">
                  <Star size={11} className="fill-amber-400 text-amber-400" />
                  Produs evidențiat
                </div>
              )}
            </div>
            <h2 className="text-3xl font-black text-white">{product.name}</h2>
            <StarRating rating={product.rating} count={product.review_count} />
          </div>

          <p className="text-slate-300 leading-relaxed">{product.description}</p>

          <div className="flex items-end gap-4 border-t border-slate-800 pt-4">
            <div>
              <div className="text-4xl font-black text-white">{product.price} <span className="text-xl text-slate-400 font-normal">RON</span></div>
              <div className="text-sm text-slate-400 mt-1">Stoc disponibil: {product.stock}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-auto">
            <input type="number" min="1" value={qty}
              onChange={e => setQty(Math.max(1, Number(e.target.value)))}
              className="w-20 rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-white outline-none text-center" />
            <button
              disabled={product.stock <= 0}
              onClick={() => isAuthenticated ? onAddToCart(product.id, qty) : onRequireAuth()}
              className="flex-1 rounded-2xl py-3 font-bold text-white transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, #2563eb, #4f46e5, #0ea5e9)" }}>
              <ShoppingCart size={17} />
              {isAuthenticated ? "Adaugă în coș" : "Login pentru coș"}
            </button>
          </div>
        </Card>
      </div>

      {/* Similar products */}
      {product.similar_products?.length > 0 && (
        <div className="space-y-4 pt-4">
          <div className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Produse similare</div>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {product.similar_products.slice(0, 4).map(p => (
              <ProductCard
                key={p.id}
                product={p}
                isAuthenticated={isAuthenticated}
                onAddToCart={onAddToCart}
                onRequireAuth={onRequireAuth}
                setSelectedProduct={() => {}}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
