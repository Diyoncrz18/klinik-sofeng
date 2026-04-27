"use client";

/**
 * Lupa Password Pasien
 * ──────────────────────
 * Form untuk mengirim link reset password ke email pasien.
 * Setelah submit menampilkan halaman konfirmasi (success state).
 */

import { useId, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import BackHeader from "@/app/components/shared/BackHeader";
import { PASIEN_PATHS } from "@/app/components/pasien/pasienRouting";

export default function PasienLupaPasswordPage() {
  const router = useRouter();
  const formId = useId();

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Masukkan email Anda terlebih dahulu.");
      return;
    }

    const isValidEmail = /\S+@\S+\.\S+/.test(email);
    if (!isValidEmail) {
      setError("Format email tidak valid.");
      return;
    }

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
    setSubmitted(true);
  }

  // ── Success state ─────────────────────────────────────
  if (submitted) {
    return (
      <div style={{ paddingBottom: 24 }}>
        <BackHeader title="Permintaan Terkirim" onBack={() => router.back()} />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            padding: "20px 16px 40px",
          }}
        >
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #059669, #34d399)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 12px 32px rgba(5,150,105,0.3)",
              marginBottom: 24,
            }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21.2 8.4c.5.38.8.97.8 1.6v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V10a2 2 0 0 1 .8-1.6l8-6a2 2 0 0 1 2.4 0Z" />
              <path d="m22 10-9.04 6-9.04-6" />
            </svg>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: "#111827", letterSpacing: "-0.02em", marginBottom: 8 }}>
            Cek email Anda
          </h2>
          <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6, maxWidth: 300, marginBottom: 24 }}>
            Kami telah mengirim instruksi reset password ke{" "}
            <span style={{ fontWeight: 800, color: "#111827" }}>{email}</span>. Buka email & ikuti tautannya.
          </p>

          <Link
            href={PASIEN_PATHS.login}
            prefetch
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "12px 24px",
              background: "linear-gradient(135deg, #1d4e73, #2A6B9B)",
              color: "#fff",
              border: "none",
              borderRadius: 14,
              fontSize: 13,
              fontWeight: 800,
              boxShadow: "0 8px 24px rgba(42,107,155,0.35)",
              textDecoration: "none",
              fontFamily: "inherit",
            }}
          >
            Kembali ke Login
          </Link>

          <button
            type="button"
            onClick={() => {
              setSubmitted(false);
              setEmail("");
            }}
            style={{
              marginTop: 16,
              fontSize: 12,
              fontWeight: 700,
              color: "#6b7280",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Gunakan email lain
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 24 }}>
      <BackHeader title="Lupa Password" subtitle="Reset password lewat email" onBack={() => router.back()} />

      {/* ── Hero ─────────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "8px 16px 24px" }}>
        <div
          aria-hidden="true"
          style={{
            width: 76,
            height: 76,
            borderRadius: 24,
            background: "linear-gradient(135deg, #78350f, #d97706)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 14px 32px rgba(217,119,6,0.3)",
            marginBottom: 16,
          }}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="11" x="3" y="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            <path d="M12 16v2" />
          </svg>
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: "#111827", letterSpacing: "-0.02em", marginBottom: 6 }}>
          Lupa Password?
        </h1>
        <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.55, maxWidth: 300 }}>
          Tenang, masukkan email yang kamu pakai daftar dan kami akan mengirimkan tautan reset password.
        </p>
      </div>

      {/* ── Form ─────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label
            htmlFor={`${formId}-email`}
            style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6, letterSpacing: "0.02em" }}
          >
            Email Terdaftar
          </label>
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              background: "#fff",
              border: "1.5px solid #e5e7eb",
              borderRadius: 12,
              paddingLeft: 38,
              height: 48,
            }}
          >
            <span aria-hidden="true" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", display: "flex" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-10 5L2 7" />
              </svg>
            </span>
            <input
              id={`${formId}-email`}
              type="email"
              inputMode="email"
              placeholder="contoh: ahmad@email.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                flex: 1,
                height: "100%",
                border: "none",
                outline: "none",
                background: "transparent",
                fontSize: 14,
                fontWeight: 500,
                color: "#111827",
                fontFamily: "inherit",
              }}
            />
          </div>
        </div>

        {/* Error */}
        {error ? (
          <p
            role="alert"
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#b91c1c",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: 10,
              padding: "8px 12px",
            }}
          >
            ⚠️ {error}
          </p>
        ) : null}

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          style={{
            marginTop: 4,
            padding: "14px 0",
            background: isLoading ? "#9ca3af" : "linear-gradient(135deg, #1d4e73, #2A6B9B)",
            color: "#fff",
            border: "none",
            borderRadius: 14,
            fontSize: 14,
            fontWeight: 800,
            cursor: isLoading ? "wait" : "pointer",
            fontFamily: "inherit",
            boxShadow: isLoading ? "none" : "0 8px 24px rgba(42,107,155,0.35)",
            transition: "all 0.2s ease",
          }}
        >
          {isLoading ? "Mengirim..." : "Kirim Tautan Reset"}
        </button>
      </form>

      {/* Footer */}
      <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#6b7280" }}>
        Ingat passwordnya?{" "}
        <Link href={PASIEN_PATHS.login} prefetch style={{ color: "#2A6B9B", fontWeight: 800, textDecoration: "none" }}>
          Masuk di sini
        </Link>
      </p>
    </div>
  );
}
