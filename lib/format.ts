/**
 * format.ts — Helper formatting locale ID untuk tanggal, jam, dan
 * label enum dari backend.
 *
 * Mengisolasi logic display dari komponen agar:
 *   • Konsisten di semua tab.
 *   • Mudah diuji/diganti (mis. ke locale lain).
 */

import type { AppointmentStatus, AppointmentType } from "./types";

// ── Tanggal: "2026-06-14" → "Sabtu, 14 Jun 2026" ──────────────────────
export function formatTanggalIndo(yyyymmdd: string | null | undefined): string {
  if (!yyyymmdd) return "—";
  // Parse sebagai local date (avoid TZ shift). Format DB date selalu YYYY-MM-DD.
  const d = new Date(`${yyyymmdd}T00:00:00`);
  if (Number.isNaN(d.getTime())) return yyyymmdd;
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

// ── Tanggal singkat: "2026-06-14" → "14 Jun" ──────────────────────────
export function formatTanggalSingkat(yyyymmdd: string | null | undefined): string {
  if (!yyyymmdd) return "—";
  const d = new Date(`${yyyymmdd}T00:00:00`);
  if (Number.isNaN(d.getTime())) return yyyymmdd;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
  }).format(d);
}

// ── Jam: "09:00:00" → "09:00" ─────────────────────────────────────────
export function formatJam(hhmmss: string | null | undefined): string {
  if (!hhmmss) return "—";
  return hhmmss.slice(0, 5);
}

// ── Range jam: "09:00:00" → "09:00 – 09:30 WIB" (default 30 menit) ────
export function formatJamRange(
  hhmmss: string | null | undefined,
  durationMin = 30,
): string {
  if (!hhmmss) return "—";
  const parts = hhmmss.split(":");
  const h = Number(parts[0] ?? "0");
  const m = Number(parts[1] ?? "0");
  if (Number.isNaN(h) || Number.isNaN(m)) return formatJam(hhmmss);

  const startMin = h * 60 + m;
  const endMin = startMin + durationMin;
  const fmt = (mins: number) =>
    `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
  return `${fmt(startMin)} – ${fmt(endMin)} WIB`;
}

// ── Status appointment → label user-friendly ─────────────────────────
const STATUS_LABEL: Record<AppointmentStatus, string> = {
  terjadwal: "Terkonfirmasi",
  menunggu: "Menunggu",
  sedang_ditangani: "Sedang Ditangani",
  selesai: "Selesai",
  dibatalkan: "Dibatalkan",
  tidak_hadir: "Tidak Hadir",
};

export function formatStatusLabel(status: AppointmentStatus): string {
  return STATUS_LABEL[status] ?? status;
}

// ── Jenis appointment → label ─────────────────────────────────────────
const JENIS_LABEL: Record<AppointmentType, string> = {
  konsultasi: "Konsultasi",
  pemeriksaan: "Pemeriksaan",
  kontrol: "Kontrol",
  tindakan: "Tindakan",
  darurat: "Darurat",
};

export function formatJenis(jenis: AppointmentType): string {
  return JENIS_LABEL[jenis] ?? jenis;
}

// ── Bucket filter UI: status backend → "Akan Datang"/"Selesai"/"Dibatalkan"
export type FilterBucket = "Akan Datang" | "Selesai" | "Dibatalkan";

const ACTIVE_STATUSES: ReadonlyArray<AppointmentStatus> = [
  "terjadwal",
  "menunggu",
  "sedang_ditangani",
];

export function statusToBucket(status: AppointmentStatus): FilterBucket {
  if (ACTIVE_STATUSES.includes(status)) return "Akan Datang";
  if (status === "selesai") return "Selesai";
  return "Dibatalkan"; // dibatalkan + tidak_hadir
}

// ── Warna status (untuk badge & gradient) ────────────────────────────
export interface StatusVisual {
  color: string; // text
  bg: string; // background tint
  accentGradient: string; // gradient untuk header strip
}

const STATUS_VISUAL: Record<AppointmentStatus, StatusVisual> = {
  terjadwal: {
    color: "#059669",
    bg: "#dcfce7",
    accentGradient: "linear-gradient(135deg, #059669, #34d399)",
  },
  menunggu: {
    color: "#d97706",
    bg: "#fffbeb",
    accentGradient: "linear-gradient(135deg, #d97706, #fbbf24)",
  },
  sedang_ditangani: {
    color: "#2A6B9B",
    bg: "#eff6ff",
    accentGradient: "linear-gradient(135deg, #1d4e73, #2A6B9B)",
  },
  selesai: {
    color: "#6b7280",
    bg: "#f3f4f6",
    accentGradient: "linear-gradient(135deg, #9ca3af, #d1d5db)",
  },
  dibatalkan: {
    color: "#dc2626",
    bg: "#fef2f2",
    accentGradient: "linear-gradient(135deg, #b91c1c, #ef4444)",
  },
  tidak_hadir: {
    color: "#92400e",
    bg: "#fef3c7",
    accentGradient: "linear-gradient(135deg, #92400e, #d97706)",
  },
};

export function getStatusVisual(status: AppointmentStatus): StatusVisual {
  return STATUS_VISUAL[status] ?? STATUS_VISUAL.terjadwal;
}
