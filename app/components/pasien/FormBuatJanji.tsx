"use client";

/**
 * FormBuatJanji — Wizard Buat Janji Temu (3 Langkah)
 * ─────────────────────────────────────────────────────
 * Step 1 : Pilih Layanan
 * Step 2 : Pilih Dokter + Tanggal + Waktu
 * Step 3 : Konfirmasi & Catatan
 *
 * Design konsisten dengan beranda, jadwal, riwayat:
 * - Sticky header dengan back button + progress bar
 * - Kartu seleksi dengan gradient icon
 * - Week date-picker horizontal
 * - Time slot grid
 * - Konfirmasi card premium + submit button gradient
 */

import { useEffect, useState } from "react";

import { useAuth } from "@/app/contexts/AuthContext";
import { createAppointment } from "@/lib/appointments";
import { listDokter } from "@/lib/dokter";
import {
  getUserDisplayName,
  getUserInitials,
  type Appointment,
  type AppointmentType,
  type DokterProfileData,
} from "@/lib/types";

// ── Types ──────────────────────────────────────────────────────────────────

interface Props {
  onBack: () => void;
  /**
   * Dipanggil setelah `createAppointment` berhasil. Implementasi parent
   * biasanya redirect ke detail tiket atau kembali ke list jadwal.
   */
  onSuccess: (appt: Appointment) => void;
}

type Step = 1 | 2 | 3;

interface LayananItem {
  id: string;
  label: string;
  desc: string;
  icon: React.ReactNode;
  iconGradient: string;
  durasi: string;
  harga: string;
}

// ── Mapping FE → Backend enum ──────────────────────────────────────────
//
// Layanan UI → `appointment.jenis`. "darurat" tidak diekspos di wizard
// reguler (pasien butuh flow triage terpisah).
const JENIS_PER_LAYANAN: Record<string, AppointmentType> = {
  scaling:    "tindakan",
  konsultasi: "konsultasi",
  kawat:      "kontrol",
  cabut:      "tindakan",
  tambal:     "tindakan",
  rontgen:    "pemeriksaan",
};

function dokterAvatar(nama: string): string {
  return nama
    .replace(/^Dr\.?\s*/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("") || "DR";
}

function dokterIdentifier(dokter: DokterProfileData): string | null {
  if (dokter.sip?.trim()) return `SIP ${dokter.sip.trim()}`;
  if (dokter.nip?.trim()) return `NIP ${dokter.nip.trim()}`;
  if (dokter.profile.email?.trim()) return dokter.profile.email.trim();
  return null;
}

// ── Static Data ────────────────────────────────────────────────────────────

const LAYANAN: LayananItem[] = [
  {
    id: "scaling",
    label: "Scaling & Polishing",
    desc: "Pembersihan karang gigi menyeluruh",
    durasi: "45 menit",
    harga: "Rp 450.000",
    iconGradient: "linear-gradient(135deg, #059669, #34d399)",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
      </svg>
    ),
  },
  {
    id: "konsultasi",
    label: "Konsultasi Umum",
    desc: "Pemeriksaan & konsultasi dokter gigi",
    durasi: "30 menit",
    harga: "Rp 150.000",
    iconGradient: "linear-gradient(135deg, #2A6B9B, #3b9bd4)",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="8" r="4" /><path d="M20 21a8 8 0 1 0-16 0" />
      </svg>
    ),
  },
  {
    id: "kawat",
    label: "Kontrol Kawat Gigi",
    desc: "Pengecekan & penyesuaian bracket",
    durasi: "30 menit",
    harga: "Rp 250.000",
    iconGradient: "linear-gradient(135deg, #4c1d95, #7c3aed)",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="18" cy="18" r="3" /><circle cx="6" cy="6" r="3" />
        <path d="M13 6h3a2 2 0 0 1 2 2v7" /><path d="m11 18-5-5 5-5" />
      </svg>
    ),
  },
  {
    id: "cabut",
    label: "Pencabutan Gigi",
    desc: "Ekstraksi gigi dengan anestesi lokal",
    durasi: "45 menit",
    harga: "Rp 300.000",
    iconGradient: "linear-gradient(135deg, #c2410c, #f97316)",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z"/>
        <path d="M10 22v-4h4v4"/>
      </svg>
    ),
  },
  {
    id: "tambal",
    label: "Tambal Gigi",
    desc: "Restorasi gigi berlubang dengan komposit",
    durasi: "60 menit",
    harga: "Rp 350.000",
    iconGradient: "linear-gradient(135deg, #b45309, #f59e0b)",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect width="8" height="8" x="2" y="2" rx="2"/><rect width="8" height="8" x="14" y="2" rx="2"/>
        <rect width="8" height="8" x="14" y="14" rx="2"/><rect width="8" height="8" x="2" y="14" rx="2"/>
      </svg>
    ),
  },
  {
    id: "rontgen",
    label: "Rontgen / Foto Gigi",
    desc: "Panoramik atau periapikal",
    durasi: "20 menit",
    harga: "Rp 200.000",
    iconGradient: "linear-gradient(135deg, #1e3a5f, #0ea5e9)",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/>
        <path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
        <rect width="10" height="8" x="7" y="8" rx="1"/>
      </svg>
    ),
  },
];

