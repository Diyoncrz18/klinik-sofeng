"use client";

/**
 * TabRiwayat — Halaman Rekam Medis (Redesigned)
 * ───────────────────────────────────────────────
 * Design konsisten dengan beranda & jadwal:
 * - Sticky header + summary stats
 * - Filter underline tabs
 * - Timeline vertikal dengan connector line
 * - Record card premium dengan gradient icon
 * - Billing info yang jelas
 * - Empty & load-more state
 */

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { listAppointments } from "@/lib/appointments";
import { appointmentTitle, dokterFullName, dokterSpesialisasi } from "@/lib/appointment-display";
import type { Appointment, AppointmentType } from "@/lib/types";
import { PASIEN_DYNAMIC } from "./pasienRouting";

type RecordFilter = "Semua" | "Tindakan" | "Konsultasi" | "Resep";

// Mapping: filter UI → jenis appointment di backend.
// 'Resep' belum punya backing data (perlu endpoint rekam_medis) → empty.
const JENIS_PER_FILTER: Record<RecordFilter, AppointmentType[] | null> = {
  Semua: null, // null = tampilkan semua jenis
  Tindakan: ["tindakan", "kontrol"],
  Konsultasi: ["konsultasi", "pemeriksaan"],
  Resep: [], // empty array → tidak ada match
};

// Palette icon per jenis appointment.
const JENIS_ICON: Record<
  AppointmentType,
  { gradient: string; accent: string; icon: React.ReactNode }
> = {
  konsultasi: {
    gradient: "linear-gradient(135deg, #4c1d95, #7c3aed)",
    accent: "#7c3aed",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  pemeriksaan: {
    gradient: "linear-gradient(135deg, #1d4e73, #2A6B9B)",
    accent: "#2A6B9B",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
        <path d="M22 12A10 10 0 0 0 12 2v10z" />
      </svg>
    ),
  },
  kontrol: {
    gradient: "linear-gradient(135deg, #064e3b, #059669)",
    accent: "#059669",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
      </svg>
    ),
  },
  tindakan: {
    gradient: "linear-gradient(135deg, #78350f, #d97706)",
    accent: "#d97706",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="18" cy="18" r="3" /><circle cx="6" cy="6" r="3" />
        <path d="M13 6h3a2 2 0 0 1 2 2v7" /><path d="m11 18-5-5 5-5" />
      </svg>
    ),
  },
  darurat: {
    gradient: "linear-gradient(135deg, #7f1d1d, #dc2626)",
    accent: "#dc2626",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
        <path d="M12 9v4" /><path d="M12 17h.01" />
      </svg>
    ),
  },
};

interface RecordItem {
  id: string;
  category: RecordFilter;
  date: string;
  title: string;
  doctor: string;
  specialty: string;
  description: string;
  iconGradient: string;
  accentColor: string;
  icon: React.ReactNode;
}

function toRecordItem(a: Appointment): RecordItem {
  const palette = JENIS_ICON[a.jenis] ?? JENIS_ICON.konsultasi;
  const description =
    a.catatan_dokter?.trim() ||
    a.keluhan?.trim() ||
    "Tidak ada catatan untuk kunjungan ini.";
  return {
    id: a.id,
    category:
      a.jenis === "tindakan" || a.jenis === "kontrol" ? "Tindakan"
      : a.jenis === "konsultasi" || a.jenis === "pemeriksaan" ? "Konsultasi"
      : "Tindakan",
    date: formatTanggalShort(a.tanggal),
    title: appointmentTitle(a),
    doctor: dokterFullName(a),
    specialty: dokterSpesialisasi(a),
    description,
    iconGradient: palette.gradient,
    accentColor: palette.accent,
    icon: palette.icon,
  };
}

