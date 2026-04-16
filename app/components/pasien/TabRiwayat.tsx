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

import { useState } from "react";

type RecordFilter = "Semua" | "Tindakan" | "Konsultasi" | "Resep";

// ── Data ──────────────────────────────────────────────────────────────────────
const RECORDS: RecordItem[] = [
  {
    id: 1,
    category: "Tindakan",
    date: "22 Mei 2026",
    monthYear: "MEI 2026",
    title: "Scaling & Polishing",
    doctor: "Dr. Rina Santoso",
    specialty: "Sp.KG",
    description: "Pembersihan karang gigi menyeluruh menggunakan ultrasonic scaler.",
    amount: "Rp 450.000",
    payStatus: "Lunas",
    payColor: "#059669",
    payBg: "#dcfce7",
    iconGradient: "linear-gradient(135deg, #059669, #34d399)",
    accentColor: "#059669",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
      </svg>
    ),
  },
  {
    id: 2,
    category: "Tindakan",
    date: "10 Apr 2026",
    monthYear: "APR 2026",
    title: "Pemasangan Kawat Gigi",
    doctor: "Dr. Rina Santoso",
    specialty: "Sp.KG",
    description: "Pemasangan bracket dan kawat orthodontik untuk koreksi gigitan.",
    amount: "Rp 8.500.000",
    payStatus: "Cicilan",
    payColor: "#d97706",
    payBg: "#fef3c7",
    iconGradient: "linear-gradient(135deg, #1d4e73, #2A6B9B)",
    accentColor: "#2A6B9B",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="18" cy="18" r="3" /><circle cx="6" cy="6" r="3" />
        <path d="M13 6h3a2 2 0 0 1 2 2v7" /><path d="m11 18-5-5 5-5" />
      </svg>
    ),
  },
  {
    id: 3,
    category: "Konsultasi",
    date: "28 Mar 2026",
    monthYear: "MAR 2026",
    title: "Foto Panoramik & Konsultasi",
    doctor: "Dr. Andi Pratama",
    specialty: "Sp.Ort",
    description: "Rontgen gigi panoramik dan konsultasi rencana perawatan ortodonti.",
    amount: "Rp 250.000",
    payStatus: "Lunas",
    payColor: "#059669",
    payBg: "#dcfce7",
    iconGradient: "linear-gradient(135deg, #4c1d95, #7c3aed)",
    accentColor: "#7c3aed",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" />
        <path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" />
        <rect width="10" height="8" x="7" y="8" rx="1" />
      </svg>
    ),
  },
];

interface RecordItem {
  id: number;
  category: RecordFilter;
  date: string;
  monthYear: string;
  title: string;
  doctor: string;
  specialty: string;
  description: string;
  amount: string;
  payStatus: string;
  payColor: string;
  payBg: string;
  iconGradient: string;
  accentColor: string;
  icon: React.ReactNode;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function TabRiwayat() {
  const [activeFilter, setActiveFilter] = useState<RecordFilter>("Semua");

  const filters: { key: RecordFilter; count?: number }[] = [
    { key: "Semua", count: RECORDS.length },
    { key: "Tindakan", count: RECORDS.filter((r) => r.category === "Tindakan").length },
    { key: "Konsultasi", count: RECORDS.filter((r) => r.category === "Konsultasi").length },
    { key: "Resep" },
  ];

  const filtered = activeFilter === "Semua"
    ? RECORDS
    : RECORDS.filter((r) => r.category === activeFilter);

  // Total biaya
  const totalBiaya = filtered
    .reduce((sum, r) => {
      const num = parseInt(r.amount.replace(/\D/g, ""), 10);
      return sum + (isNaN(num) ? 0 : num);
    }, 0)
    .toLocaleString("id-ID");

  return (
    <div style={{ position: "relative", paddingBottom: 16 }}>

      {/* ═══════════════════════════════════════
          STICKY HEADER
          ═══════════════════════════════════════ */}
      <div className="sticky-tab-header">
        {/* Title + search */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: "#111827", letterSpacing: "-0.03em", lineHeight: 1 }}>
              Rekam Medis
            </h2>
            <p style={{ fontSize: 12, color: "#6b7280", marginTop: 4, fontWeight: 500 }}>
              Total {filtered.length} catatan tindakan
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
          border: "1px solid #f1f5f9", marginBottom: 14,
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: "50%",
            background: "#2A6B9B", flexShrink: 0,
          }} />
          <p style={{ fontSize: 11, color: "#6b7280", fontWeight: 500 }}>
            Total biaya tercatat:
            <span style={{ fontWeight: 800, color: "#111827", marginLeft: 4 }}>
              Rp {totalBiaya}
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

      {/* ═══════════════════════════════════════
          TIMELINE LIST
          ═══════════════════════════════════════ */}
      {filtered.length === 0 ? (
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

      {/* Load more */}
      {filtered.length > 0 && (
        <div style={{ textAlign: "center", paddingTop: 16 }}>
          <button
            style={{
              padding: "10px 28px",
              background: "#fff", border: "1.5px solid #e5e7eb",
              color: "#6b7280", fontSize: 12, fontWeight: 700,
              borderRadius: 999, cursor: "pointer", fontFamily: "inherit",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              transition: "border-color 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#2A6B9B")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}
          >
            Muat Lebih Banyak
          </button>
          <p style={{ fontSize: 10, color: "#d1d5db", marginTop: 8 }}>
            Menampilkan {filtered.length} catatan
          </p>
        </div>
      )}
    </div>
  );
}

/* ─── Timeline Item ──────────────────────────────────────────────────────── */

function TimelineItem({ record, isLast }: { record: RecordItem; isLast: boolean }) {
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

          {/* Footer: amount + action */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
                <path d="M14 8H8" /><path d="M16 12H8" /><path d="M12 16H8" />
              </svg>
              <span style={{ fontSize: 13, fontWeight: 800, color: "#374151" }}>
                {record.amount}
              </span>
              <span style={{
                fontSize: 9, fontWeight: 800,
                color: record.payColor,
                background: record.payBg,
                padding: "3px 7px", borderRadius: 20,
              }}>
                {record.payStatus}
              </span>
            </div>

            <button
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
