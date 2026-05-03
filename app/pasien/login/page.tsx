"use client";

/**
 * Login Pasien
 * ──────────────
 * Halaman masuk untuk pasien (counterpart `/login` dokter).
 * Mobile-first, single column, menggunakan palet & komponen yang
 * konsisten dengan tab pasien.
 */

import { useId, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import BackHeader from "@/app/components/shared/BackHeader";
import { PASIEN_PATHS } from "@/app/components/pasien/pasienRouting";
import { useAuth } from "@/app/contexts/AuthContext";
import { ApiError } from "@/lib/api";
import { getUserRole } from "@/lib/types";

export default function PasienLoginPage() {
  const router = useRouter();
  const formId = useId();
  const { login } = useAuth();

  const [identitas, setIdentitas] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const idIdentitas = `${formId}-identitas`;
  const idPassword = `${formId}-password`;
  const idRemember = `${formId}-remember`;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    const trimmed = identitas.trim();
    if (!trimmed || !password.trim()) {
      setError("Email dan password wajib diisi.");
      return;
    }

    // Phone login belum didukung backend — tolak di FE supaya pesan error
    // jelas (daripada Zod di BE bilang "Email tidak valid").
    if (!trimmed.includes("@")) {
      setError("Saat ini login hanya bisa dengan email. No. HP belum didukung.");
      return;
    }

    setIsLoading(true);
    try {
      const user = await login(trimmed, password);

      const role = getUserRole(user);
      if (role !== "pasien") {
        setError(
          role === "dokter"
            ? "Akun ini terdaftar sebagai dokter. Silakan gunakan portal dokter."
            : "Akun Anda tidak memiliki akses ke portal pasien.",
        );
        return;
      }

      router.replace(PASIEN_PATHS.home);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Tidak dapat terhubung ke server. Periksa koneksi internet.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div style={{ paddingBottom: 24 }}>
      <BackHeader title="Masuk Akun" subtitle="Selamat datang kembali!" onBack={() => router.back()} />

      {/* ── Hero icon & welcome ──────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 0 24px", textAlign: "center" }}>
        <div
          aria-hidden="true"
          style={{
            width: 76,
            height: 76,
            borderRadius: 24,
            background: "linear-gradient(135deg, #1d4e73, #2A6B9B 60%, #3b9bd4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 14px 32px rgba(42,107,155,0.35)",
            marginBottom: 16,
          }}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="4" />
            <path d="M20 21a8 8 0 1 0-16 0" />
          </svg>
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: "#111827", letterSpacing: "-0.02em" }}>Masuk Akun Pasien</h1>
        <p style={{ fontSize: 13, color: "#6b7280", marginTop: 6, lineHeight: 1.5, maxWidth: 280 }}>
          Lanjutkan perawatan gigimu dan pantau jadwal serta rekam medis.
        </p>
      </div>

      {/* ── Form ───────────────────────────────────────── */}
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Identitas (email / HP) */}
        <Field
          id={idIdentitas}
          label="Email atau No. HP"
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-10 5L2 7" />
            </svg>
          }
        >
          <input
            id={idIdentitas}
            type="text"
            inputMode="email"
            placeholder="contoh: ahmad@email.com / 0812"
            autoComplete="username"
            value={identitas}
            onChange={(e) => setIdentitas(e.target.value)}
            style={inputStyle}
          />
        </Field>

        {/* Password */}
        <Field
          id={idPassword}
          label="Password"
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect width="18" height="11" x="3" y="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          }
          rightSlot={
            <button
              type="button"
              aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              onClick={() => setShowPassword((v) => !v)}
              style={{
                background: "none",
                border: "none",
                color: "#6b7280",
                cursor: "pointer",
                padding: 4,
                display: "flex",
              }}
            >
              {showPassword ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                  <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                  <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                  <path d="m2 2 20 20" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          }
        >
          <input
            id={idPassword}
            type={showPassword ? "text" : "password"}
            placeholder="Masukkan password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
          />
        </Field>

        {/* Remember & Forgot */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: -2 }}>
          <label
            htmlFor={idRemember}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 12,
              fontWeight: 600,
              color: "#374151",
              cursor: "pointer",
            }}
          >
            <input
              id={idRemember}
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: "#2A6B9B" }}
            />
            Ingat saya
          </label>
          <Link
            href={PASIEN_PATHS.lupaPassword}
            prefetch
            style={{ fontSize: 12, fontWeight: 700, color: "#2A6B9B", textDecoration: "none" }}
          >
            Lupa password?
          </Link>
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
            marginTop: 6,
            padding: "14px 0",
            background: isLoading
              ? "#9ca3af"
              : "linear-gradient(135deg, #1d4e73, #2A6B9B)",
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
          {isLoading ? "Memproses..." : "Masuk"}
        </button>
      </form>

      {/* ── Divider ─────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 0 18px" }}>
        <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} aria-hidden="true" />
        <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>atau</span>
        <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} aria-hidden="true" />
      </div>

      {/* ── Social login (UI only) ───────────────────── */}
      <button
        type="button"
        aria-label="Masuk dengan Google"
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          padding: "12px 0",
          background: "#fff",
          color: "#374151",
          border: "1.5px solid #e5e7eb",
          borderRadius: 14,
          fontSize: 13,
          fontWeight: 700,
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
          <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
          <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
          <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
        </svg>
        Masuk dengan Google
      </button>

      {/* ── Footer link ─────────────────────────────────── */}
      <p style={{ textAlign: "center", marginTop: 24, fontSize: 13, color: "#6b7280" }}>
        Belum punya akun?{" "}
        <Link
          href={PASIEN_PATHS.register}
          prefetch
          style={{ color: "#2A6B9B", fontWeight: 800, textDecoration: "none" }}
        >
          Daftar di sini
        </Link>
      </p>
    </div>
  );
}

// ── Komponen kecil: Field wrapper ───────────────────────────────────────────
function Field({
  id,
  label,
  icon,
  rightSlot,
  children,
}: {
  id: string;
  label: string;
  icon?: React.ReactNode;
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        style={{
          display: "block",
          fontSize: 12,
          fontWeight: 700,
          color: "#374151",
          marginBottom: 6,
          letterSpacing: "0.02em",
        }}
      >
        {label}
      </label>
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          background: "#fff",
          border: "1.5px solid #e5e7eb",
          borderRadius: 12,
          paddingLeft: icon ? 38 : 14,
          paddingRight: rightSlot ? 8 : 0,
          height: 48,
          transition: "border-color 0.15s ease, box-shadow 0.15s ease",
        }}
      >
        {icon ? (
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              left: 14,
              top: "50%",
              transform: "translateY(-50%)",
              display: "flex",
              alignItems: "center",
            }}
          >
            {icon}
          </span>
        ) : null}
        {children}
        {rightSlot ? <span style={{ marginRight: 4 }}>{rightSlot}</span> : null}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  flex: 1,
  height: "100%",
  border: "none",
  outline: "none",
  background: "transparent",
  fontSize: 14,
  fontWeight: 500,
  color: "#111827",
  fontFamily: "inherit",
};
