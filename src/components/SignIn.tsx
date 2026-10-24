"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useMemo, useState } from "react";

type Labels = {
  title: string;
  lede: string;
  email: string;
  send: string;
  sending: string;
  sent: string;
  code: string;
  verify: string;
  google: string;
  or: string;
  error: string;
  changeEmail: string;
};

/** Entrar con un código o enlace por email, o con Google. */
export function SignIn({ url, anonKey, next, origin, t }: { url: string; anonKey: string; next: string; origin: string; t: Labels }) {
  const sb = useMemo(() => createBrowserClient(url, anonKey), [url, anonKey]);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const callback = `${origin}/auth/callback?next=${encodeURIComponent(next)}`;

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(undefined);
    const { error } = await sb.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: callback } });
    setBusy(false);
    if (error) return setError(error.message || t.error);
    setStep("code");
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(undefined);
    const { error } = await sb.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: "email" });
    if (error) {
      setBusy(false);
      return setError(error.message || t.error);
    }
    // El callback enlaza lo que hubiera hecho como anónimo y redirige.
    window.location.href = `/auth/callback?next=${encodeURIComponent(next)}&linked=1`;
  }

  async function google() {
    setError(undefined);
    const { error } = await sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: callback } });
    if (error) setError(error.message || t.error);
  }

  const input =
    "t-body w-full rounded-[var(--radius-ctl)] border border-[var(--color-hairline)] bg-[var(--color-surface-2)] px-4 py-3 outline-none placeholder:text-[var(--color-label-4)] focus:border-[var(--color-hairline-strong)]";
  const primary =
    "interactive w-full rounded-full bg-white px-6 py-3 text-[15px] font-medium text-black hover:bg-white/90 disabled:opacity-50";

  return (
    <div className="mx-auto max-w-sm px-6 py-24">
      <h1 className="t-title text-center">{t.title}</h1>
      <p className="t-sub mt-3 text-center text-[var(--color-label-2)]">{t.lede}</p>

      <button type="button" onClick={google} className="interactive mt-10 flex w-full items-center justify-center gap-3 rounded-full border border-[var(--color-hairline-strong)] px-6 py-3 text-[15px]">
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
          <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
        </svg>
        {t.google}
      </button>

      <p className="t-caption my-6 text-center text-[var(--color-label-3)]">{t.or}</p>

      {step === "email" ? (
        <form onSubmit={sendCode} className="space-y-3">
          <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t.email} className={input} />
          <button type="submit" disabled={busy} className={primary}>
            {busy ? t.sending : t.send}
          </button>
        </form>
      ) : (
        <form onSubmit={verify} className="space-y-3">
          <p className="t-sub text-[var(--color-label-2)]">{t.sent.replace("{email}", email)}</p>
          <input inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder={t.code} className={input} />
          <button type="submit" disabled={busy || code.trim().length < 6} className={primary}>
            {t.verify}
          </button>
          <button type="button" onClick={() => setStep("email")} className="t-caption w-full text-[var(--color-label-3)] underline">
            {t.changeEmail}
          </button>
        </form>
      )}
      {error && <p className="t-caption mt-4 text-center text-red-300">{error}</p>}
    </div>
  );
}
