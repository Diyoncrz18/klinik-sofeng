"use client";

/**
 * TabJadwal — Halaman Jadwal Saya (wired ke backend Phase 2A)
 * ──────────────────────────────────────────────────────────
 * Fetch appointment via `/api/appointments` lalu group ke 3 bucket:
 *   • Akan Datang → status terjadwal | menunggu | sedang_ditangani
 *   • Selesai     → status selesai
 *   • Dibatalkan  → status dibatalkan | tidak_hadir
 *
 * Card upcoming punya tombol "Batalkan" yang membuka modal konfirmasi.
 * Submit modal akan memanggil `cancelAppointment(id, alasan?)` dan
 * me-refetch list sehingga UI selalu konsisten dengan backend.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { PASIEN_PATHS, PASIEN_DYNAMIC } from "./pasienRouting";
import { cancelAppointment, listAppointments } from "@/lib/appointments";
import {
  formatJamRange,
  formatStatusLabel,
  formatTanggalIndo,
  getStatusVisual,
  statusToBucket,
  type FilterBucket,
} from "@/lib/format";
import {
  appointmentTitle,
  dokterFullName,
  dokterSpesialisasi,
  shortAppointmentId,
} from "@/lib/appointment-display";
import type { Appointment } from "@/lib/types";

export default function TabJadwal() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<FilterBucket>("Akan Datang");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);

  // ── Fetch (re-usable untuk refresh setelah cancel) ──────────────
  const refetch = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const items = await listAppointments();
      setAppointments(items);
      setErrorMsg(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal memuat jadwal.";
      setErrorMsg(msg);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  useEffect(() => {
    const refreshOnFocus = () => {
      void refetch(false);
    };
    const intervalId = window.setInterval(() => {
      void refetch(false);
    }, 15_000);

    window.addEventListener("focus", refreshOnFocus);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshOnFocus);
    };
  }, [refetch]);

  // ── Group + sort per bucket ─────────────────────────────────────
  const grouped = useMemo(() => {
    const byBucket: Record<FilterBucket, Appointment[]> = {
      "Akan Datang": [],
      "Selesai": [],
      "Dibatalkan": [],
    };
    for (const a of appointments) {
      byBucket[statusToBucket(a.status)].push(a);
    }
    byBucket["Akan Datang"].sort((a, b) =>
      a.tanggal !== b.tanggal
        ? a.tanggal.localeCompare(b.tanggal)
        : a.jam.localeCompare(b.jam),
    );
    const sortDesc = (list: Appointment[]) =>
      list.sort((a, b) =>
        a.tanggal !== b.tanggal
          ? b.tanggal.localeCompare(a.tanggal)
          : b.jam.localeCompare(a.jam),
      );
    sortDesc(byBucket["Selesai"]);
    sortDesc(byBucket["Dibatalkan"]);
    return byBucket;
  }, [appointments]);

  const filters: { key: FilterBucket; count: number }[] = [
    { key: "Akan Datang", count: grouped["Akan Datang"].length },
    { key: "Selesai", count: grouped["Selesai"].length },
    { key: "Dibatalkan", count: grouped["Dibatalkan"].length },
  ];

  const visible = grouped[activeFilter];

  const subtitle = (() => {
    if (loading) return "Memuat jadwal…";
    if (activeFilter === "Akan Datang") {
      const n = grouped["Akan Datang"].length;
      return n === 0 ? "Tidak ada janji terjadwal" : `${n} janji temu`;
    }
    return "Riwayat kunjungan Anda";
  })();

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
              {subtitle}
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
            }}
          >
            ⚠ {errorMsg}
          </div>
        )}

        {loading ? (
          <CardSkeleton />
        ) : visible.length === 0 ? (
          <EmptyJadwal activeFilter={activeFilter} />
        ) : (
          visible.map((appt) => (
            <AppointmentCard
              key={appt.id}
              appointment={appt}
              onCancel={() => setCancelTarget(appt)}
            />
          ))
        )}
      </div>

      {/* Cancel modal */}
      {cancelTarget && (
        <CancelModal
          appt={cancelTarget}
          onClose={() => setCancelTarget(null)}
          onSuccess={() => {
            setCancelTarget(null);
            void refetch();
          }}
        />
      )}
    </div>
  );
}

