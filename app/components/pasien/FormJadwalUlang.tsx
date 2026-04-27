"use client";

/**
 * FormJadwalUlang — Halaman Form Ubah Jadwal Temu
 * ──────────────────────────────────────────────────────────
 * Memungkinkan pasien untuk mereschedule janji temu.
 * Menggunakan date picker dan time slot selector yang sama
 * dengan FormBuatJanji.
 */

import { useState } from "react";

interface Props {
  onBack: () => void;
  onSuccess: () => void;
}

const WAKTU = ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "13:00", "13:30", "14:00", "14:30", "15:00"];

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

export default function FormJadwalUlang({ onBack, onSuccess }: Props) {
  const [days] = useState(getDays);
  
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedWaktu, setSelectedWaktu] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const canNext = selectedDay !== null && selectedWaktu !== null;

  const handleSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      setTimeout(() => onSuccess(), 2000);
    }, 1500);
  };

  if (submitted) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", minHeight: "60vh", textAlign: "center", padding: "32px 24px",
      }}>
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
          Jadwal Diperbarui 🎉
        </h2>
        <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.7, marginBottom: 6 }}>
          Janji temu Anda telah berhasil diubah.
        </p>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 16, animation: "pasienFadeIn 0.2s ease-out" }}>
      
      {/* ═══════════════════════════════════════════
          STICKY HEADER
          ═══════════════════════════════════════════ */}
      <div style={{
        position: "sticky", top: 0, zIndex: 40,
        background: "rgba(247,249,251,0.97)",
        backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
        marginLeft: -18, marginRight: -18,
        paddingLeft: 18, paddingRight: 18,
        paddingTop: 16, paddingBottom: 14,
        borderBottom: "1px solid #f1f5f9",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        marginBottom: 20,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={onBack}
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
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6"/>
            </svg>
          </button>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 17, fontWeight: 900, color: "#111827", letterSpacing: "-0.02em" }}>
              Jadwal Ulang
            </h2>
            <p style={{ fontSize: 11, color: "#6b7280", marginTop: 2, fontWeight: 500 }}>
              Pilih tanggal & waktu yang baru
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        
        {/* Info Jadwal Lama */}
        <div style={{
          background: "#fff", border: "1px solid #f3f4f6", borderRadius: 16,
          padding: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
        }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
            Jadwal Sebelumnya
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 18 }}>📅</span>
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 800, color: "#111827" }}>Kamis, 22 Mei 2026</p>
              <p style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>09:00 WIB • Dr. Rina Santoso</p>
            </div>
          </div>
        </div>

        {/* Pilih Tanggal Baru */}
        <section>
          <h3 style={{ fontSize: 13, fontWeight: 800, color: "#374151", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Tanggal Baru
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

        {/* Pilih Waktu Baru */}
        <section>
          <h3 style={{ fontSize: 13, fontWeight: 800, color: "#374151", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Waktu Baru
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

        {/* Note Pengingat */}
        <div style={{
          display: "flex", gap: 10, alignItems: "flex-start",
          background: "#f8fafc", border: "1px solid #f1f5f9",
          borderRadius: 12, padding: "12px 14px",
        }}>
          <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>ℹ️</span>
          <p style={{ fontSize: 11, color: "#64748b", lineHeight: 1.6 }}>
            Jadwal maksimal diubah 1 kali. Jika jadwal baru dibatalkan, kebijakan pembatalan tetap berlaku.
          </p>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!canNext || isSubmitting}
          style={{
            width: "100%", padding: "14px 0", marginTop: 10,
            background: canNext
              ? "linear-gradient(135deg, #059669, #34d399)"
              : "#e5e7eb",
            border: "none", color: canNext ? "#fff" : "#9ca3af",
            fontWeight: 800, fontSize: 14, borderRadius: 14,
            cursor: canNext && !isSubmitting ? "pointer" : "not-allowed",
            fontFamily: "inherit",
            boxShadow: canNext ? "0 6px 20px rgba(5,150,105,0.3)" : "none",
            transition: "all 0.2s ease",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          {isSubmitting ? (
            <span style={{ fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
              <svg style={{ animation: "pasienSpin 1s linear infinite" }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              Memproses...
            </span>
          ) : (
            "Konfirmasi Jadwal Baru"
          )}
        </button>

      </div>
    </div>
  );
}
