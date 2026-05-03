"use client";

/**
 * Register Pasien
 * ─────────────────
 * Form pendaftaran akun baru pasien.
 * Sukses → halaman verifikasi OTP.
 */

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import BackHeader from "@/app/components/shared/BackHeader";
import { PASIEN_PATHS } from "@/app/components/pasien/pasienRouting";
import { useAuth } from "@/app/contexts/AuthContext";
import { ApiError } from "@/lib/api";

interface RegisterForm {
  nama: string;
  email: string;
  noHp: string;
  password: string;
  konfirmasi: string;
}

const INITIAL: RegisterForm = {
  nama: "",
  email: "",
  noHp: "",
  password: "",
  konfirmasi: "",
};

export default function PasienRegisterPage() {
  const router = useRouter();
  const formId = useId();
  const { register, login } = useAuth();

  const [form, setForm] = useState<RegisterForm>(INITIAL);
  const [agree, setAgree] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const passwordStrength = useMemo(() => calcStrength(form.password), [form.password]);

  function update<K extends keyof RegisterForm>(key: K, value: RegisterForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (!form.nama.trim() || !form.email.trim() || !form.noHp.trim() || !form.password.trim()) {
      setError("Semua kolom wajib diisi.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }
    if (form.password !== form.konfirmasi) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }
    if (!agree) {
      setError("Anda harus menyetujui Syarat & Ketentuan.");
      return;
    }

    setIsLoading(true);
    try {
      // 1. Buat akun di backend (role default = 'pasien').
      await register({
        email: form.email.trim(),
        password: form.password,
        fullName: form.nama.trim(),
        role: "pasien",
      });

      // 2. Auto-login. Di dev backend pakai email_confirm=true sehingga
      //    user langsung bisa login. Kalau gagal (mis. email confirmation
      //    aktif di prod), arahkan ke halaman verifikasi.
      try {
        await login(form.email.trim(), form.password);
        router.replace(PASIEN_PATHS.home);
      } catch {
        router.push(PASIEN_PATHS.verifikasi);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        // 409 = email exists, 400 = validation
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
      <BackHeader title="Buat Akun Baru" subtitle="Daftar gratis sebagai pasien klinik" onBack={() => router.back()} />

      {/* ── Form ───────────────────────────────────────── */}
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Nama */}
        <Field id={`${formId}-nama`} label="Nama Lengkap">
          <input
            id={`${formId}-nama`}
            type="text"
            placeholder="contoh: Ahmad Surya"
            autoComplete="name"
            value={form.nama}
            onChange={(e) => update("nama", e.target.value)}
            style={inputStyle}
          />
        </Field>

        {/* Email */}
        <Field id={`${formId}-email`} label="Email">
          <input
            id={`${formId}-email`}
            type="email"
            inputMode="email"
            placeholder="ahmad@email.com"
            autoComplete="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            style={inputStyle}
          />
        </Field>

        {/* No HP */}
        <Field id={`${formId}-hp`} label="No. Handphone">
          <span style={{ paddingLeft: 4, paddingRight: 8, fontWeight: 700, color: "#374151", fontSize: 14 }}>+62</span>
          <input
            id={`${formId}-hp`}
            type="tel"
            inputMode="tel"
            placeholder="812 3456 7890"
            autoComplete="tel"
            value={form.noHp}
            onChange={(e) => update("noHp", e.target.value)}
            style={inputStyle}
          />
        </Field>

        {/* Password */}
        <Field
          id={`${formId}-pwd`}
          label="Password"
          rightSlot={
            <button
              type="button"
              aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              onClick={() => setShowPassword((v) => !v)}
              style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", padding: 4, display: "flex" }}
            >
              {showPassword ? eyeOff : eyeOn}
            </button>
          }
        >
          <input
            id={`${formId}-pwd`}
            type={showPassword ? "text" : "password"}
            placeholder="Minimal 8 karakter"
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
            style={inputStyle}
          />
        </Field>

        {/* Password Strength */}
        {form.password ? (
          <div style={{ marginTop: -6 }}>
            <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  style={{
                    flex: 1,
                    height: 4,
                    borderRadius: 4,
                    background: i < passwordStrength.score ? passwordStrength.color : "#e5e7eb",
                    transition: "background 0.2s ease",
                  }}
                />
              ))}
            </div>
            <p style={{ fontSize: 11, color: passwordStrength.color, fontWeight: 700 }}>
              Kekuatan: {passwordStrength.label}
            </p>
          </div>
        ) : null}

        {/* Konfirmasi */}
        <Field id={`${formId}-konfirmasi`} label="Konfirmasi Password">
          <input
            id={`${formId}-konfirmasi`}
            type={showPassword ? "text" : "password"}
            placeholder="Ulangi password"
            autoComplete="new-password"
            value={form.konfirmasi}
            onChange={(e) => update("konfirmasi", e.target.value)}
            style={inputStyle}
          />
        </Field>

        {/* Terms checkbox */}
        <label
          htmlFor={`${formId}-tnc`}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            fontSize: 12,
            color: "#374151",
            cursor: "pointer",
            marginTop: 4,
          }}
        >
          <input
            id={`${formId}-tnc`}
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            style={{ width: 16, height: 16, marginTop: 2, accentColor: "#2A6B9B", flexShrink: 0 }}
          />
          <span style={{ lineHeight: 1.5 }}>
            Saya menyetujui{" "}
            <a href="#" style={{ color: "#2A6B9B", fontWeight: 700 }}>
              Syarat & Ketentuan
            </a>{" "}
            dan{" "}
            <a href="#" style={{ color: "#2A6B9B", fontWeight: 700 }}>
              Kebijakan Privasi
            </a>{" "}
            Klinik Gigi Pro.
          </span>
        </label>

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
            marginTop: 8,
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
          }}
        >
          {isLoading ? "Memproses..." : "Daftar Sekarang"}
        </button>
      </form>

      {/* Footer */}
      <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#6b7280" }}>
        Sudah punya akun?{" "}
        <Link href={PASIEN_PATHS.login} prefetch style={{ color: "#2A6B9B", fontWeight: 800, textDecoration: "none" }}>
          Masuk di sini
        </Link>
      </p>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function calcStrength(pwd: string): { score: number; label: string; color: string } {
  if (!pwd) return { score: 0, label: "—", color: "#9ca3af" };
  let score = 0;
  if (pwd.length >= 8) score += 1;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 1;
  if (/\d/.test(pwd)) score += 1;
  if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
  if (score <= 1) return { score: 1, label: "Lemah", color: "#ef4444" };
  if (score === 2) return { score: 2, label: "Cukup", color: "#f59e0b" };
  if (score === 3) return { score: 3, label: "Kuat", color: "#10b981" };
  return { score: 4, label: "Sangat kuat", color: "#059669" };
}

function Field({
  id,
  label,
  rightSlot,
  children,
}: {
  id: string;
  label: string;
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6, letterSpacing: "0.02em" }}
      >
        {label}
      </label>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          background: "#fff",
          border: "1.5px solid #e5e7eb",
          borderRadius: 12,
          paddingLeft: 14,
          paddingRight: rightSlot ? 8 : 0,
          height: 48,
        }}
      >
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

const eyeOn = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const eyeOff = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
    <path d="m2 2 20 20" />
  </svg>
);
