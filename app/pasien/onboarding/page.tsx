"use client";

/**
 * Onboarding — 3 Slide Pengenalan Aplikasi Pasien
 * ─────────────────────────────────────────────────
 * Memperkenalkan 3 fitur utama: Buat Janji, Konsultasi Online, Rekam Medis.
 * User dapat skip kapan saja dan langsung ke welcome / login.
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { PASIEN_PATHS } from "@/app/components/pasien/pasienRouting";

interface Slide {
  emoji: string;
  title: string;
  description: string;
  gradient: string;
  shadow: string;
}

const SLIDES: Slide[] = [
  {
    emoji: "📅",
    title: "Buat Janji Lebih Mudah",
    description:
      "Pilih layanan, dokter, dan jadwal favoritmu hanya dalam beberapa ketukan. Tidak perlu antri lewat telepon lagi.",
    gradient: "linear-gradient(160deg, #1d4e73 0%, #2A6B9B 60%, #3b9bd4 100%)",
    shadow: "rgba(42,107,155,0.35)",
  },
  {
    emoji: "💬",
    title: "Konsultasi Online Kapan Saja",
    description:
      "Chat atau video call dengan dokter gigi tepercaya tanpa harus keluar rumah. Cocok untuk keluhan ringan & follow-up.",
    gradient: "linear-gradient(160deg, #064e3b 0%, #059669 60%, #34d399 100%)",
    shadow: "rgba(5,150,105,0.35)",
  },
  {
    emoji: "📋",
    title: "Rekam Medis di Genggaman",
    description:
      "Akses riwayat tindakan, resep, dan tagihan kapanpun. Semua tersinkron langsung dari sistem klinik.",
    gradient: "linear-gradient(160deg, #4c1d95 0%, #6d28d9 60%, #a78bfa 100%)",
    shadow: "rgba(109,40,217,0.35)",
  },
];

export default function PasienOnboardingPage() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;

  const goNext = () => {
    if (isLast) {
      router.push(PASIEN_PATHS.login);
      return;
    }
    setIndex((i) => i + 1);
  };

  return (
    <div
      style={{
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        marginLeft: -18,
        marginRight: -18,
        padding: "0 18px",
      }}
    >
      {/* ── Skip button ──────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 16, paddingBottom: 8 }}>
        <Link
          href={PASIEN_PATHS.welcome}
          prefetch
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "#6b7280",
            background: "#f3f4f6",
            padding: "6px 12px",
            borderRadius: 999,
            textDecoration: "none",
          }}
        >
          Lewati →
        </Link>
      </div>

      {/* ── Hero illustration ─────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "16px 8px" }}>
        <div
          style={{
            width: 168,
            height: 168,
            borderRadius: "50%",
            background: slide.gradient,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 18px 48px ${slide.shadow}`,
            marginBottom: 28,
          }}
        >
          <span style={{ fontSize: 64 }} aria-hidden="true">
            {slide.emoji}
          </span>
        </div>

        <h1
          style={{
            fontSize: 22,
            fontWeight: 900,
            color: "#111827",
            textAlign: "center",
            letterSpacing: "-0.02em",
            marginBottom: 10,
            maxWidth: 280,
            lineHeight: 1.2,
          }}
        >
          {slide.title}
        </h1>
        <p
          style={{
            fontSize: 13,
            color: "#6b7280",
            textAlign: "center",
            lineHeight: 1.6,
            maxWidth: 300,
            fontWeight: 500,
          }}
        >
          {slide.description}
        </p>
      </div>

      {/* ── Pagination dots + CTA ─────────────────────── */}
      <div style={{ paddingBottom: 16, display: "flex", flexDirection: "column", gap: 18 }}>
        {/* Dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
          {SLIDES.map((_, i) => (
            <span
              key={i}
              aria-hidden="true"
              style={{
                width: i === index ? 22 : 7,
                height: 7,
                borderRadius: 999,
                background: i === index ? "#2A6B9B" : "#e5e7eb",
                transition: "all 0.25s ease",
                display: "inline-block",
              }}
            />
          ))}
        </div>

        {/* Next / Mulai */}
        <button
          type="button"
          onClick={goNext}
          style={{
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
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          {isLast ? "Mulai Sekarang" : "Lanjut"}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