// Slot waktu kandidat (FE-only). Backend yang autoritatif untuk
// validasi jadwal dokter — client hanya menampilkan opsi.
const WAKTU = ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "13:00", "13:30", "14:00", "14:30", "15:00"];

// Format YYYY-MM-DD untuk dikirim ke backend.
function toYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Generate 7 hari ke depan
function getDays() {
  const days: { label: string; sub: string; full: string; date: Date }[] = [];
  const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
  for (let i = 1; i <= 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push({
      date: d,
      label: dayNames[d.getDay()],
      sub: String(d.getDate()),
      full: `${dayNames[d.getDay()]}, ${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`,
    });
  }
  return days;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function FormBuatJanji({ onBack, onSuccess }: Props) {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>(1);

  // Form state
  const [selectedLayanan, setSelectedLayanan] = useState<string | null>(null);
  const [selectedDokter, setSelectedDokter] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedWaktu, setSelectedWaktu] = useState<string | null>(null);
  const [catatan, setCatatan] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Backend state
  const [dokterList, setDokterList] = useState<DokterProfileData[]>([]);
  const [dokterLoading, setDokterLoading] = useState(true);
  const [dokterError, setDokterError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [days] = useState(getDays);

  // Fetch list dokter sekali saat mount.
  useEffect(() => {
    let alive = true;
    setDokterLoading(true);
    listDokter()
      .then((items) => {
        if (!alive) return;
        setDokterList(items);
        setDokterError(null);
      })
      .catch((err: unknown) => {
        if (!alive) return;
        setDokterError(
          err instanceof Error ? err.message : "Gagal memuat daftar dokter.",
        );
      })
      .finally(() => {
        if (alive) setDokterLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const layananData = LAYANAN.find((l) => l.id === selectedLayanan);
  const dokterData = dokterList.find((d) => d.id === selectedDokter);
  const dayData = selectedDay !== null ? days[selectedDay] : null;

  const canNext1 = selectedLayanan !== null;
  const canNext2 =
    selectedDokter !== null &&
    selectedDay !== null &&
    selectedWaktu !== null;

  const goNext = () => {
    if (step < 3) setStep((s) => (s + 1) as Step);
    const main = document.querySelector(".pasien-main");
    if (main) main.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goPrev = () => {
    if (step > 1) setStep((s) => (s - 1) as Step);
    else onBack();
    const main = document.querySelector(".pasien-main");
    if (main) main.scrollTo({ top: 0, behavior: "smooth" });
  };

  async function handleSubmit() {
    if (submitting) return;
    if (!selectedDokter || !dayData || !selectedWaktu || !selectedLayanan) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const jenis = JENIS_PER_LAYANAN[selectedLayanan] ?? "konsultasi";
      const created = await createAppointment({
        dokterId: selectedDokter,
        tanggal: toYmd(dayData.date),
        jam: selectedWaktu,
        jenis,
        keluhan: catatan.trim() === "" ? null : catatan.trim(),
      });
      setSubmitted(true);
      // Beri delay singkat untuk feedback visual sukses, lalu serahkan
      // ke parent untuk navigasi (mis. → detail tiket).
      setTimeout(() => onSuccess(created), 1500);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Gagal membuat janji temu.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  // ── Success screen ───────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", minHeight: "60vh", textAlign: "center", padding: "32px 24px",
      }}>
        {/* Checkmark animation */}
        <div style={{
          width: 88, height: 88, borderRadius: "50%",
          background: "linear-gradient(135deg, #059669, #34d399)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 8px 32px rgba(5,150,105,0.3)",
          marginBottom: 24,
          animation: "pasienFadeIn 0.4s ease-out",
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white"
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: "#111827", marginBottom: 8 }}>
          Janji Dibuat! 🎉
        </h2>
        <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.7, marginBottom: 6 }}>
          Janji temu berhasil dibuat.
        </p>
        <p style={{ fontSize: 13, color: "#9ca3af" }}>
          Anda akan diarahkan ke halaman Jadwal...
        </p>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 16 }}>

      {/* ═══════════════════════════════════════════
          STICKY HEADER
          ═══════════════════════════════════════════ */}
      <div style={{
        position: "sticky", top: 0, zIndex: 40,
        background: "rgba(247,249,251,0.97)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        marginLeft: -18, marginRight: -18,
        paddingLeft: 18, paddingRight: 18,
        paddingTop: 16, paddingBottom: 14,
        borderBottom: "1px solid #f1f5f9",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        marginBottom: 20,
      }}>
        {/* Top row: Back + Title + Step counter */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <button
            onClick={goPrev}
            aria-label="Kembali"
            style={{
              width: 38, height: 38, borderRadius: 12,
              background: "#fff", border: "1.5px solid #e5e7eb",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", flexShrink: 0,
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#374151"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m15 18-6-6 6-6"/>
            </svg>
          </button>

          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 17, fontWeight: 900, color: "#111827", letterSpacing: "-0.02em" }}>
              Buat Janji Temu
            </h2>
            <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
              {step === 1 && "Pilih jenis layanan yang dibutuhkan"}
              {step === 2 && "Tentukan dokter, tanggal & waktu"}
              {step === 3 && "Tinjau & konfirmasi janji Anda"}
            </p>
          </div>

          <span style={{
            fontSize: 11, fontWeight: 800, color: "#2A6B9B",
            background: "#eff6ff", padding: "4px 10px", borderRadius: 999,
            border: "1px solid #bfdbfe",
          }}>
            {step}/3
          </span>
        </div>

        {/* Progress bar */}
        <div style={{ display: "flex", gap: 6 }}>
          {([1, 2, 3] as Step[]).map((s) => (
            <div key={s} style={{
              flex: 1, height: 4, borderRadius: 2,
              background: s <= step
                ? "linear-gradient(90deg, #1d4e73, #2A6B9B)"
                : "#e5e7eb",
              transition: "background 0.3s ease",
            }} />
          ))}
        </div>

        {/* Step labels */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
          {["Layanan", "Jadwal", "Konfirmasi"].map((label, i) => (
            <span key={label} style={{
              fontSize: 9, fontWeight: i + 1 <= step ? 700 : 400,
              color: i + 1 <= step ? "#2A6B9B" : "#d1d5db",
              textTransform: "uppercase", letterSpacing: "0.06em",
            }}>
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          STEP 1 — PILIH LAYANAN
          ═══════════════════════════════════════════ */}
      {step === 1 && (
        <div style={{ animation: "pasienFadeIn 0.2s ease-out" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {LAYANAN.map((layanan) => {
              const isSelected = selectedLayanan === layanan.id;
              return (
                <button
                  key={layanan.id}
                  onClick={() => setSelectedLayanan(layanan.id)}
                  style={{
                    background: isSelected ? "#fff" : "#fff",
                    border: isSelected ? "2px solid #2A6B9B" : "1.5px solid #e5e7eb",
                    borderRadius: 16, padding: "14px 12px",
                    cursor: "pointer", fontFamily: "inherit",
                    textAlign: "left",
                    boxShadow: isSelected
                      ? "0 4px 16px rgba(42,107,155,0.15)"
                      : "0 1px 4px rgba(0,0,0,0.04)",
                    transition: "all 0.2s ease",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {/* Selected check */}
                  {isSelected && (
                    <div style={{
                      position: "absolute", top: 8, right: 8,
                      width: 18, height: 18, borderRadius: "50%",
                      background: "#2A6B9B",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white"
                        strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="m9 11 3 3L22 4"/>
                      </svg>
                    </div>
                  )}

                  {/* Icon */}
                  <div style={{
                    width: 44, height: 44, borderRadius: 13,
                    background: layanan.iconGradient,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginBottom: 10,
                    boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
                  }}>
                    {layanan.icon}
                  </div>

                  <p style={{ fontSize: 12, fontWeight: 800, color: "#111827", marginBottom: 3, lineHeight: 1.3 }}>
                    {layanan.label}
                  </p>
                  <p style={{ fontSize: 10, color: "#9ca3af", lineHeight: 1.4, marginBottom: 8 }}>
                    {layanan.desc}
                  </p>

                  {/* Meta */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, color: "#2A6B9B",
                    }}>
                      {layanan.harga}
                    </span>
                    <span style={{ fontSize: 9, color: "#d1d5db", fontWeight: 500 }}>
                      ⏱ {layanan.durasi}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Next button */}
          <div style={{ marginTop: 20 }}>
            <button
              onClick={goNext}
              disabled={!canNext1}
              style={{
                width: "100%", padding: "14px 0",
                background: canNext1
                  ? "linear-gradient(135deg, #1d4e73, #2A6B9B)"
                  : "#e5e7eb",
                border: "none", color: canNext1 ? "#fff" : "#9ca3af",
                fontWeight: 800, fontSize: 14,
                borderRadius: 14, cursor: canNext1 ? "pointer" : "not-allowed",
                fontFamily: "inherit",
                boxShadow: canNext1 ? "0 6px 20px rgba(42,107,155,0.3)" : "none",
                transition: "all 0.2s ease",
              }}
            >
              Lanjut — Pilih Jadwal →
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          STEP 2 — PILIH DOKTER + TANGGAL + WAKTU
          ═══════════════════════════════════════════ */}
      {step === 2 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "pasienFadeIn 0.2s ease-out" }}>

          {/* Layanan terpilih (ringkasan) */}
          {layananData && (
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              background: "#f0f9ff", border: "1px solid #bae6fd",
              borderRadius: 12, padding: "10px 14px",
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: layananData.iconGradient,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                {layananData.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 800, color: "#0c4a6e" }}>{layananData.label}</p>
                <p style={{ fontSize: 10, color: "#38bdf8" }}>{layananData.harga} · {layananData.durasi}</p>
              </div>
              <button
                onClick={() => setStep(1)}
                style={{ fontSize: 10, fontWeight: 700, color: "#2A6B9B", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
              >
                Ganti
              </button>
            </div>
          )}

          {/* Pilih Dokter */}
          <section>
            <h3 style={{ fontSize: 13, fontWeight: 800, color: "#374151", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Pilih Dokter
            </h3>

            {dokterError && (
              <div
                role="alert"
                style={{
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: 12,
                  padding: "10px 12px",
                  fontSize: 12,
                  color: "#b91c1c",
                  fontWeight: 600,
                  marginBottom: 10,
                }}
              >
                ⚠ {dokterError}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {dokterLoading ? (
                [0, 1, 2].map((i) => (
                  <div
                    key={i}
                    aria-busy="true"
                    style={{
                      height: 64,
                      borderRadius: 14,
                      background: "#f1f5f9",
                      animation: "pasienPulse 1.5s ease-in-out infinite",
                    }}
                  />
                ))
              ) : dokterList.length === 0 ? (
                <div
                  style={{
                    background: "#f8fafc",
                    border: "1.5px dashed #e5e7eb",
                    borderRadius: 14,
                    padding: "16px 14px",
                    fontSize: 12,
                    color: "#6b7280",
                    textAlign: "center",
                  }}
                >
                  Belum ada dokter terdaftar.
                </div>
              ) : (
                dokterList.map((dokter) => {
                  const isSelected = selectedDokter === dokter.id;
                  const nama = dokter.profile.full_name;
                  const avatar = dokterAvatar(nama);
                  const identifier = dokterIdentifier(dokter);
                  return (
                    <button
                      key={dokter.id}
                      type="button"
                      onClick={() => setSelectedDokter(dokter.id)}
                      style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "12px 14px",
                        background: "#fff",
                        border: isSelected ? "2px solid #2A6B9B" : "1.5px solid #e5e7eb",
                        borderRadius: 14, cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                        boxShadow: isSelected ? "0 4px 14px rgba(42,107,155,0.12)" : "0 1px 4px rgba(0,0,0,0.04)",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {/* Avatar */}
                      <div style={{
                        width: 44, height: 44, borderRadius: "50%",
                        background: isSelected
                          ? "linear-gradient(135deg, #1d4e73, #2A6B9B)"
                          : "linear-gradient(135deg, #e5e7eb, #d1d5db)",
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        boxShadow: isSelected ? "0 4px 10px rgba(42,107,155,0.3)" : "none",
                      }}>
                        <span style={{ fontSize: 13, fontWeight: 900, color: isSelected ? "#fff" : "#9ca3af" }}>
                          {avatar}
                        </span>
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 800, color: "#111827" }}>{nama}</p>
                        <p style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
                          {dokter.spesialisasi || "Dokter Gigi Umum"}
                          {dokter.pengalaman_tahun > 0 && (
                            <>
                              <span style={{ color: "#d1d5db" }}> · </span>
                              {dokter.pengalaman_tahun} thn
                            </>
                          )}
                        </p>
                        {identifier && (
                          <p style={{ fontSize: 10, color: "#9ca3af", marginTop: 3, fontWeight: 600 }}>
                            {identifier}
                          </p>
                        )}
                      </div>

                      {/* Rating */}
                      {dokter.rating > 0 && (
                        <div style={{
                          display: "flex", alignItems: "center", gap: 3,
                          background: "#fffbeb", borderRadius: 8, padding: "3px 7px",
                          border: "1px solid #fde68a",
                        }}>
                          <span style={{ fontSize: 10 }}>⭐</span>
                          <span style={{ fontSize: 10, fontWeight: 800, color: "#92400e" }}>
                            {dokter.rating.toFixed(1)}
                          </span>
                        </div>
                      )}

                      {/* Check */}
                      {isSelected && (
                        <div style={{
                          width: 20, height: 20, borderRadius: "50%",
                          background: "#2A6B9B",
                          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white"
                            strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="m9 11 3 3L22 4"/>
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </section>

          {/* Pilih Tanggal */}
          <section>
            <h3 style={{ fontSize: 13, fontWeight: 800, color: "#374151", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Pilih Tanggal
            </h3>
            <div style={{
              display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4,
              msOverflowStyle: "none", scrollbarWidth: "none",
            } as React.CSSProperties}>
              {days.map((day, i) => {
                const isSelected = selectedDay === i;
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDay(i)}
                    style={{
                      display: "flex", flexDirection: "column", alignItems: "center",
                      minWidth: 52, padding: "10px 8px",
                      background: isSelected ? "linear-gradient(135deg, #1d4e73, #2A6B9B)" : "#fff",
                      border: isSelected ? "none" : "1.5px solid #e5e7eb",
                      borderRadius: 14, cursor: "pointer", fontFamily: "inherit",
                      boxShadow: isSelected ? "0 4px 14px rgba(42,107,155,0.25)" : "0 1px 4px rgba(0,0,0,0.04)",
                      transition: "all 0.15s ease",
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ fontSize: 9, fontWeight: 700, color: isSelected ? "rgba(186,230,253,0.8)" : "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      {day.label}
                    </span>
                    <span style={{ fontSize: 20, fontWeight: 900, color: isSelected ? "#fff" : "#111827", lineHeight: 1.4 }}>
                      {day.sub}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Pilih Waktu */}
          <section>
            <h3 style={{ fontSize: 13, fontWeight: 800, color: "#374151", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Pilih Waktu
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
              {WAKTU.map((waktu) => {
                const isSelected = selectedWaktu === waktu;
                return (
                  <button
                    key={waktu}
                    onClick={() => setSelectedWaktu(waktu)}
                    style={{
                      padding: "9px 6px",
                      background: isSelected ? "linear-gradient(135deg, #1d4e73, #2A6B9B)" : "#fff",
                      border: isSelected ? "none" : "1.5px solid #e5e7eb",
                      borderRadius: 10, cursor: "pointer", fontFamily: "inherit",
                      fontSize: 12, fontWeight: 700,
                      color: isSelected ? "#fff" : "#374151",
                      boxShadow: isSelected ? "0 4px 10px rgba(42,107,155,0.25)" : "0 1px 3px rgba(0,0,0,0.04)",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {waktu}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Next button */}
          <button
            onClick={goNext}
            disabled={!canNext2}
            style={{
              width: "100%", padding: "14px 0",
              background: canNext2
                ? "linear-gradient(135deg, #1d4e73, #2A6B9B)"
                : "#e5e7eb",
              border: "none", color: canNext2 ? "#fff" : "#9ca3af",
              fontWeight: 800, fontSize: 14, borderRadius: 14,
              cursor: canNext2 ? "pointer" : "not-allowed",
              fontFamily: "inherit",
              boxShadow: canNext2 ? "0 6px 20px rgba(42,107,155,0.3)" : "none",
              transition: "all 0.2s ease",
            }}
          >
            Lanjut — Konfirmasi →
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          STEP 3 — KONFIRMASI
          ═══════════════════════════════════════════ */}
      {step === 3 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, animation: "pasienFadeIn 0.2s ease-out" }}>

          {/* Summary card */}
          <div style={{
            background: "#fff", borderRadius: 20, overflow: "hidden",
            border: "1px solid rgba(115,199,227,0.15)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.07)",
          }}>
            {/* Card header gradient */}
            <div style={{
              background: "linear-gradient(135deg, #0f3a5c, #2A6B9B)",
              padding: "16px 18px",
            }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(186,230,253,0.7)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
                Ringkasan Janji Temu
              </p>
              <p style={{ fontSize: 18, fontWeight: 900, color: "#fff" }}>
                {layananData?.label}
              </p>
            </div>

            {/* Detail rows */}
            <div style={{ padding: "4px 0" }}>
              {[
                {
                  label: "Dokter",
                  value: dokterData
                    ? `${dokterData.profile.full_name} · ${dokterData.spesialisasi || "Dokter Gigi Umum"}`
                    : "-",
                  icon: "👨‍⚕️",
                },
                { label: "Tanggal", value: dayData?.full ?? "-", icon: "📅" },
                { label: "Waktu", value: selectedWaktu ? `${selectedWaktu} WIB` : "-", icon: "⏰" },
                { label: "Durasi", value: layananData?.durasi ?? "-", icon: "⏱" },
                { label: "Estimasi Biaya", value: layananData?.harga ?? "-", icon: "💳" },
              ].map((row, i, arr) => (
                <div key={row.label} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 18px",
                  borderBottom: i < arr.length - 1 ? "1px solid #f9fafb" : "none",
                }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{row.icon}</span>
                  <p style={{ fontSize: 11, color: "#9ca3af", fontWeight: 500, flex: 1 }}>{row.label}</p>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#111827", textAlign: "right", flex: 2 }}>{row.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Info notice */}
          <div style={{
            display: "flex", gap: 10, alignItems: "flex-start",
            background: "#fffbeb", border: "1px solid #fde68a",
            borderRadius: 12, padding: "10px 14px",
          }}>
            <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>💡</span>
            <p style={{ fontSize: 11, color: "#92400e", lineHeight: 1.6 }}>
              Harap hadir <strong>10 menit sebelum</strong> jadwal. Pembatalan dapat dilakukan minimal 2 jam sebelum waktu janji.
            </p>
          </div>

          {/* Catatan tambahan */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8 }}>
              Catatan Tambahan <span style={{ color: "#9ca3af", fontWeight: 400 }}>(opsional)</span>
            </label>
            <textarea
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Contoh: gigi sebelah kiri terasa ngilu..."
              rows={3}
              style={{
                width: "100%", padding: "12px 14px",
                background: "#fff", border: "1.5px solid #e5e7eb",
                borderRadius: 12, fontSize: 13, color: "#374151",
                fontFamily: "inherit", resize: "none",
                outline: "none", lineHeight: 1.6,
                transition: "border-color 0.15s ease",
                boxSizing: "border-box",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#2A6B9B")}
              onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
            />
          </div>

          {/* Pasien info — dari sesi login */}
          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            background: "#f8fafc", border: "1px solid #f1f5f9",
            borderRadius: 12, padding: "12px 14px",
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: "50%",
              background: "linear-gradient(135deg, #3b9bd4, #1d4060)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <span style={{ color: "#fff", fontSize: 13, fontWeight: 900 }}>{getUserInitials(user)}</span>
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{getUserDisplayName(user)}</p>
              <p style={{ fontSize: 11, color: "#9ca3af" }}>{user?.email ?? " "}</p>
            </div>
            <div style={{ marginLeft: "auto" }}>
              <span style={{
                fontSize: 9, fontWeight: 800, color: "#2A6B9B",
                background: "#eff6ff", padding: "3px 8px", borderRadius: 99,
                border: "1px solid #bfdbfe",
              }}>
                Pasien Aktif
              </span>
            </div>
          </div>

          {/* Submit error */}
          {submitError && (
            <div
              role="alert"
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: 12,
                padding: "10px 12px",
                fontSize: 12,
                color: "#b91c1c",
                fontWeight: 600,
              }}
            >
              ⚠ {submitError}
            </div>
          )}

          {/* Submit */}
          <button
            id="btn-konfirmasi-janji"
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              width: "100%", padding: "15px 0",
              background: submitting
                ? "#9ca3af"
                : "linear-gradient(135deg, #059669, #34d399)",
              border: "none", color: "#fff",
              fontWeight: 900, fontSize: 15, borderRadius: 14,
              cursor: submitting ? "wait" : "pointer", fontFamily: "inherit",
              boxShadow: submitting ? "none" : "0 8px 24px rgba(5,150,105,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "transform 0.15s ease",
              letterSpacing: "-0.01em",
              opacity: submitting ? 0.85 : 1,
            }}
            onMouseDown={(e) => {
              if (!submitting) e.currentTarget.style.transform = "scale(0.98)";
            }}
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            {submitting ? (
              <>
                <span
                  aria-hidden="true"
                  style={{
                    width: 16, height: 16, borderRadius: "50%",
                    border: "2.5px solid rgba(255,255,255,0.5)",
                    borderTopColor: "#fff",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
                Mengirim…
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white"
                  strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M8 2v4"/><path d="M16 2v4"/>
                  <rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>
                  <path d="m9 16 2 2 4-4"/>
                </svg>
                Konfirmasi Janji Temu
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setStep(2)}
            disabled={submitting}
            style={{
              width: "100%", padding: "11px 0",
              background: "transparent", border: "1.5px solid #e5e7eb",
              color: "#6b7280", fontWeight: 600, fontSize: 13,
              borderRadius: 14,
              cursor: submitting ? "not-allowed" : "pointer",
              opacity: submitting ? 0.5 : 1,
              fontFamily: "inherit",
            }}
          >
            ← Ubah Jadwal
          </button>
        </div>
      )}

    </div>
  );
}
