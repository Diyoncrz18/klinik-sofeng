"use client";

/**
 * BackHeader — Sticky Header dengan Tombol Kembali
 * ──────────────────────────────────────────────────
 * Komponen header reusable yang dipakai di seluruh sub-view pasien
 * (Form Buat Janji, Notifikasi, Tiket, Detail Riwayat, dll).
 *
 * Pola visual: sticky top, glassmorphism backdrop, tombol kembali 38×38
 * dengan border tipis, disusul title + subtitle. Konsisten dengan
 * `pasienStyles.ts` dan tema biru #2A6B9B.
 *
 * Props:
 *   - title: judul halaman (wajib)
 *   - subtitle: deskripsi singkat (opsional)
 *   - onBack: handler tombol kembali (wajib — biasanya `router.back()`)
 *   - rightSlot: ReactNode opsional untuk slot kanan (misal tombol "Tandai Dibaca")
 */

import type { ReactNode } from "react";

interface BackHeaderProps {
  title: string;
  subtitle?: string;
  onBack: () => void;
  rightSlot?: ReactNode;
  /**
   * Kalau true, container akan mengabaikan margin negatif (-18px).
   * Default false (mengikuti pola `.pasien-main` yang punya horizontal padding 18px).
   */
  fullBleed?: boolean;
}

export default function BackHeader({
  title,
  subtitle,
  onBack,
  rightSlot,
  fullBleed = false,
}: BackHeaderProps) {
  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        background: "rgba(247,249,251,0.97)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        marginLeft: fullBleed ? 0 : -18,
        marginRight: fullBleed ? 0 : -18,
        paddingLeft: 18,
        paddingRight: 18,
        paddingTop: 16,
        paddingBottom: 14,
        borderBottom: "1px solid #f1f5f9",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        marginBottom: 20,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Tombol kembali */}
        <button
          type="button"
          onClick={onBack}
          aria-label="Kembali"
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            background: "#fff",
            border: "1.5px solid #e5e7eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            transition: "transform 0.15s ease, border-color 0.15s ease",
            fontFamily: "inherit",
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.93)")}
          onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#2A6B9B")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#374151"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>

        {/* Title + subtitle */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2
            style={{
              fontSize: 17,
              fontWeight: 900,
              color: "#111827",
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {title}
          </h2>
          {subtitle ? (
            <p
              style={{
                fontSize: 11,
                color: "#6b7280",
                marginTop: 2,
                fontWeight: 500,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {subtitle}
            </p>
          ) : null}
        </div>

        {/* Slot kanan (opsional) */}
        {rightSlot ? <div style={{ flexShrink: 0 }}>{rightSlot}</div> : null}
      </div>
    </div>
  );
}
