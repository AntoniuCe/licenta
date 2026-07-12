import React, { useEffect, useRef, useState } from "react";
import { Lock, Sparkles, ShoppingBag, Shield, Globe } from "lucide-react";
import { Card, Message } from "../common/UI";
import { apiFetch } from "../../lib/api";
import { getGoogleClientId, loadGoogleScript } from "../../lib/google";

export default function AuthScreen({
  mode,
  onModeChange,
  onLogin,
  onRegister,
  onGoogleSuccess,
  loading,
  message,
  onCancel,
}) {
  const [form, setForm] = useState({ email: "", password: "" });
  const googleButtonRef = useRef(null);
  const [googleReady, setGoogleReady] = useState(false);
  const [googleError, setGoogleError] = useState("");
  const googleClientId = getGoogleClientId();

  // ── Google Sign-In ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (mode !== "login" || !googleClientId) return;

    let cancelled = false;

    async function initGoogle() {
      try {
        const google = await loadGoogleScript();
        if (cancelled || !google?.accounts?.id) return;

        google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response) => {
            try {
              setGoogleError("");
              // POST the Google credential to our backend
              const data = await apiFetch("/google-login", {
                method: "POST",
                body: JSON.stringify({ credential: response.credential }),
              });
              onGoogleSuccess(data);
            } catch (err) {
              setGoogleError(err.message || "Google login eșuat. Încearcă din nou.");
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        if (googleButtonRef.current) {
          googleButtonRef.current.innerHTML = "";
          google.accounts.id.renderButton(googleButtonRef.current, {
            type: "standard",
            theme: "filled_black",
            text: "signin_with",
            size: "large",
            shape: "pill",
            width: 320,
            logo_alignment: "left",
          });
          setGoogleReady(true);
        }
      } catch (err) {
        if (!cancelled) {
          setGoogleError("Nu am putut încărca Google Sign-In.");
        }
      }
    }

    initGoogle();
    return () => { cancelled = true; };
  }, [mode, googleClientId, onGoogleSuccess]);

  // Re-render Google button when switching back to login
  useEffect(() => {
    if (mode !== "login") {
      setGoogleReady(false);
      setGoogleError("");
    }
  }, [mode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mode === "login") await onLogin(form);
    else await onRegister(form);
  };

  const combinedMessage = message || (googleError ? { text: googleError, type: "error" } : null);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#080d16] text-slate-100">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-blue-600/8 blur-[100px]" />
        <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-indigo-500/8 blur-[80px]" />
        <div className="absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-sky-500/8 blur-[80px]" />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.02]"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center px-6 py-16">
        <div className="grid w-full gap-12 lg:grid-cols-[1.2fr_0.8fr]">

          {/* Left — hero text */}
          <div className="flex flex-col justify-center space-y-8">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-400/15 bg-blue-500/8 px-4 py-2 text-sm text-blue-300">
                <Sparkles size={14} />
                K3s Demo Marketplace
              </div>
              <h1 className="text-5xl font-black leading-[0.92] text-white md:text-7xl">
                Shop freely.
                <span className="block mt-2"
                  style={{ background: "linear-gradient(135deg, #60a5fa, #818cf8, #38bdf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  Login when ready.
                </span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-400">
                Catalogul e public — autentificarea îți deblochează coșul, comenzile și panoul de administrare.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 max-w-lg">
              {[
                { icon: ShoppingBag, label: "Catalog public", sub: "Fără login", color: "text-blue-400", bg: "bg-blue-500/10" },
                { icon: Shield, label: "Securizat JWT", sub: "Token 24h", color: "text-indigo-400", bg: "bg-indigo-500/10" },
                { icon: Globe, label: "Google Sign-In", sub: "OAuth 2.0", color: "text-sky-400", bg: "bg-sky-500/10" },
              ].map(({ icon: Icon, label, sub, color, bg }) => (
                <div key={label}
                  className="rounded-2xl border border-slate-700/50 bg-slate-900/50 p-4 backdrop-blur-sm">
                  <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${bg} ${color}`}>
                    <Icon size={17} />
                  </div>
                  <div className="text-sm font-semibold text-white">{label}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — auth card */}
          <div className="self-center">
            <Card className="p-7 md:p-8">
              {/* Header */}
              <div className="mb-7 flex items-start justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.25em] text-slate-500 mb-2">
                    {mode === "login" ? "Bine ai revenit" : "Cont nou"}
                  </div>
                  <h2 className="text-3xl font-black text-white">
                    {mode === "login" ? "Autentificare" : "Înregistrare"}
                  </h2>
                </div>
                <button onClick={onCancel}
                  className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-400 hover:text-white hover:border-slate-600 transition-colors">
                  ✕ Înapoi
                </button>
              </div>

              {/* Message */}
              <Message message={combinedMessage} />

              {/* Google button (login only) */}
              {mode === "login" && googleClientId && (
                <div className="mb-5">
                  <div ref={googleButtonRef} className="flex justify-center min-h-[44px]" />
                  {!googleReady && !googleError && (
                    <div className="flex justify-center">
                      <div className="h-11 w-72 rounded-full bg-slate-800/80 animate-pulse" />
                    </div>
                  )}
                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex-1 border-t border-slate-700/60" />
                    <span className="text-xs text-slate-500 uppercase tracking-widest">ou</span>
                    <div className="flex-1 border-t border-slate-700/60" />
                  </div>
                </div>
              )}

              {mode === "login" && !googleClientId && (
                <div className="mb-5 rounded-2xl border border-amber-400/15 bg-amber-500/8 px-4 py-3 text-xs text-amber-300">
                  Setează <code className="bg-amber-500/10 px-1 py-0.5 rounded font-mono">VITE_GOOGLE_CLIENT_ID</code> pentru a activa Google Sign-In.
                </div>
              )}

              {/* Email/password form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-widest text-slate-400">
                    Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3.5 text-white outline-none transition-colors placeholder:text-slate-600 focus:border-blue-500/50 text-sm"
                    placeholder="tu@exemplu.com"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-widest text-slate-400">
                    Parolă
                  </label>
                  <div className="flex items-center rounded-2xl border border-slate-700 bg-slate-950/60 px-4 transition-colors focus-within:border-blue-500/50">
                    <Lock size={15} className="text-slate-600 shrink-0" />
                    <input
                      type="password"
                      value={form.password}
                      onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                      className="w-full bg-transparent px-3 py-3.5 text-white outline-none placeholder:text-slate-600 text-sm"
                      placeholder={mode === "register" ? "Minim 6 caractere" : "Parola ta"}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl py-3.5 font-bold text-white transition-all disabled:opacity-50 mt-2"
                  style={{ background: "linear-gradient(135deg, #2563eb, #4f46e5, #0ea5e9)" }}
                >
                  {loading
                    ? "Se procesează..."
                    : mode === "login" ? "Intră în cont" : "Creează cont"}
                </button>
              </form>

              {/* Switch mode */}
              <div className="mt-5 text-center text-sm text-slate-500">
                {mode === "login" ? "Nu ai cont? " : "Ai deja cont? "}
                <button
                  onClick={() => onModeChange(mode === "login" ? "register" : "login")}
                  className="font-semibold text-blue-400 hover:text-blue-300 transition-colors">
                  {mode === "login" ? "Înregistrează-te" : "Autentifică-te"}
                </button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
