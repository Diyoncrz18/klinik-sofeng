"use client";

/**
 * FormLokasiKlinik — Halaman Detail Lokasi Klinik
 * ──────────────────────────────────────────────────────────
 * Menampilkan informasi lokasi klinik, jam operasional,
 * fasilitas, dan kontak.
 *
 * Design konsisten dengan PasienShell:
 * - Sticky header + back button
 * - Map placeholder elegan
 * - List tile untuk jam buka, fasilitas, kontak
 * - Button CTA utama ("Buka di Maps")
 */

import { useState } from "react";

interface Props {
  onBack: () => void;
}

const JAM_OPERASIONAL = [
  { hari: "Senin - Jumat", jam: "08:00 - 20:00" },
  { hari: "Sabtu", jam: "09:00 - 17:00" },
  { hari: "Minggu", jam: "Tutup", isTutup: true },
];

const FASILITAS = [
  { icon: "🚗", label: "Parkir Gratis" },
  { icon: "🛜", label: "Wi-Fi Gratis" },
  { icon: "🕌", label: "Mushola" },
  { icon: "🛝", label: "Ruang Anak" },
];

export default function FormLokasiKlinik({ onBack }: Props) {
  const [isOpeningMap, setIsOpeningMap] = useState(false);

  const handleOpenMaps = () => {
    setIsOpeningMap(true);
    // Simulasikan membuka peta
    setTimeout(() => {
      setIsOpeningMap(false);
      // alert("Membuka Google Maps...");
    }, 1000);
  };

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
              Lokasi Klinik
            </h2>
            <p style={{ fontSize: 11, color: "#6b7280", marginTop: 2, fontWeight: 500 }}>
              Pusat Layanan Kesehatan Gigi
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        
        {/* ── Map Card (Visual Placeholder) ── */}
        <div style={{
          background: "#fff", border: "1px solid #f3f4f6", borderRadius: 20,
          overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
        }}>
          {/* Cover image / Map mockup */}
          <div style={{
            height: 160, position: "relative",
            background: "linear-gradient(135deg, #1d4e73 0%, #2A6B9B 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {/* Dekorasi Map UI */}
            <div style={{
              position: "absolute", inset: 0,
              backgroundImage: "radial-gradient(rgba(255,255,255,0.15) 1px, transparent 1px)",
              backgroundSize: "20px 20px"
            }} />
            
            {/* Marker */}
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              animation: "pasienPulse 2s infinite", zIndex: 2,
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: "50% 50% 50% 0",
                background: "#ef4444", transform: "rotate(-45deg)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 10px rgba(239,68,68,0.4)", border: "3px solid white"
              }}>
                <span style={{
                  width: 14, height: 14, borderRadius: "50%",
                  background: "white", transform: "rotate(45deg)"
                }} />
              </div>
            </div>
          </div>

          <div style={{ padding: "18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <h3 style={{ fontSize: 16, fontWeight: 900, color: "#111827", letterSpacing: "-0.01em" }}>
                Klinik Sofeng Utama
              </h3>
              <span style={{ fontSize: 10, fontWeight: 800, color: "#059669", background: "#ecfdf5", padding: "4px 8px", borderRadius: 999 }}>
                1.2 km
              </span>
            </div>
            <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6 }}>
              Jl. Jendral Sudirman No. 45, Gedung Graha Medika Lt. 2, Jakarta Selatan, 12190
            </p>
          </div>
        </div>

        {/* ── CTA Open in Maps ── */}
        <button
          onClick={handleOpenMaps}
          style={{
            width: "100%", padding: "14px 0",
            background: "#fff", border: "1.5px solid #2A6B9B", color: "#2A6B9B",
            fontWeight: 800, fontSize: 14, borderRadius: 14,
            cursor: "pointer", fontFamily: "inherit",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            transition: "all 0.15s ease",
            boxShadow: "0 4px 12px rgba(42,107,155,0.08)",
          }}
          onMouseDown={(e) => { e.currentTarget.style.background = "#eff6ff"; }}
          onMouseUp={(e) => { e.currentTarget.style.background = "#fff"; }}
        >
          {isOpeningMap ? (
            <span style={{ fontSize: 14, fontWeight: 700 }}>Membuka Peta...</span>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11a3 3 0 1 0 6 0 3 3 0 0 0-6 0z" />
                <path d="M17.657 16.657L13.414 20.9a2 2 0 0 1-2.827 0l-4.244-4.243a8 8 0 1 1 11.314 0z" />
              </svg>
              Petunjuk Arah & Peta
            </>
          )}
        </button>

        {/* ── Jam Operasional ── */}
        <section style={{ marginTop: 6 }}>
          <h4 style={{ fontSize: 13, fontWeight: 800, color: "#374151", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
            Jam Operasional
          </h4>
          <div style={{
            background: "#fff", borderRadius: 16, overflow: "hidden",
            border: "1px solid #f3f4f6", boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
          }}>
            {JAM_OPERASIONAL.map((item, idx) => (
              <div key={idx} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "14px 18px",
                borderBottom: idx < JAM_OPERASIONAL.length - 1 ? "1px solid #f9fafb" : "none",
              }}>
                <span style={{ fontSize: 13, color: "#475569", fontWeight: 500 }}>{item.hari}</span>
                <span style={{
                  fontSize: 13, fontWeight: item.isTutup ? 900 : 700,
                  color: item.isTutup ? "#ef4444" : "#111827",
                }}>
                  {item.jam}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Kontak ── */}
        <section>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{
              background: "#fff", border: "1px solid #f3f4f6", borderRadius: 16,
              padding: "16px", display: "flex", flexDirection: "column", gap: 8,
              boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
            }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </div>
              <div>
                <p style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>Tlp / WhatsApp</p>
                <p style={{ fontSize: 13, fontWeight: 800, color: "#111827", marginTop: 2 }}>0812-3456-7890</p>
              </div>
            </div>
            <div style={{
              background: "#fff", border: "1px solid #f3f4f6", borderRadius: 16,
              padding: "16px", display: "flex", flexDirection: "column", gap: 8,
              boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
            }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2A6B9B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </div>
              <div>
                <p style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>Email</p>
                <p style={{ fontSize: 13, fontWeight: 800, color: "#111827", marginTop: 2 }}>halo@sofeng.id</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Fasilitas ── */}
        <section style={{ marginTop: 6 }}>
          <h4 style={{ fontSize: 13, fontWeight: 800, color: "#374151", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
            Fasilitas Klinik
          </h4>
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10
          }}>
            {FASILITAS.map((fas, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 10,
                background: "#f8fafc", borderRadius: 12, padding: "10px 14px",
                border: "1px solid #f1f5f9",
              }}>
                <span style={{ fontSize: 18 }}>{fas.icon}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>{fas.label}</span>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