/* ─── Appointment Card ───────────────────────────────────────────────────── */

function AppointmentCard({
  appointment,
  onCancel,
}: {
  appointment: Appointment;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const bucket = statusToBucket(appointment.status);
  const isUpcoming = bucket === "Akan Datang";
  const isCompleted = bucket === "Selesai";
  const visual = getStatusVisual(appointment.status);

  // Lokasi belum tersedia di domain BE — fallback ke spesialisasi dokter
  // sebagai info pendamping yang bermakna.
  const lokasi = appointment.dokter?.spesialisasi
    ? `Klinik — ${dokterSpesialisasi(appointment)}`
    : "Klinik Gigi";

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
        background: visual.accentGradient,
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
            {formatStatusLabel(appointment.status)}
          </span>
        </div>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>
          ID: {shortAppointmentId(appointment.id)}
        </span>
      </div>

      {/* Card body */}
      <div style={{ padding: "16px 16px 14px" }}>
        {/* Title + Doctor */}
        <h3 style={{ fontSize: 16, fontWeight: 800, color: "#111827", marginBottom: 4, letterSpacing: "-0.01em" }}>
          {appointmentTitle(appointment)}
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
            {dokterFullName(appointment)}
            <span style={{ color: "#2A6B9B", fontWeight: 700 }}> · {dokterSpesialisasi(appointment)}</span>
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
            value={formatTanggalIndo(appointment.tanggal)}
          />
          <InfoChip
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2A6B9B"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
              </svg>
            }
            label="Waktu"
            value={formatJamRange(appointment.jam)}
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
            value={lokasi}
          />
        </div>

        {/* Action buttons (upcoming only) */}
        {isUpcoming && (
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={onCancel}
              disabled={!onCancel}
              style={{
                flex: 1, padding: "11px 0",
                background: "#fff", border: "1.5px solid #fecaca",
                color: "#b91c1c", fontWeight: 700, fontSize: 13,
                borderRadius: 12,
                cursor: onCancel ? "pointer" : "not-allowed",
                opacity: onCancel ? 1 : 0.5,
                fontFamily: "inherit",
                transition: "background 0.15s ease, border-color 0.15s ease",
              }}
              onMouseEnter={(e) => {
                if (!onCancel) return;
                e.currentTarget.style.borderColor = "#b91c1c";
                e.currentTarget.style.background = "#fef2f2";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#fecaca";
                e.currentTarget.style.background = "#fff";
              }}
            >
              Batalkan
            </button>
            <button
              onClick={() =>
                router.push(PASIEN_DYNAMIC.jadwalTiket(appointment.id))
              }
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

        {/* Completed: detail link */}
        {isCompleted && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", paddingTop: 10, borderTop: "1px solid #f3f4f6" }}>
            <button
              onClick={() =>
                router.push(PASIEN_DYNAMIC.riwayatDetail(appointment.id))
              }
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

function EmptyJadwal({ activeFilter }: { activeFilter: FilterBucket }) {
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

/* ─── Card Skeleton ──────────────────────────────────────────────────────── */

function CardSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {[0, 1].map((i) => (
        <div
          key={i}
          aria-busy="true"
          aria-label="Memuat jadwal"
          style={{
            background: "#fff",
            border: "1px solid rgba(115,199,227,0.12)",
            borderRadius: 20,
            overflow: "hidden",
            boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ height: 38, background: "#e2e8f0" }} />
          <div style={{ padding: "16px 16px 14px" }}>
            <div style={{ height: 14, width: "55%", background: "#e2e8f0", borderRadius: 6, marginBottom: 8 }} />
            <div style={{ height: 10, width: "40%", background: "#eef2f7", borderRadius: 6, marginBottom: 14 }} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div style={{ height: 36, background: "#f1f5f9", borderRadius: 10 }} />
              <div style={{ height: 36, background: "#f1f5f9", borderRadius: 10 }} />
              <div style={{ gridColumn: "span 2", height: 36, background: "#f1f5f9", borderRadius: 10 }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Cancel Modal (FormBatalkanJanji inline) ────────────────────────────── */

function CancelModal({
  appt,
  onClose,
  onSuccess,
}: {
  appt: Appointment;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [alasan, setAlasan] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Tutup dengan Esc
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, submitting]);

  const handleConfirm = async () => {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await cancelAppointment(appt.id, alasan.trim() || null);
      onSuccess();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Gagal membatalkan janji.";
      setErrorMsg(msg);
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancel-modal-title"
      onClick={() => {
        if (!submitting) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(15, 23, 42, 0.55)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        padding: 16,
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 20,
          width: "100%",
          maxWidth: 420,
          padding: "20px 20px 18px",
          boxShadow: "0 24px 48px rgba(15, 23, 42, 0.35)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
          <div
            style={{
              width: 40, height: 40, borderRadius: 12,
              background: "#fef2f2",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b91c1c"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <h2
              id="cancel-modal-title"
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: "#111827",
                marginBottom: 2,
                letterSpacing: "-0.01em",
              }}
            >
              Batalkan Janji?
            </h2>
            <p style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.5 }}>
              {appointmentTitle(appt)} bersama {dokterFullName(appt)} pada{" "}
              {formatTanggalIndo(appt.tanggal)} {formatJamRange(appt.jam)}.
            </p>
          </div>
        </div>

        {/* Alasan textarea */}
        <label
          htmlFor="cancel-alasan"
          style={{
            display: "block",
            fontSize: 11,
            fontWeight: 700,
            color: "#374151",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: 6,
          }}
        >
          Alasan (opsional)
        </label>
        <textarea
          id="cancel-alasan"
          value={alasan}
          onChange={(e) => setAlasan(e.target.value)}
          maxLength={300}
          rows={3}
          placeholder="Beritahu klinik kenapa Anda membatalkan…"
          disabled={submitting}
          style={{
            width: "100%",
            border: "1.5px solid #e5e7eb",
            borderRadius: 12,
            padding: "10px 12px",
            fontSize: 13,
            color: "#111827",
            fontFamily: "inherit",
            resize: "vertical",
            outline: "none",
            transition: "border-color 0.15s ease, box-shadow 0.15s ease",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "#2A6B9B";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(42,107,155,0.12)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "#e5e7eb";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
        <p style={{ fontSize: 10, color: "#9ca3af", textAlign: "right", marginTop: 4 }}>
          {alasan.length}/300
        </p>

        {/* Error */}
        {errorMsg && (
          <div
            role="alert"
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: 10,
              padding: "8px 10px",
              fontSize: 12,
              color: "#b91c1c",
              fontWeight: 600,
              marginTop: 10,
            }}
          >
            {errorMsg}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <button
            onClick={onClose}
            disabled={submitting}
            style={{
              flex: 1,
              padding: "11px 0",
              background: "#fff",
              border: "1.5px solid #e5e7eb",
              color: "#374151",
              fontWeight: 700,
              fontSize: 13,
              borderRadius: 12,
              cursor: submitting ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              opacity: submitting ? 0.6 : 1,
            }}
          >
            Tutup
          </button>
          <button
            onClick={() => void handleConfirm()}
            disabled={submitting}
            style={{
              flex: 2,
              padding: "11px 0",
              background: submitting
                ? "#fca5a5"
                : "linear-gradient(135deg, #b91c1c, #ef4444)",
              border: "none",
              color: "#fff",
              fontWeight: 800,
              fontSize: 13,
              borderRadius: 12,
              cursor: submitting ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              boxShadow: "0 4px 12px rgba(185,28,28,0.3)",
            }}
          >
            {submitting ? "Membatalkan…" : "Ya, Batalkan"}
          </button>
        </div>
      </div>
    </div>
  );
}
