"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ShieldCheck, Zap } from "lucide-react";
import styles from "./operator.module.css";

export function LoginForm({ expired }: { expired: boolean }) {
  const [secret, setSecret] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!secret) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/operator/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret }),
      });
      const body = (await response.json()) as {
        success?: boolean;
        error?: { message?: string };
      };
      if (!response.ok || !body.success)
        throw new Error(
          body.error?.message ??
            "Access could not be confirmed. Check the operator credential and try again.",
        );
      setSecret("");
      router.replace("/dashboard");
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Sign in failed. Please try again.",
      );
      setBusy(false);
    }
  }
  return (
    <main className={styles.loginPage}>
      <div className={styles.loginBox}>
        <Link href="/" className={styles.loginBrand}>
          <span>
            <Zap size={19} fill="currentColor" />
          </span>
          lightline
        </Link>
        <section className={styles.loginCard}>
          <small>OPERATOR WORKSPACE</small>
          <h1>Sign in to LightLine</h1>
          <p>Access the complaint register using your operator credential.</p>
          {expired && (
            <div className={styles.loginMessage} role="status">
              Your session ended. Sign in again to continue.
            </div>
          )}
          {error && (
            <div className={styles.loginMessage} role="alert">
              {error}
            </div>
          )}
          <form className={styles.loginForm} onSubmit={submit}>
            <label htmlFor="operator-secret">Operator credential</label>
            <input
              id="operator-secret"
              type="password"
              autoComplete="current-password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Enter your credential"
              required
              autoFocus
            />
            <button disabled={busy || !secret}>
              {busy ? (
                "Checking access…"
              ) : (
                <>
                  Continue <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>
          <div className={styles.loginPrivacy}>
            <ShieldCheck size={14} /> Your credential stays private and is never
            stored in this browser.
          </div>
        </section>
        <p className={styles.loginFooter}>LightLine · Complaint operations</p>
      </div>
    </main>
  );
}
