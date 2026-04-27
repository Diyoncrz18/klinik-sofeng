"use client";

/**
 * TabJadwal — Halaman Jadwal Saya (Redesigned)
 * ──────────────────────────────────────────────
 * Design konsisten dengan beranda:
 * - Sticky header bergradient
 * - Filter pill dengan underline indicator (bukan filled)
 * - Appointment card premium dengan gradient accent, info lengkap
 * - Empty state ilustratif
 * - Floating CTA buat janji
 */

import { useState } from "react";
import { useRouter } from "next/navigation";

import { PASIEN_PATHS, PASIEN_DYNAMIC } from "./pasienRouting";

type FilterStatus = "Akan Datang" | "Selesai" | "Dibatalkan";

const APPOINTMENTS: AppointmentData[] = [
  {
    filter: "Akan Datang",
    id: "AP-88219",
    title: "Kontrol Kawat Gigi",
    doctor: "Dr. Rina Santoso, Sp.KG",
    specialty: "Sp. Ortodonti",
    date: "Sabtu, 14 Jun 2026",
    time: "09:00 – 09:30 WIB",
    location: "Ruang 3 – Lantai 2",
    statusLabel: "Terkonfirmasi",
    statusColor: "#059669",
    statusBg: "#dcfce7",
    accentGradient: "linear-gradient(135deg, #059669, #34d399)",
    type: "upcoming",
  },
  {
    filter: "Selesai",
    id: "AP-88102",
    title: "Pembersihan Karang Gigi",
    doctor: "Dr. Rina Santoso, Sp.KG",
    specialty: "Sp. KG",
    date: "Kamis, 22 Mei 2026",
    time: "10:00 – 10:30 WIB",
    location: "Ruang 2 – Lantai 1",
    statusLabel: "Selesai",
    statusColor: "#6b7280",
    statusBg: "#f3f4f6",
    accentGradient: "linear-gradient(135deg, #9ca3af, #d1d5db)",
    type: "completed",
  },
];

interface AppointmentData {
  filter: FilterStatus;
  id: string;
  title: string;
  doctor: string;
  specialty: string;
  date: string;
  time: string;
  location: string;
  statusLabel: string;
  statusColor: string;
  statusBg: string;
  accentGradient: string;
  type: "upcoming" | "completed";
}

