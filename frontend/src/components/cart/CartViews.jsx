import React, { useState } from "react";
import {
  Minus, Package, Plus, Trash2, CreditCard, Lock,
  CheckCircle2, ShoppingBag, ChevronRight, Calendar, Clock
} from "lucide-react";
import { FILE_BASE } from "../../lib/api";
import { Card, SectionTitle } from "../common/UI";

// ── Stripe-like card form ─────────────────────────────────────────────────────
function formatCardNumber(val) {
  return val.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}
function formatExpiry(val) {
  const digits = val.replace(/\D/g, "").slice(0, 4);
  if (digits.length >= 3) return digits.slice(0, 2) + "/" + digits.slice(2);
  return digits;
}

function CardPaymentForm({ total, onPay, onCancel, loading }) {
  const [card, setCard] = useState({ number: "", expiry: "", cvc: "", name: "" });
  const [errors, setErrors] = useState({});
  const [flipped, setFlipped] = useState(false);

  const validate = () => {
    const e = {};
    if (card.number.replace(/\s/g, "").length < 16) e.number = "Număr card invalid";
    if (card.expiry.length < 5) e.expiry = "Data expirare invalidă";
    if (card.cvc.length < 3) e.cvc = "CVC invalid";
    if (!card.name.trim()) e.name = "Numele este obligatoriu";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePay = () => {
    if (!validate()) return;
    onPay({
      card_last4: card.number.replace(/\s/g, "").slice(-4),
      card_name: card.name,
    });
  };

  const cardDigits = card.number.replace(/\s/g, "").padEnd(16, "•");
  const displayNumber = [0,4,8,12].map(i => cardDigits.slice(i, i+4)).join("  ");

  return (
    <div className="space-y-6">
      {/* Visual card */}
      <div className="flex justify-center">
        <div
          className="relative w-80 h-48 cursor-pointer select-none"
          style={{ perspective: "1000px" }}
          onClick={() => setFlipped(f => !f)}
        >
          <div
            className="relative w-full h-full transition-transform duration-500"
            style={{ transformStyle: "preserve-3d", transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
          >
            {/* Front */}
            <div
              className="absolute inset-0 rounded-3xl p-6 flex flex-col justify-between overflow-hidden"
              style={{
                backfaceVisibility: "hidden",
                background: "linear-gradient(135deg, #1a3a6b 0%, #0f2147 50%, #1a1a4e 100%)",
                boxShadow: "0 25px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)"
              }}
            >
              <div className="absolute inset-0 opacity-10"
                style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
              <div className="relative flex justify-between items-start">
                <div className="flex gap-1">
                  <div className="w-8 h-8 rounded-full bg-amber-400/80" />
                  <div className="w-8 h-8 rounded-full bg-amber-500/60 -ml-3" />
                </div>
                <div className="text-slate-300 text-xs font-mono tracking-widest">VISA</div>
              </div>
              <div className="relative">
                <div className="text-white font-mono text-lg tracking-widest mb-3" style={{ letterSpacing: "0.2em" }}>
                  {displayNumber}
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-slate-400 text-xs uppercase tracking-widest mb-1">Card Holder</div>
                    <div className="text-white text-sm font-medium truncate max-w-36">
                      {card.name || "FULL NAME"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-slate-400 text-xs uppercase tracking-widest mb-1">Expires</div>
                    <div className="text-white text-sm font-mono">{card.expiry || "MM/YY"}</div>
                  </div>
                </div>
              </div>
            </div>
            {/* Back */}
            <div
              className="absolute inset-0 rounded-3xl overflow-hidden"
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
                background: "linear-gradient(135deg, #1a1a4e 0%, #0f2147 100%)",
                boxShadow: "0 25px 50px rgba(0,0,0,0.5)"
              }}
            >
              <div className="w-full h-12 bg-slate-800 mt-8" />
              <div className="px-6 mt-4">
                <div className="text-slate-400 text-xs mb-1">CVC</div>
                <div className="bg-white rounded-lg px-4 py-2 text-slate-900 font-mono text-sm text-right tracking-widest">
                  {card.cvc ? card.cvc.replace(/./g, "•") : "•••"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <p className="text-center text-xs text-slate-500">Click pe card pentru a vedea spatele</p>

      {/* Form fields */}
      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-2 block">
            Număr card
          </label>
          <div className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 bg-slate-900/60 transition-colors
            ${errors.number ? "border-rose-500/50" : "border-slate-700 focus-within:border-blue-500/50"}`}>
            <CreditCard size={18} className="text-slate-500 shrink-0" />
            <input
              value={card.number}
              onChange={e => setCard(p => ({ ...p, number: formatCardNumber(e.target.value) }))}
              placeholder="1234  5678  9012  3456"
              className="flex-1 bg-transparent text-white font-mono outline-none placeholder:text-slate-600"
              maxLength={19}
            />
          </div>
          {errors.number && <p className="text-rose-400 text-xs mt-1">{errors.number}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-2 block">
              Data expirare
            </label>
            <div className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 bg-slate-900/60 transition-colors
              ${errors.expiry ? "border-rose-500/50" : "border-slate-700 focus-within:border-blue-500/50"}`}>
              <Calendar size={16} className="text-slate-500 shrink-0" />
              <input
                value={card.expiry}
                onChange={e => setCard(p => ({ ...p, expiry: formatExpiry(e.target.value) }))}
                placeholder="MM/YY"
                className="flex-1 bg-transparent text-white font-mono outline-none placeholder:text-slate-600"
                maxLength={5}
              />
            </div>
            {errors.expiry && <p className="text-rose-400 text-xs mt-1">{errors.expiry}</p>}
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-2 block">
              CVC
            </label>
            <div className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 bg-slate-900/60 transition-colors
              ${errors.cvc ? "border-rose-500/50" : "border-slate-700 focus-within:border-blue-500/50"}`}
              onClick={() => setFlipped(true)}>
              <Lock size={16} className="text-slate-500 shrink-0" />
              <input
                value={card.cvc}
                onChange={e => setCard(p => ({ ...p, cvc: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                onFocus={() => setFlipped(true)}
                onBlur={() => setFlipped(false)}
                placeholder="•••"
                className="flex-1 bg-transparent text-white font-mono outline-none placeholder:text-slate-600"
                maxLength={4}
              />
            </div>
            {errors.cvc && <p className="text-rose-400 text-xs mt-1">{errors.cvc}</p>}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-2 block">
            Numele titularului
          </label>
          <div className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 bg-slate-900/60 transition-colors
            ${errors.name ? "border-rose-500/50" : "border-slate-700 focus-within:border-blue-500/50"}`}>
            <input
              value={card.name}
              onChange={e => setCard(p => ({ ...p, name: e.target.value.toUpperCase() }))}
              placeholder="PRENUME NUME"
              className="flex-1 bg-transparent text-white font-mono outline-none placeholder:text-slate-600 uppercase"
            />
          </div>
          {errors.name && <p className="text-rose-400 text-xs mt-1">{errors.name}</p>}
        </div>
      </div>

      {/* Pay button */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between text-sm text-slate-400 px-1">
          <span>Total de plată</span>
          <span className="text-white font-bold text-lg">{total?.toFixed(2)} RON</span>
        </div>
        <button
          onClick={handlePay}
          disabled={loading}
          className="w-full rounded-2xl py-4 font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #2563eb, #4f46e5, #0ea5e9)" }}
        >
          <Lock size={16} />
          {loading ? "Se procesează..." : `Plătește ${total?.toFixed(2)} RON`}
        </button>
        <button
          onClick={onCancel}
          className="w-full rounded-2xl py-3 text-sm text-slate-400 hover:text-slate-200 border border-slate-700/50 transition-colors"
        >
          Anulează
        </button>
        <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
          <Lock size={12} />
          Plată securizată · SSL encrypted
        </div>
      </div>
    </div>
  );
}

