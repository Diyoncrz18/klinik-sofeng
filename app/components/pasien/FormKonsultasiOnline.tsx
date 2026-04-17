"use client";

/**
 * FormKonsultasiOnline — Halaman Detail Konsultasi Online
 * ──────────────────────────────────────────────────────────
 * Menampilkan daftar dokter yang sedang online dan siap
 * memberikan konsultasi via chat/video.
 *
 * Design konsisten dengan PasienShell:
 * - Sticky header + back button
 * - Animated "Live" / "Online" indicators
 * - Dokter cards dengan rating dan harga yang jelas
 */

import { useState } from "react";

interface Props {
  onBack: () => void;
}

type Step = 1 | 2;

const SPESIALISASI = [
  { id: "umum", label: "Dokter Gigi Umum", icon: "🦷" },
  { id: "orto", label: "Spesialis Ortho", icon: "😬" },
  { id: "anak", label: "Kesehatan Anak", icon: "👶" },
  { id: "bedah", label: "Bedah Mulut", icon: "💉" },
];

const DOKTER_ONLINE = [
  {
    id: "rina",
    nama: "Dr. Rina Santoso, Sp.KG",
    spesialis: "Konservasi Gigi",
    rating: "4.9",
    pengalaman: "8 thn",
    harga: "Rp 50.000",
    avatar: "RS",
    status: "online",
  },
  {
    id: "andi",
    nama: "Dr. Andi Pratama, Sp.Ort",
    spesialis: "Orthodonsia",
    rating: "4.8",
    pengalaman: "12 thn",
    harga: "Rp 75.000",
    avatar: "AP",
    status: "online",
  },
  {
    id: "budi",
    nama: "Dr. Budi Gunawan",
    spesialis: "Dokter Gigi Umum",
    rating: "4.7",
    pengalaman: "5 thn",
    harga: "Rp 35.000",
    avatar: "BG",
    status: "sibuk",
  },
];

