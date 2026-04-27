"use client";

/**
 * Badge — Status Pill / Chip
 * ────────────────────────────
 * Badge konsisten dengan tema klinik. Mendukung varian semantik
 * (success, warning, danger, info, neutral, brand) dan ukuran (sm, md).
 *
 * Pola token mengikuti palette yang sudah dipakai di TabRiwayat,
 * TabJadwal, TabHome (Dokter dashboard juga memakai pola serupa
 * dengan bg soft-tone).
 */

import type { CSSProperties, ReactNode } from "react";

export type BadgeVariant =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "brand"
  | "neutral"
  | "purple";

export type BadgeSize = "sm" | "md";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  /** Tampilkan dot di kiri label (mis. live indicator) */
  withDot?: boolean;
  /** Override style ad-hoc */
  style?: CSSProperties;
  /** ARIA label override (default mengikuti children) */
  ariaLabel?: string;
}

const VARIANT_STYLES: Record<BadgeVariant, { color: string; bg: string; border: string; dot: string }> = {
  success: { color: "#059669", bg: "#dcfce7", border: "#bbf7d0", dot: "#10b981" },
  warning: { color: "#d97706", bg: "#fef3c7", border: "#fde68a", dot: "#f59e0b" },
  danger:  { color: "#dc2626", bg: "#fee2e2", border: "#fecaca", dot: "#ef4444" },
  info:    { color: "#2A6B9B", bg: "#eff6ff", border: "#bfdbfe", dot: "#3b9bd4" },
  brand:   { color: "#1d4e73", bg: "#dbeafe", border: "#bfdbfe", dot: "#2A6B9B" },
  neutral: { color: "#6b7280", bg: "#f3f4f6", border: "#e5e7eb", dot: "#9ca3af" },
  purple:  { color: "#7c3aed", bg: "#ede9fe", border: "#ddd6fe", dot: "#a78bfa" },
};

const SIZE_STYLES: Record<BadgeSize, { fontSize: number; padding: string; gap: number; dot: number }> = {
  sm: { fontSize: 9,  padding: "3px 8px",  gap: 4, dot: 6 },
  md: { fontSize: 11, padding: "4px 10px", gap: 5, dot: 7 },
};

export default function Badge({
  children,
  variant = "info",
  size = "md",
  withDot = false,
  style,
  ariaLabel,
}: BadgeProps) {
  const v = VARIANT_STYLES[variant];
  const s = SIZE_STYLES[size];

  return (
    <span
      role="status"
      aria-label={ariaLabel}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: s.gap,
        padding: s.padding,
        borderRadius: 999,
        background: v.bg,
        border: `1px solid ${v.border}`,
        color: v.color,
        fontSize: s.fontSize,
        fontWeight: 800,
        letterSpacing: "0.04em",
        lineHeight: 1.1,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {withDot ? (
        <span
          aria-hidden="true"
          style={{
            width: s.dot,
            height: s.dot,
            borderRadius: "50%",
            background: v.dot,
            display: "inline-block",
            flexShrink: 0,
          }}
        />
      ) : null}
      {children}
    </span>
  );
}