// ── Cart item row ─────────────────────────────────────────────────────────────
function CartItemRow({ item, product, onUpdate, onRemove }) {
  const primaryImage = product?.images?.find(i => i.is_primary) || product?.images?.[0];
  const itemTotal = (product?.price || 0) * item.quantity;

  return (
    <div className="flex items-center gap-4 py-4 border-b border-slate-800 last:border-0">
      <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-800 shrink-0">
        {primaryImage ? (
          <img src={`${FILE_BASE}${primaryImage.image_url}`} alt={product?.name}
            className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-600">
            <Package size={20} />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-white font-semibold truncate">{product?.name || `Produs #${item.product_id}`}</div>
        <div className="text-slate-400 text-sm mt-0.5">{product?.price?.toFixed(2)} RON / buc</div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button onClick={() => onUpdate(item.id, Math.max(0, item.quantity - 1))}
          className="w-8 h-8 rounded-xl border border-slate-700 bg-slate-800 flex items-center justify-center text-slate-300 hover:bg-slate-700 transition-colors">
          <Minus size={14} />
        </button>
        <span className="w-8 text-center text-white font-bold">{item.quantity}</span>
        <button onClick={() => onUpdate(item.id, item.quantity + 1)}
          className="w-8 h-8 rounded-xl border border-slate-700 bg-slate-800 flex items-center justify-center text-slate-300 hover:bg-slate-700 transition-colors">
          <Plus size={14} />
        </button>
      </div>
      <div className="text-white font-bold w-24 text-right shrink-0">{itemTotal.toFixed(2)} RON</div>
      <button onClick={() => onRemove(item.id)}
        className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-300 hover:bg-rose-500/20 transition-colors shrink-0">
        <Trash2 size={14} />
      </button>
    </div>
  );
}

// ── Main CartView ─────────────────────────────────────────────────────────────
export function CartView({
  cart, products, onUpdateItem, onRemoveItem, onClearCart,
  onCreateOrder, onPayOrder, orderResult, orders
}) {
  const [step, setStep] = useState("cart"); // cart | checkout | paying | success
  const [payingOrderId, setPayingOrderId] = useState(null);
  const [payLoading, setPayLoading] = useState(false);

  const items = cart?.items || [];

  const enrichedItems = items.map(item => ({
    item,
    product: products.find(p => p.id === item.product_id),
  }));

  const cartTotal = enrichedItems.reduce((sum, { item, product }) =>
    sum + (product?.price || 0) * item.quantity, 0);

  const handleCreateAndCheckout = async () => {
    await onCreateOrder();
    setStep("checkout");
  };

  const handlePay = async (cardDetails) => {
    const orderId = orderResult?.id || payingOrderId;
    if (!orderId) return;
    setPayLoading(true);
    try {
      await onPayOrder(orderId, cardDetails);
      setStep("success");
    } finally {
      setPayLoading(false);
    }
  };

  // Pay existing order from orders list
  const handlePayExisting = (orderId) => {
    setPayingOrderId(orderId);
    setStep("paying");
  };

  if (step === "success") {
    return (
      <section className="flex flex-col items-center justify-center py-24 space-y-6">
        <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <CheckCircle2 size={40} className="text-emerald-400" />
        </div>
        <div className="text-center">
          <h2 className="text-3xl font-black text-white">Plată reușită!</h2>
          <p className="text-slate-400 mt-2">Comanda ta a fost procesată cu succes.</p>
        </div>
        <button onClick={() => setStep("cart")}
          className="rounded-2xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-500 transition-colors">
          Înapoi la coș
        </button>
      </section>
    );
  }

  if (step === "checkout" || step === "paying") {
    const orderId = orderResult?.id || payingOrderId;
    const pendingOrder = orders.find(o => o.id === orderId);
    const total = orderResult?.total || pendingOrder?.total || 0;

    return (
      <section className="max-w-lg mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setStep("cart")}
            className="text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-1">
            ← Înapoi la coș
          </button>
        </div>
        <Card className="p-6">
          <div className="mb-6">
            <div className="text-xs uppercase tracking-widest text-blue-400 mb-1">Checkout</div>
            <h2 className="text-2xl font-black text-white">Detalii plată</h2>
            {orderId && (
              <div className="mt-2 text-sm text-slate-400">
                Comandă #{orderId} · {total.toFixed(2)} RON
              </div>
            )}
          </div>
          <CardPaymentForm
            total={total}
            onPay={handlePay}
            onCancel={() => setStep("cart")}
            loading={payLoading}
          />
        </Card>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <SectionTitle
        eyebrow="Cart"
        title="Coșul tău"
        subtitle="Gestionează produsele selectate."
        action={
          items.length > 0 && (
            <button onClick={onClearCart}
              className="rounded-2xl bg-rose-500/10 px-4 py-2.5 text-sm font-medium text-rose-300 hover:bg-rose-500/20 transition-colors border border-rose-500/20">
              Golește coșul
            </button>
          )
        }
      />

      {items.length === 0 ? (
        <Card className="p-16 text-center">
          <ShoppingBag className="mx-auto mb-4 text-slate-600" size={48} />
          <h3 className="text-xl font-bold text-white mb-2">Coșul e gol</h3>
          <p className="text-slate-400">Adaugă produse din catalog pentru a continua.</p>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* Items list */}
          <Card className="p-6">
            <div className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-2">
              {items.length} {items.length === 1 ? "produs" : "produse"}
            </div>
            {enrichedItems.map(({ item, product }) => (
              <CartItemRow
                key={item.id}
                item={item}
                product={product}
                onUpdate={onUpdateItem}
                onRemove={onRemoveItem}
              />
            ))}
          </Card>

          {/* Summary */}
          <div className="space-y-4">
            <Card className="p-6 space-y-4">
              <div className="text-sm font-semibold text-slate-400 uppercase tracking-widest">
                Sumar comandă
              </div>
              {enrichedItems.map(({ item, product }) => (
                <div key={item.id} className="flex justify-between text-sm text-slate-300">
                  <span className="truncate mr-2">{product?.name || `#${item.product_id}`} ×{item.quantity}</span>
                  <span className="shrink-0">{((product?.price || 0) * item.quantity).toFixed(2)} RON</span>
                </div>
              ))}
              <div className="border-t border-slate-700 pt-4 flex justify-between">
                <span className="font-bold text-white">Total</span>
                <span className="font-black text-xl text-white">{cartTotal.toFixed(2)} RON</span>
              </div>
              <button
                onClick={handleCreateAndCheckout}
                className="w-full rounded-2xl py-4 font-bold text-white flex items-center justify-center gap-2 transition-all"
                style={{ background: "linear-gradient(135deg, #2563eb, #4f46e5, #0ea5e9)" }}
              >
                <CreditCard size={18} />
                Finalizează comanda
                <ChevronRight size={16} />
              </button>
            </Card>

            {/* Unpaid orders */}
            {orders.filter(o => o.status === "pending").length > 0 && (
              <Card className="p-5">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
                  Comenzi neachitate
                </div>
                {orders.filter(o => o.status === "pending").map(order => (
                  <div key={order.id} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                    <div>
                      <div className="text-white text-sm font-semibold">Comandă #{order.id}</div>
                      <div className="text-slate-400 text-xs">{order.total?.toFixed(2)} RON</div>
                    </div>
                    <button
                      onClick={() => handlePayExisting(order.id)}
                      className="text-xs bg-amber-500/10 text-amber-300 border border-amber-500/20 px-3 py-1.5 rounded-xl hover:bg-amber-500/20 transition-colors">
                      Plătește
                    </button>
                  </div>
                ))}
              </Card>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

// ── Order history view ────────────────────────────────────────────────────────
export function OrderView({ orders, onPayOrder }) {
  const [payingId, setPayingId] = useState(null);
  const [payLoading, setPayLoading] = useState(false);
  const [paidSuccess, setPaidSuccess] = useState(null);

  const handlePay = async (cardDetails) => {
    setPayLoading(true);
    try {
      await onPayOrder(payingId, cardDetails);
      setPaidSuccess(payingId);
      setPayingId(null);
    } finally {
      setPayLoading(false);
    }
  };

  const statusColors = {
    pending: "bg-amber-500/10 text-amber-300 border-amber-500/20",
    paid: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
    cancelled: "bg-rose-500/10 text-rose-300 border-rose-500/20",
  };

  if (payingId) {
    const order = orders.find(o => o.id === payingId);
    return (
      <section className="max-w-lg mx-auto space-y-6">
        <button onClick={() => setPayingId(null)}
          className="text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-1">
          ← Înapoi la comenzi
        </button>
        <Card className="p-6">
          <div className="mb-6">
            <div className="text-xs uppercase tracking-widest text-blue-400 mb-1">Plată comandă</div>
            <h2 className="text-2xl font-black text-white">Comandă #{payingId}</h2>
            <div className="text-slate-400 text-sm mt-1">Total: {order?.total?.toFixed(2)} RON</div>
          </div>
          <CardPaymentForm
            total={order?.total || 0}
            onPay={handlePay}
            onCancel={() => setPayingId(null)}
            loading={payLoading}
          />
        </Card>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <SectionTitle
        eyebrow="Orders"
        title="Comenzile mele"
        subtitle="Istoricul și statusul comenzilor tale."
      />
      {orders.length === 0 ? (
        <Card className="p-16 text-center">
          <Package className="mx-auto mb-4 text-slate-600" size={48} />
          <h3 className="text-xl font-bold text-white mb-2">Nicio comandă</h3>
          <p className="text-slate-400">Comenzile tale vor apărea aici.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <Card key={order.id} className="p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0">
                    <ShoppingBag size={20} className="text-blue-400" />
                  </div>
                  <div>
                    <div className="font-bold text-white">Comandă #{order.id}</div>
                    <div className="flex items-center gap-2 mt-1 text-slate-400 text-sm">
                      <Clock size={13} />
                      {new Date(order.created_at).toLocaleString("ro-RO")}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-xs font-semibold px-3 py-1.5 rounded-xl border ${statusColors[order.status] || statusColors.pending}`}>
                    {order.status === "pending" ? "În așteptare" :
                     order.status === "paid" ? "Plătită" : order.status}
                  </span>
                  <div className="text-right">
                    <div className="text-white font-black">{order.total?.toFixed(2)} RON</div>
                    <div className="text-slate-400 text-xs">{order.items?.length || 0} produse</div>
                  </div>
                  {order.status === "pending" && order.id !== paidSuccess && (
                    <button
                      onClick={() => setPayingId(order.id)}
                      className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 transition-colors flex items-center gap-2">
                      <CreditCard size={15} />
                      Plătește
                    </button>
                  )}
                  {(order.status === "paid" || order.id === paidSuccess) && (
                    <div className="flex items-center gap-1.5 text-emerald-400 text-sm">
                      <CheckCircle2 size={16} />
                      Achitată
                    </div>
                  )}
                </div>
              </div>
              {order.items?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-800 grid gap-1">
                  {order.items.map(item => (
                    <div key={item.id} className="flex justify-between text-sm text-slate-400">
                      <span>Produs #{item.product_id} ×{item.quantity}</span>
                      <span>{(item.price * item.quantity).toFixed(2)} RON</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
