"use client";

/**
 * EmptyState — Tampilan Kosong yang Ramah
 * ─────────────────────────────────────────
 * Dipakai saat data list kosong (TabJadwal, TabRiwayat, FormNotifikasi, dst).
 * Konsisten dengan tema klinik: emoji blob 72px, title bold, deskripsi muted.
 *
 * Mendukung CTA opsional untuk mengarahkan user ke aksi berikutnya.
 */

import type { CSSProperties, ReactNode } from "react";

interface EmptyStateProps {
  emoji: string;
  title: string;
  description?: string;
  /** Tone warna blob — default neutral. */
  tone?: "neutral" | "info" | "success" | "warning" | "danger" | "brand";
  /** Tombol CTA opsional (gradient brand) */
  cta?: {
    label: string;
    onClick: () => void;
    ariaLabel?: string;
  };
  /** Slot kustom di bawah deskripsi (override CTA default jika diperlukan) */
  footer?: ReactNode;
  style?: CSSProperties;
}

const TONE_STYLES: Record<NonNullable<EmptyStateProps["tone"]>, { bg: string; border: string; shadow: string }> = {
  neutral: { bg: "#f8fafc", border: "#e5e7eb", shadow: "rgba(0,0,0,0.06)" },
  info:    { bg: "#eff6ff", border: "#bfdbfe", shadow: "rgba(59,155,212,0.18)" },
  success: { bg: "#ecfdf5", border: "#a7f3d0", shadow: "rgba(16,185,129,0.18)" },
  warning: { bg: "#fffbeb", border: "#fde68a", shadow: "rgba(245,158,11,0.18)" },
  danger:  { bg: "#fef2f2", border: "#fecaca", shadow: "rgba(239,68,68,0.18)" },
  brand:   { bg: "#eff6ff", border: "#bfdbfe", shadow: "rgba(42,107,155,0.18)" },
};

export default function EmptyState({
  emoji,
  title,
  description,
  tone = "neutral",
  cta,
  footer,
  style,
}: EmptyStateProps) {
  const t = TONE_STYLES[tone];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "48px 24px",
        textAlign: "center",
        ...style,
      }}
      role="status"
      aria-live="polite"
    >
      {/* Emoji blob */}
      <div
        aria-hidden="true"
        style={{
          width: 72,
          height: 72,
          borderRadius: "50%",
          background: t.bg,
          border: `1.5px solid ${t.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 30,
          marginBottom: 16,
          boxShadow: `0 4px 16px ${t.shadow}`,
        }}
      >
        {emoji}
      </div>

      <p
        style={{
          fontSize: 15,
          fontWeight: 800,
          color: "#1f2937",
          marginBottom: 6,
          letterSpacing: "-0.01em",
        }}
      >
        {title}
      </p>

      {description ? (
        <p
          style={{
            fontSize: 12,
            color: "#9ca3af",
            lineHeight: 1.6,
            maxWidth: 260,
            marginBottom: cta || footer ? 20 : 0,
          }}
        >
          {description}
        </p>
      ) : null}

      {cta ? (
        <button
          type="button"
          onClick={cta.onClick}
          aria-label={cta.ariaLabel ?? cta.label}
          style={{
            padding: "10px 24px",
            background: "linear-gradient(135deg, #1d4e73, #2A6B9B)",
            color: "#fff",
            border: "none",
            borderRadius: 12,
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
            boxShadow: "0 4px 14px rgba(42,107,155,0.3)",
            transition: "transform 0.15s ease, box-shadow 0.15s ease",
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = "scale(0.96)";
            e.currentTarget.style.boxShadow = "0 2px 8px rgba(42,107,155,0.2)";
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "0 4px 14px rgba(42,107,155,0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "0 4px 14px rgba(42,107,155,0.3)";
          }}
        >
          {cta.label}
        </button>
      ) : null}

      {footer}
    </div>
  );
}
