"use client";

/**
 * Welcome — Halaman Splash / Pintu Masuk Aplikasi Pasien
 * ────────────────────────────────────────────────────────
 * Pertama kali user membuka aplikasi (atau setelah logout) → ke halaman ini.
 * Memberi 2 jalur: Masuk (akun lama) atau Daftar (akun baru).
 *
 * Visual: hero gradient biru klinik, brand mark tooth, tagline,
 * dua CTA besar yang konsisten dengan TabHome's hero card.
 */

import Link from "next/link";

import { PASIEN_PATHS } from "@/app/components/pasien/pasienRouting";

export default function PasienWelcomePage() {
  return (
    <div
      style={{
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",
        marginLeft: -18,
        marginRight: -18,
        padding: "0 18px",
        paddingBottom: 16,
      }}
    >
      {/* ── Hero gradient ─────────────────────────────── */}
      <div
        style={{
          marginLeft: -18,
          marginRight: -18,
          padding: "48px 24px 56px",
          background:
            "linear-gradient(160deg, #0f3a5c 0%, #1d5a8a 55%, #2A6B9B 100%)",
          borderBottomLeftRadius: 36,
          borderBottomRightRadius: 36,
          position: "relative",
          overflow: "hidden",
          color: "#fff",
        }}
      >
        {/* Decorative blobs */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: -40,
            right: -40,
            width: 180,
            height: 180,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.07)",
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            bottom: -60,
            left: -30,
            width: 160,
            height: 160,
            borderRadius: "50%",
            background: "rgba(115,199,227,0.12)",
          }}
        />

        {/* Brand mark */}
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div
            style={{
              width: 76,
              height: 76,
              borderRadius: 24,
              background: "linear-gradient(180deg, #ffffff 0%, #DFF1F8 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 18px 36px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.95)",
              marginBottom: 18,
            }}
          >
            <svg viewBox="0 0 64 64" width="44" height="44" fill="none" aria-hidden="true">
              <path
                d="M23.5 10.5C16.02 10.5 11 16.25 11 23.85c0 7.6 2.68 16.36 5.85 23.03 1.32 2.8 3.3 5.12 5.94 5.12 2.67 0 4.38-2.33 5.39-5.48l2.18-6.83c.25-.8.99-1.35 1.84-1.35.85 0 1.59.55 1.84 1.35l2.18 6.83c1.01 3.15 2.72 5.48 5.39 5.48 2.64 0 4.62-2.32 5.94-5.12C50.32 40.21 53 31.45 53 23.85c0-7.6-5.02-13.35-12.5-13.35-2.98 0-5.66.97-8.5 2.7-2.84-1.73-5.52-2.7-8.5-2.7Z"
                fill="#FFFFFF"
                stroke="#2A6B9B"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              <path d="M32 19.5v9.5" stroke="#2A6B9B" strokeWidth="2.8" strokeLinecap="round" />
              <path d="M27.25 24.25h9.5" stroke="#2A6B9B" strokeWidth="2.8" strokeLinecap="round" />
            </svg>
          </div>

          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "rgba(186,230,253,0.85)",
              marginBottom: 8,
            }}
          >
            Professional Dental
          </span>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 900,
              letterSpacing: "-0.02em",
              textAlign: "center",
              lineHeight: 1.15,
              marginBottom: 8,
            }}
          >
            Klinik Gigi
          </h1>
          <p
            style={{
              fontSize: 13,
              color: "rgba(199,231,245,0.9)",
              textAlign: "center",
              maxWidth: 280,
              lineHeight: 1.55,
              fontWeight: 500,
            }}
          >
            Senyum sehat di tangan yang tepat. Kelola janji, rekam medis, dan resep dalam satu aplikasi.
          </p>
        </div>
      </div>

      {/* ── Feature highlights ─────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 24, marginBottom: 24 }}>
        {[
          { icon: "📅", label: "Buat Janji" },
          { icon: "💬", label: "Konsultasi" },
          { icon: "📋", label: "Rekam Medis" },
        ].map((feat) => (
          <div
            key={feat.label}
            style={{
              background: "#fff",
              border: "1px solid rgba(115,199,227,0.18)",
              borderRadius: 14,
              padding: "12px 8px",
              textAlign: "center",
              boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
            }}
          >
            <div style={{ fontSize: 22, marginBottom: 6 }}>{feat.icon}</div>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#374151", lineHeight: 1.2 }}>{feat.label}</p>
          </div>
        ))}
      </div>

      {/* ── CTA buttons ────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: "auto" }}>
        <Link
          href={PASIEN_PATHS.login}
          prefetch
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            padding: "14px 0",
            background: "linear-gradient(135deg, #1d4e73, #2A6B9B)",
            color: "#fff",
            border: "none",
            borderRadius: 14,
            fontSize: 14,
            fontWeight: 800,
            cursor: "pointer",
            fontFamily: "inherit",
            boxShadow: "0 8px 24px rgba(42,107,155,0.35)",
            textDecoration: "none",
          }}
        >
          Masuk Akun
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </Link>
        <Link
          href={PASIEN_PATHS.register}
          prefetch
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "14px 0",
            background: "#fff",
            color: "#1d4e73",
            border: "1.5px solid #bfdbfe",
            borderRadius: 14,
            fontSize: 14,
            fontWeight: 800,
            cursor: "pointer",
            fontFamily: "inherit",
            textDecoration: "none",
          }}
        >
          Daftar Sebagai Pasien Baru
        </Link>

        <Link
          href={PASIEN_PATHS.home}
          prefetch
          style={{
            textAlign: "center",
            paddingTop: 8,
            color: "#6b7280",
            fontSize: 12,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Lewati & jelajah dulu →
        </Link>
      </div>
    </div>
  );
}