export default function FormKonsultasiOnline({ onBack }: Props) {
  const [step, setStep] = useState<Step>(1);
  const [activeFilter, setActiveFilter] = useState("Semua");
  const [selectedDokter, setSelectedDokter] = useState<string | null>(null);
  const [isChatting, setIsChatting] = useState(false);

  const dokterTerpilih = DOKTER_ONLINE.find(d => d.id === selectedDokter);

  const handleStartChat = () => {
    setIsChatting(true);
    // Simulasikan delay menghubungkan ke dokter
    setTimeout(() => {
      // Untuk UI demo, kita biarkan saja di state chatting
    }, 1500);
  };

  // ── Success / Chat Screen ──────────────────────────────────────────────
  if (isChatting) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", minHeight: "60vh", textAlign: "center", padding: "32px 24px",
      }}>
        <div style={{
          position: "relative",
          width: 96, height: 96, borderRadius: "50%",
          background: "linear-gradient(135deg, #1d4e73, #2A6B9B)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 8px 32px rgba(42,107,155,0.3)",
          marginBottom: 24,
          animation: "pasienPulse 2s infinite ease-in-out",
        }}>
          <span style={{ fontSize: 32, fontWeight: 900, color: "#fff" }}>
            {dokterTerpilih?.avatar}
          </span>
         
          {/* Connecting rings */}
          <div style={{
            position: "absolute", inset: -12, borderRadius: "50%",
            border: "2px dashed rgba(42,107,155,0.4)",
            animation: "pasienPulse 1.5s infinite linear",
          }} />
        </div>
        
        <h2 style={{ fontSize: 20, fontWeight: 900, color: "#111827", marginBottom: 8 }}>
          Menghubungkan...
        </h2>
        <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.6, maxWidth: 260 }}>
          Sedang menyiapkan ruang konsultasi aman dengan <strong>{dokterTerpilih?.nama}</strong>.
        </p>
        
        <button
          onClick={() => setIsChatting(false)}
          style={{
            marginTop: 40, padding: "10px 24px",
            background: "#fff", border: "1.5px solid #e5e7eb",
            color: "#ef4444", fontWeight: 700, fontSize: 13,
            borderRadius: 12, cursor: "pointer", fontFamily: "inherit",
          }}
        >
          Batalkan
        </button>
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
            onClick={() => step === 1 ? onBack() : setStep(1)}
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
              Konsultasi Online
            </h2>
            <p style={{ fontSize: 11, color: "#059669", marginTop: 2, display: "flex", alignItems: "center", gap: 4, fontWeight: 600 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 6px #10b981" }} />
              12 Dokter Aktif
            </p>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          STEP 1: PILIH DOKTER
          ═══════════════════════════════════════════ */}
      {step === 1 && (
        <div style={{ animation: "pasienFadeIn 0.2s ease-out", display: "flex", flexDirection: "column", gap: 20 }}>
          
          {/* Banner */}
          <div style={{
            background: "linear-gradient(135deg, #064e3b 0%, #059669 100%)",
            borderRadius: 16, padding: "16px 20px",
            color: "#fff", position: "relative", overflow: "hidden",
            boxShadow: "0 8px 24px rgba(5,150,105,0.25)",
          }}>
            <div style={{
              position: "absolute", top: -20, right: -20,
              width: 100, height: 100, borderRadius: "50%",
              background: "rgba(255,255,255,0.1)",
            }} aria-hidden="true" />
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>Bicara dengan Dokter</h3>
            <p style={{ fontSize: 12, color: "rgba(209,250,229,0.9)", lineHeight: 1.5, maxWidth: "85%" }}>
              Dapatkan saran medis profesional secara instan lewat chat atau video call.
            </p>
          </div>

          {/* Spesialisasi Filter */}
          <section>
            <div style={{
              display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4,
              msOverflowStyle: "none", scrollbarWidth: "none",
            } as React.CSSProperties}>
              <button
                onClick={() => setActiveFilter("Semua")}
                style={{
                  padding: "8px 16px", flexShrink: 0,
                  background: activeFilter === "Semua" ? "#2A6B9B" : "#fff",
                  border: activeFilter === "Semua" ? "none" : "1px solid #e5e7eb",
                  color: activeFilter === "Semua" ? "#fff" : "#6b7280",
                  borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                }}
              >
                Semua
              </button>
              {SPESIALISASI.map((sp) => (
                <button
                  key={sp.id}
                  onClick={() => setActiveFilter(sp.label)}
                  style={{
                    padding: "8px 16px", flexShrink: 0, display: "flex", alignItems: "center", gap: 6,
                    background: activeFilter === sp.label ? "#2A6B9B" : "#fff",
                    border: activeFilter === sp.label ? "none" : "1px solid #e5e7eb",
                    color: activeFilter === sp.label ? "#fff" : "#6b7280",
                    borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  <span>{sp.icon}</span> {sp.label}
                </button>
              ))}
            </div>
          </section>

          {/* List Dokter */}
          <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {DOKTER_ONLINE.map((dokter) => (
              <div key={dokter.id} style={{
                background: "#fff", border: "1px solid #f3f4f6", borderRadius: 16,
                padding: "16px", display: "flex", gap: 14,
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)", position: "relative",
              }}>
                {/* Avatar */}
                <div style={{ position: "relative" }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: "50%",
                    background: "linear-gradient(135deg, #1d4e73, #2A6B9B)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{ fontSize: 18, fontWeight: 900, color: "#fff" }}>{dokter.avatar}</span>
                  </div>
                  {/* Status Indicator */}
                  <div style={{
                    position: "absolute", bottom: 2, right: 2,
                    width: 14, height: 14, borderRadius: "50%",
                    background: dokter.status === "online" ? "#10b981" : "#f59e0b",
                    border: "2.5px solid white",
                  }} />
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 800, color: "#111827", marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {dokter.nama}
                  </h4>
                  <p style={{ fontSize: 11, color: "#6b7280", marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}>
                    {dokter.spesialis}
                  </p>
                  
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                      <span style={{ fontSize: 12 }}>⭐</span>
                      <span style={{ fontSize: 11, fontWeight: 800, color: "#374151" }}>{dokter.rating}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ fontSize: 12 }}>💼</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#6b7280" }}>{dokter.pengalaman}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, fontWeight: 900, color: "#059669" }}>
                    {dokter.harga}
                  </span>
                  <button
                    onClick={() => { setSelectedDokter(dokter.id); setStep(2); }}
                    style={{
                      padding: "6px 14px",
                      background: "rgba(42,107,155,0.1)", color: "#2A6B9B",
                      border: "none", borderRadius: 8,
                      fontSize: 11, fontWeight: 800, cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    Pilih
                  </button>
                </div>
              </div>
            ))}
          </section>

        </div>
      )}

      {/* ═══════════════════════════════════════════
          STEP 2: KONFIRMASI PEMBAYARAN
          ═══════════════════════════════════════════ */}
      {step === 2 && dokterTerpilih && (
        <div style={{ animation: "pasienFadeIn 0.2s ease-out", display: "flex", flexDirection: "column", gap: 20 }}>
          
          <h3 style={{ fontSize: 16, fontWeight: 900, color: "#111827", marginBottom: -4 }}>
            Detail Konsultasi
          </h3>

          <div style={{
            background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16,
            padding: "16px", display: "flex", gap: 14,
            boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
          }}>
            <div style={{
              width: 50, height: 50, borderRadius: "50%",
              background: "linear-gradient(135deg, #1d4e73, #2A6B9B)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: 16, fontWeight: 900, color: "#fff" }}>{dokterTerpilih.avatar}</span>
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 800, color: "#111827" }}>{dokterTerpilih.nama}</p>
              <p style={{ fontSize: 12, color: "#6b7280" }}>{dokterTerpilih.spesialis}</p>
              <span style={{
                display: "inline-block", marginTop: 6,
                fontSize: 10, fontWeight: 700, color: "#059669",
                background: "#ecfdf5", padding: "2px 8px", borderRadius: 20,
              }}>
                Siap Melayani
              </span>
            </div>
          </div>

          <div style={{
            background: "#f8fafc", borderRadius: 16, padding: "16px",
            border: "1px solid #f1f5f9",
          }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>
              Rincian Pembayaran
            </p>
            
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: "#475569" }}>Biaya Konsultasi (30 mnt)</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{dokterTerpilih.harga}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: "#475569" }}>Biaya Layanan</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>Rp 2.500</span>
            </div>
            
            <div style={{ borderTop: "1px dashed #cbd5e1", paddingTop: 12, display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>Total Pembayaran</span>
              <span style={{ fontSize: 15, fontWeight: 900, color: "#2A6B9B" }}>
                Rp {parseInt(dokterTerpilih.harga.replace(/[^0-9]/g, '')) + 2500}
              </span>
            </div>
          </div>

          <button
            onClick={handleStartChat}
            style={{
              width: "100%", padding: "15px 0",
              background: "linear-gradient(135deg, #059669, #34d399)",
              border: "none", color: "#fff",
              fontWeight: 900, fontSize: 15, borderRadius: 14,
              cursor: "pointer", fontFamily: "inherit",
              boxShadow: "0 8px 24px rgba(5,150,105,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "transform 0.15s ease",
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              <path d="M8 10h8" /><path d="M8 14h5" />
            </svg>
            Bayar & Mulai Konsultasi
          </button>
        </div>
      )}

    </div>
  );
}