function formatTanggalShort(yyyymmdd: string): string {
  const d = new Date(`${yyyymmdd}T00:00:00`);
  if (Number.isNaN(d.getTime())) return yyyymmdd;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

// ── Component ───────────────────────────────────────────────────────────────────
export default function TabRiwayat() {
  const [activeFilter, setActiveFilter] = useState<RecordFilter>("Semua");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    listAppointments({ status: ["selesai"] })
      .then((items) => {
        if (!alive) return;
        setAppointments(items);
        setErrorMsg(null);
      })
      .catch((err: unknown) => {
        if (!alive) return;
        setErrorMsg(
          err instanceof Error ? err.message : "Gagal memuat riwayat.",
        );
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const records = useMemo<RecordItem[]>(() => {
    return appointments
      .slice()
      .sort((a, b) => {
        // Terbaru di atas: tanggal desc, jam desc.
        if (a.tanggal !== b.tanggal) return b.tanggal.localeCompare(a.tanggal);
        return b.jam.localeCompare(a.jam);
      })
      .map(toRecordItem);
  }, [appointments]);

  const filters: { key: RecordFilter; count?: number }[] = [
    { key: "Semua", count: records.length },
    {
      key: "Tindakan",
      count: appointments.filter((a) =>
        (JENIS_PER_FILTER.Tindakan ?? []).includes(a.jenis),
      ).length,
    },
    {
      key: "Konsultasi",
      count: appointments.filter((a) =>
        (JENIS_PER_FILTER.Konsultasi ?? []).includes(a.jenis),
      ).length,
    },
    { key: "Resep", count: 0 },
  ];

  const filtered = useMemo<RecordItem[]>(() => {
    if (activeFilter === "Semua") return records;
    if (activeFilter === "Resep") return [];
    const allowed = JENIS_PER_FILTER[activeFilter] ?? [];
    return records.filter((r) => {
      const a = appointments.find((x) => x.id === r.id);
      return a ? allowed.includes(a.jenis) : false;
    });
  }, [activeFilter, records, appointments]);

  // Total kunjungan tercatat (biaya belum ada di domain).
  const totalLabel = `${records.length} kunjungan`;

  return (
    <div style={{ position: "relative", paddingBottom: 16 }}>

      {/* ═══════════════════════════════════════
          STICKY HEADER
          ═══════════════════════════════════════ */}
      <div className="sticky-tab-header">
        {/* Title + search */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 17, fontWeight: 900, color: "#111827", letterSpacing: "-0.02em" }}>
              Riwayat
            </h2>
            <p style={{ fontSize: 11, color: "#6b7280", marginTop: 2, fontWeight: 500 }}>
              Rekam Medis & Penagihan
            </p>
          </div>
          <button
            id="btn-cari-rekam"
            aria-label="Cari rekam medis"
            style={{
              width: 40, height: 40, borderRadius: 12,
              background: "#fff", border: "1.5px solid #e5e7eb",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "#4b5563",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
          </button>
        </div>

        {/* Summary pill */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "#f8fafc", borderRadius: 10, padding: "8px 12px",
          border: "1px solid #f1f5f9", marginBottom: 14, marginTop: 14,
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: "50%",
            background: "#2A6B9B", flexShrink: 0,
          }} />
          <p style={{ fontSize: 11, color: "#6b7280", fontWeight: 500 }}>
            Riwayat kunjungan:
            <span style={{ fontWeight: 800, color: "#111827", marginLeft: 4 }}>
              {loading ? "—" : totalLabel}
            </span>
          </p>
        </div>

        {/* Filter underline tabs */}
        <div className="no-scrollbar" style={{
          display: "flex", gap: 0, borderBottom: "1.5px solid #e5e7eb", overflowX: "auto",
        }}>
          {filters.map(({ key, count }) => {
            const isActive = activeFilter === key;
            return (
              <button
                key={key}
                id={`filter-riwayat-${key.toLowerCase()}`}
                onClick={() => setActiveFilter(key)}
                style={{
                  position: "relative",
                  padding: "10px 14px",
                  background: "none", border: "none",
                  cursor: "pointer", fontFamily: "inherit",
                  fontSize: 13, fontWeight: isActive ? 800 : 500,
                  color: isActive ? "#111827" : "#9ca3af",
                  transition: "all 0.2s ease",
                  whiteSpace: "nowrap",
                }}
              >
                {key}
                {count !== undefined && count > 0 && (
                  <span style={{
                    marginLeft: 5,
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    minWidth: 16, height: 16, borderRadius: 99,
                    padding: "0 4px",
                    background: isActive ? "#059669" : "#e5e7eb",
                    color: isActive ? "#fff" : "#9ca3af",
                    fontSize: 9, fontWeight: 800,
                  }}>
                    {count}
                  </span>
                )}
                {isActive && (
                  <span style={{
                    position: "absolute", bottom: -1, left: 0, right: 0,
                    height: 2, background: "#059669", borderRadius: 2,
                  }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Error notice */}
      {errorMsg && (
        <div
          role="alert"
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 14,
            padding: "12px 14px",
            fontSize: 12,
            color: "#b91c1c",
            fontWeight: 600,
            marginTop: 12,
          }}
        >
          ⚠ {errorMsg}
        </div>
      )}

      {/* ═══════════════════════════════════════
          TIMELINE LIST
          ═══════════════════════════════════════ */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 12 }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              aria-busy="true"
              style={{
                height: 96,
                borderRadius: 16,
                background: "#f1f5f9",
                animation: "pasienPulse 1.5s ease-in-out infinite",
              }}
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyRiwayat filter={activeFilter} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 0, paddingTop: 4 }}>
          {filtered.map((record, index) => (
            <TimelineItem
              key={record.id}
              record={record}
              isLast={index === filtered.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Timeline Item ──────────────────────────────────────────────────────── */

function TimelineItem({ record, isLast }: { record: RecordItem; isLast: boolean }) {
  const router = useRouter();
  return (
    <div style={{ display: "flex", gap: 12 }}>
      {/* Timeline column */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, width: 36 }}>
        {/* Icon circle */}
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          background: record.iconGradient,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 4px 10px ${record.accentColor}40`,
          flexShrink: 0,
        }}>
          {record.icon}
        </div>
        {/* Connector line */}
        {!isLast && (
          <div style={{
            width: 2, flex: 1, minHeight: 24,
            background: "linear-gradient(to bottom, #e5e7eb, transparent)",
            marginTop: 4, marginBottom: 4,
          }} aria-hidden="true" />
        )}
      </div>

      {/* Card */}
      <div style={{
        flex: 1, marginBottom: isLast ? 0 : 12,
        background: "#fff",
        border: "1px solid rgba(115,199,227,0.12)",
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
      }}>
        {/* Thin accent top border */}
        <div style={{ height: 3, background: record.iconGradient }} aria-hidden="true" />

        <div style={{ padding: "12px 14px" }}>
          {/* Date badge + Status */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{
              fontSize: 9, fontWeight: 800, color: "#9ca3af",
              textTransform: "uppercase", letterSpacing: "0.08em",
            }}>
              {record.date}
            </span>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              padding: "3px 8px", borderRadius: 999,
              background: "#dcfce7", border: "1px solid #bbf7d0",
              fontSize: 9, fontWeight: 800, color: "#059669", letterSpacing: "0.04em",
            }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m9 11 3 3L22 4" />
              </svg>
              SELESAI
            </span>
          </div>

          {/* Title + Doctor */}
          <h4 style={{ fontSize: 14, fontWeight: 800, color: "#111827", marginBottom: 3, letterSpacing: "-0.01em" }}>
            {record.title}
          </h4>
          <p style={{ fontSize: 11, color: "#6b7280", marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#9ca3af"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="8" r="4" /><path d="M20 21a8 8 0 1 0-16 0" />
            </svg>
            {record.doctor}
            <span style={{ color: "#2A6B9B", fontWeight: 700 }}>· {record.specialty}</span>
          </p>

          {/* Description */}
          <p style={{
            fontSize: 11, color: "#9ca3af", lineHeight: 1.6,
            background: "#f8fafc", borderRadius: 8, padding: "8px 10px",
            border: "1px solid #f1f5f9", marginBottom: 10,
          }}>
            {record.description}
          </p>

          {/* Footer: action only (biaya/payment belum ada di domain) */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
            <button
              onClick={() => router.push(PASIEN_DYNAMIC.riwayatDetail(String(record.id)))}
              aria-label={`Detail ${record.title}`}
              style={{
                display: "flex", alignItems: "center", gap: 4,
                fontSize: 11, fontWeight: 700, color: "#2A6B9B",
                background: "#eff6ff", border: "none",
                borderRadius: 8, padding: "5px 10px",
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              Detail
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Empty State ────────────────────────────────────────────────────────── */

function EmptyRiwayat({ filter }: { filter: RecordFilter }) {
  const config: Record<RecordFilter, { emoji: string; title: string; desc: string }> = {
    Semua: { emoji: "📋", title: "Belum Ada Catatan", desc: "Rekam medis Anda akan muncul setelah kunjungan pertama." },
    Tindakan: { emoji: "🦷", title: "Belum Ada Tindakan", desc: "Tindakan yang sudah dilakukan akan tersimpan di sini." },
    Konsultasi: { emoji: "💬", title: "Belum Ada Konsultasi", desc: "Riwayat konsultasi dokter akan ditampilkan di sini." },
    Resep: { emoji: "💊", title: "Belum Ada Resep", desc: "Resep yang diberikan dokter akan tersimpan di sini." },
  };
  const c = config[filter];

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "52px 24px", textAlign: "center",
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: "50%",
        background: "#f8fafc", border: "1.5px solid #e5e7eb",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 30, marginBottom: 16,
        boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
      }}>
        {c.emoji}
      </div>
      <p style={{ fontSize: 15, fontWeight: 800, color: "#1f2937", marginBottom: 6 }}>{c.title}</p>
      <p style={{ fontSize: 12, color: "#9ca3af", lineHeight: 1.6, maxWidth: 240 }}>{c.desc}</p>
    </div>
  );
}