export default function TabJadwal() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("Akan Datang");

  const filters: { key: FilterStatus; count?: number }[] = [
    { key: "Akan Datang", count: 1 },
    { key: "Selesai", count: 1 },
    { key: "Dibatalkan" },
  ];

  const visible = APPOINTMENTS.filter((a) => a.filter === activeFilter);

  return (
    <div style={{ position: "relative", paddingBottom: 16 }}>

      {/* ═══════════════════════════════════════
          STICKY HEADER
          ═══════════════════════════════════════ */}
      <div className="sticky-tab-header">
        {/* Title row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: "#111827", letterSpacing: "-0.03em", lineHeight: 1 }}>
              Jadwal Saya
            </h2>
            <p style={{ fontSize: 12, color: "#6b7280", marginTop: 4, fontWeight: 500 }}>
              {activeFilter === "Akan Datang" ? "1 janji temu menunggu" : "Riwayat kunjungan Anda"}
            </p>
          </div>

          {/* Add button */}
          <button
            id="btn-tambah-jadwal"
            aria-label="Buat jadwal baru"
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "9px 14px",
              background: "linear-gradient(135deg, #1d4e73, #2A6B9B)",
              color: "#fff", border: "none", borderRadius: 12,
              fontSize: 12, fontWeight: 700, cursor: "pointer",
              boxShadow: "0 4px 14px rgba(42,107,155,0.35)",
              fontFamily: "inherit",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
            }}
            onClick={() => router.push(PASIEN_PATHS.buatJanji)}
            onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.95)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(42,107,155,0.2)"; }}
            onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(42,107,155,0.35)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(42,107,155,0.35)"; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 5v14" /><path d="M5 12h14" />
            </svg>
            Buat Janji
          </button>
        </div>

        {/* Filter tabs with underline */}
        <div style={{ display: "flex", gap: 0, borderBottom: "1.5px solid #e5e7eb" }}>
          {filters.map(({ key, count }) => {
            const isActive = activeFilter === key;
            return (
              <button
                key={key}
                id={`filter-jadwal-${key.toLowerCase().replace(" ", "-")}`}
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
                {count !== undefined && (
                  <span style={{
                    marginLeft: 5,
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    width: 16, height: 16, borderRadius: "50%",
                    background: isActive ? "#2A6B9B" : "#e5e7eb",
                    color: isActive ? "#fff" : "#9ca3af",
                    fontSize: 9, fontWeight: 800,
                  }}>
                    {count}
                  </span>
                )}
                {/* Active underline */}
                {isActive && (
                  <span style={{
                    position: "absolute", bottom: -1, left: 0, right: 0,
                    height: 2, background: "#2A6B9B", borderRadius: 2,
                  }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════
          CONTENT
          ═══════════════════════════════════════ */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingTop: 4 }}>
        {visible.length === 0 ? (
          <EmptyJadwal activeFilter={activeFilter} />
        ) : (
          visible.map((apt) => (
            <AppointmentCard key={apt.id} data={apt} />
          ))
        )}
      </div>

    </div>
  );
}

/* ─── Appointment Card ───────────────────────────────────────────────────── */

function AppointmentCard({ data }: { data: AppointmentData }) {
  const router = useRouter();
  const isUpcoming = data.type === "upcoming";

  return (
    <article style={{
      background: "#fff",
      border: "1px solid rgba(115,199,227,0.12)",
      borderRadius: 20,
      overflow: "hidden",
      boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
    }}>
      {/* Gradient header strip */}
      <div style={{
        background: data.accentGradient,
        padding: "12px 16px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Pulse dot (only upcoming) */}
          {isUpcoming && (
            <span style={{
              width: 8, height: 8, borderRadius: "50%",
              background: "#fff",
              boxShadow: "0 0 8px rgba(255,255,255,0.9)",
              display: "inline-block",
              flexShrink: 0,
            }} aria-hidden="true" />
          )}
          <span style={{
            fontSize: 11, fontWeight: 800, color: "#fff",
            letterSpacing: "0.06em", textTransform: "uppercase",
          }}>
            {data.statusLabel}
          </span>
        </div>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>
          ID: {data.id}
        </span>
      </div>

      {/* Card body */}
      <div style={{ padding: "16px 16px 14px" }}>
        {/* Title + Doctor */}
        <h3 style={{ fontSize: 16, fontWeight: 800, color: "#111827", marginBottom: 4, letterSpacing: "-0.01em" }}>
          {data.title}
        </h3>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
          <div style={{
            width: 22, height: 22, borderRadius: "50%",
            background: "#eff6ff",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2A6B9B"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="8" r="4" /><path d="M20 21a8 8 0 1 0-16 0" />
            </svg>
          </div>
          <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>
            {data.doctor}
            <span style={{ color: "#2A6B9B", fontWeight: 700 }}> · {data.specialty}</span>
          </span>
        </div>

        {/* Info grid */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr",
          gap: 8, marginBottom: isUpcoming ? 14 : 0,
        }}>
          <InfoChip
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2A6B9B"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M8 2v4" /><path d="M16 2v4" />
                <rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" />
              </svg>
            }
            label="Tanggal"
            value={data.date}
          />
          <InfoChip
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2A6B9B"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
              </svg>
            }
            label="Waktu"
            value={data.time}
          />
          <InfoChip
            colSpan={2}
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2A6B9B"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            }
            label="Lokasi"
            value={data.location}
          />
        </div>

        {/* Action buttons (upcoming only) */}
        {isUpcoming && (
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => router.push(PASIEN_DYNAMIC.jadwalUlang(data.id))}
              style={{
                flex: 1, padding: "11px 0",
                background: "#fff", border: "1.5px solid #e5e7eb",
                color: "#374151", fontWeight: 700, fontSize: 13,
                borderRadius: 12, cursor: "pointer", fontFamily: "inherit",
                transition: "border-color 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#2A6B9B")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}
            >
              Jadwal Ulang
            </button>
            <button
              onClick={() => router.push(PASIEN_DYNAMIC.jadwalTiket(data.id))}
              style={{
                flex: 2, padding: "11px 0",
                background: "linear-gradient(135deg, #1d4e73, #2A6B9B)",
                border: "none", color: "#fff",
                fontWeight: 700, fontSize: 13,
                borderRadius: 12, cursor: "pointer", fontFamily: "inherit",
                boxShadow: "0 4px 12px rgba(42,107,155,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
              </svg>
              Lihat Tiket
            </button>
          </div>
        )}

        {/* Completed: rating + detail */}
        {!isUpcoming && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 10, borderTop: "1px solid #f3f4f6" }}>
            <div style={{ display: "flex", gap: 2 }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <svg key={s} width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"
                  fill={s <= 5 ? "#fbbf24" : "#e5e7eb"} stroke="none">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              ))}
              <span style={{ fontSize: 11, color: "#9ca3af", marginLeft: 4, lineHeight: "14px" }}>5/5</span>
            </div>
            <button
              onClick={() => router.push(PASIEN_DYNAMIC.riwayatDetail(data.id))}
              style={{
                fontSize: 11, fontWeight: 700, color: "#2A6B9B",
                background: "#eff6ff", border: "none", borderRadius: 8,
                padding: "5px 10px", cursor: "pointer", fontFamily: "inherit",
              }}
            >
              Lihat Detail
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

/* ─── Info Chip ──────────────────────────────────────────────────────────── */

function InfoChip({
  icon, label, value, colSpan = 1,
}: { icon: React.ReactNode; label: string; value: string; colSpan?: 1 | 2 }) {
  return (
    <div style={{
      background: "#f8fafc",
      border: "1px solid #f1f5f9",
      borderRadius: 10, padding: "8px 10px",
      display: "flex", alignItems: "flex-start", gap: 8,
      gridColumn: colSpan === 2 ? "span 2" : undefined,
    }}>
      <span style={{ marginTop: 1, flexShrink: 0 }}>{icon}</span>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>
          {label}
        </p>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {value}
        </p>
      </div>
    </div>
  );
}

/* ─── Empty State ────────────────────────────────────────────────────────── */

function EmptyJadwal({ activeFilter }: { activeFilter: FilterStatus }) {
  const router = useRouter();
  const config = {
    "Akan Datang": {
      color: "#2A6B9B", bg: "#eff6ff", border: "#bfdbfe",
      emoji: "📅", title: "Belum Ada Jadwal", desc: "Buat janji temu sekarang untuk memulai perawatan.",
    },
    "Dibatalkan": {
      color: "#d97706", bg: "#fffbeb", border: "#fde68a",
      emoji: "🚫", title: "Tidak Ada Jadwal Dibatalkan", desc: "Jadwal yang dibatalkan akan muncul di sini.",
    },
    "Selesai": {
      color: "#6b7280", bg: "#f9fafb", border: "#e5e7eb",
      emoji: "✅", title: "Belum Ada Riwayat", desc: "Kunjungan yang selesai akan tercatat di sini.",
    },
  };
  const c = config[activeFilter];

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "48px 24px", textAlign: "center",
    }}>
      {/* Emoji blob */}
      <div style={{
        width: 72, height: 72, borderRadius: "50%",
        background: c.bg, border: `1.5px solid ${c.border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 30, marginBottom: 16,
        boxShadow: `0 4px 16px ${c.border}`,
      }}>
        {c.emoji}
      </div>
      <p style={{ fontSize: 15, fontWeight: 800, color: "#1f2937", marginBottom: 6 }}>{c.title}</p>
      <p style={{ fontSize: 12, color: "#9ca3af", lineHeight: 1.6, marginBottom: 20, maxWidth: 240 }}>{c.desc}</p>
      {activeFilter === "Akan Datang" && (
        <button
          onClick={() => router.push(PASIEN_PATHS.buatJanji)}
          style={{
            padding: "10px 24px",
            background: "linear-gradient(135deg, #1d4e73, #2A6B9B)",
            color: "#fff", border: "none", borderRadius: 12,
            fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            boxShadow: "0 4px 14px rgba(42,107,155,0.3)",
          }}
        >
          Buat Janji Sekarang
        </button>
      )}
    </div>
  );
}
