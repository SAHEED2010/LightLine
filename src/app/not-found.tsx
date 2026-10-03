import Link from "next/link";
import { ArrowLeft, Zap } from "lucide-react";

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background: "#f5f8fb",
        color: "#10243a",
        fontFamily: "var(--font-body), sans-serif",
      }}
    >
      <section style={{ textAlign: "center", maxWidth: 420 }}>
        <Link
          href="/"
          aria-label="LightLine home"
          style={{
            display: "inline-grid",
            placeItems: "center",
            width: 48,
            height: 48,
            borderRadius: 12,
            background: "#e2eef8",
            color: "#2563a6",
          }}
        >
          <Zap size={23} fill="currentColor" />
        </Link>
        <p
          style={{
            fontSize: 10,
            letterSpacing: 1.2,
            color: "#71879a",
            fontWeight: 700,
            marginTop: 25,
          }}
        >
          PAGE NOT FOUND
        </p>
        <h1
          style={{
            fontFamily: "var(--font-display), sans-serif",
            fontSize: 32,
            letterSpacing: -1.3,
            margin: "7px 0 10px",
          }}
        >
          That record isn’t here.
        </h1>
        <p
          style={{
            fontSize: 13,
            lineHeight: 1.7,
            color: "#6b7d8e",
            margin: "0 auto 24px",
          }}
        >
          The page may have moved or the address may be incomplete. Return to
          the LightLine home page.
        </p>
        <Link
          href="/"
          style={{
            display: "inline-flex",
            gap: 8,
            alignItems: "center",
            padding: "11px 15px",
            borderRadius: 5,
            background: "#10243a",
            color: "white",
            fontSize: 11,
            fontWeight: 650,
            textDecoration: "none",
          }}
        >
          <ArrowLeft size={14} /> Go to LightLine
        </Link>
      </section>
    </main>
  );
}
