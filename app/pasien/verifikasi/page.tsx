"use client";

/**
 * Verifikasi OTP Pasien
 * ───────────────────────
 * 6-digit OTP entry dengan auto-advance focus + countdown resend.
 * Sukses → halaman home pasien.
 */

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import BackHeader from "@/app/components/shared/BackHeader";
import { PASIEN_PATHS } from "@/app/components/pasien/pasienRouting";

const OTP_LENGTH = 6;
const RESEND_SECONDS = 45;

export default function PasienVerifikasiPage() {
  const router = useRouter();
  const formId = useId();
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState("");
  const [verified, setVerified] = useState(false);

  const otp = digits.join("");
  const isComplete = otp.length === OTP_LENGTH;

  // Countdown timer for resend
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [secondsLeft]);

  // Auto-focus first input on mount
  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  function handleChange(index: number, raw: string) {
    setError("");
    const value = raw.replace(/\D/g, "").slice(0, 1);

    setDigits((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });

    if (value && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
    if (event.key === "ArrowLeft" && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
    if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  }

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    event.preventDefault();
    setError("");
    const next = Array(OTP_LENGTH).fill("");
    for (let i = 0; i < pasted.length; i += 1) next[i] = pasted[i];
    setDigits(next);
    inputsRef.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  }

  async function handleVerify(event: React.FormEvent) {
    event.preventDefault();
    if (!isComplete) {
      setError("Masukkan 6 digit kode terlebih dahulu.");
      return;
    }
    setIsVerifying(true);
    await new Promise((resolve) => setTimeout(resolve, 900));
    setIsVerifying(false);
    setVerified(true);
    setTimeout(() => router.push(PASIEN_PATHS.home), 1300);
  }

  function handleResend() {
    if (secondsLeft > 0) return;
    setSecondsLeft(RESEND_SECONDS);
    setDigits(Array(OTP_LENGTH).fill(""));
    inputsRef.current[0]?.focus();
  }

  // ── Success state ──────────────────────────────────────────────────────────
  if (verified) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          textAlign: "center",
          padding: "32px 24px",
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
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: "#111827", marginBottom: 8 }}>Akun Terverifikasi! 🎉</h2>
        <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6, maxWidth: 280 }}>
          Selamat, akun Anda berhasil diverifikasi. Mengarahkan ke beranda...
        </p>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 24 }}>
      <BackHeader title="Verifikasi" subtitle="Masukkan kode 6 digit" onBack={() => router.back()} />

      {/* ── Hero ─────────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "8px 16px 28px" }}>
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
            <rect width="20" height="16" x="2" y="4" rx="2" />
            <path d="m22 7-10 5L2 7" />
          </svg>
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: "#111827", letterSpacing: "-0.02em", marginBottom: 6 }}>
          Verifikasi Akun
        </h1>
        <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.5, maxWidth: 300 }}>
          Kami telah mengirim kode 6 digit ke{" "}
          <span style={{ fontWeight: 800, color: "#111827" }}>+62 812-XXXX-7890</span>. Periksa SMS Anda.
        </p>
      </div>

      {/* ── OTP Inputs ──────────────────────────────────── */}
      <form onSubmit={handleVerify}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "0 4px", marginBottom: 16 }}>
          {digits.map((digit, index) => (
            <input
              key={index}
              id={`${formId}-otp-${index}`}
              ref={(el) => {
                inputsRef.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              autoComplete="one-time-code"
              aria-label={`Digit ke-${index + 1}`}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              style={{
                width: 48,
                height: 56,
                textAlign: "center",
                fontSize: 22,
                fontWeight: 800,
                color: "#111827",
                background: "#fff",
                border: digit ? "2px solid #2A6B9B" : "1.5px solid #e5e7eb",
                borderRadius: 12,
                outline: "none",
                fontFamily: "inherit",
                boxShadow: digit ? "0 0 0 3px rgba(42,107,155,0.12)" : "none",
                transition: "all 0.15s ease",
              }}
            />
          ))}
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
              marginBottom: 12,
            }}
          >
            ⚠️ {error}
          </p>
        ) : null}

        {/* Submit */}
        <button
          type="submit"
          disabled={!isComplete || isVerifying}
          style={{
            width: "100%",
            padding: "14px 0",
            background: !isComplete || isVerifying ? "#cbd5e1" : "linear-gradient(135deg, #1d4e73, #2A6B9B)",
            color: "#fff",
            border: "none",
            borderRadius: 14,
            fontSize: 14,
            fontWeight: 800,
            cursor: !isComplete || isVerifying ? "not-allowed" : "pointer",
            fontFamily: "inherit",
            boxShadow: !isComplete || isVerifying ? "none" : "0 8px 24px rgba(42,107,155,0.35)",
            transition: "all 0.2s ease",
          }}
        >
          {isVerifying ? "Memverifikasi..." : "Verifikasi"}
        </button>
      </form>

      {/* Resend OTP */}
      <div style={{ marginTop: 20, textAlign: "center" }}>
        <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Tidak menerima kode?</p>
        {secondsLeft > 0 ? (
          <p style={{ fontSize: 13, fontWeight: 700, color: "#9ca3af" }}>
            Kirim ulang dalam{" "}
            <span style={{ color: "#374151" }}>0:{secondsLeft.toString().padStart(2, "0")}</span>
          </p>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: "#2A6B9B",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "inherit",
              textDecoration: "underline",
            }}
          >
            Kirim Ulang Kode
          </button>
        )}
      </div>

      {/* Footer */}
      <p style={{ textAlign: "center", marginTop: 24, fontSize: 12, color: "#9ca3af" }}>
        Salah nomor?{" "}
        <Link href={PASIEN_PATHS.register} prefetch style={{ color: "#2A6B9B", fontWeight: 800, textDecoration: "none" }}>
          Ubah pendaftaran
        </Link>
      </p>
    </div>
  );
}
