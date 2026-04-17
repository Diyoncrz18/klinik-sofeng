"use client";

/**
 * FormLihatTiket — Halaman Detail Tiket Digital
 * ──────────────────────────────────────────────────────────
 * Menampilkan tiket / boarding-pass layaknya untuk pemeriksaan.
 * Memiliki QR Code dan detail lengkap untuk ditunjukkan ke resepsionis.
 */

interface Props {
  onBack: () => void;
}

export default function FormLihatTiket({ onBack }: Props) {
  return (
    <div style={{ paddingBottom: 24, animation: "pasienFadeIn 0.2s ease-out" }}>
      
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
              Tiket Digital
            </h2>
            <p style={{ fontSize: 11, color: "#6b7280", marginTop: 2, fontWeight: 500 }}>
              Tunjukkan ke resepsionis
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        
        {/* TIKET / BOARDING PASS CONTAINER */}
        <div style={{
          background: "#fff", borderRadius: 20,
          border: "1px solid rgba(115,199,227,0.12)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          position: "relative", overflow: "hidden",
        }}>
          
          {/* Header Ticket (Biru Gradient) */}
          <div style={{
            background: "linear-gradient(135deg, #1d4e73 0%, #2A6B9B 100%)",
            padding: "24px 20px", color: "white", 
            display: "flex", flexDirection: "column", alignItems: "center",
          }}>
            <span style={{
              background: "rgba(255,255,255,0.2)", backdropFilter: "blur(4px)",
              padding: "4px 12px", borderRadius: 999, fontSize: 10, fontWeight: 800,
              letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12,
            }}>
              Mendatang
            </span>
            <h3 style={{ fontSize: 20, fontWeight: 900, letterSpacing: "-0.02em", marginBottom: 4 }}>
              Kontrol Kawat Gigi
            </h3>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", fontWeight: 500 }}>
              ID: APT-109283
            </p>
          </div>

          {/* Ticket Body */}
          <div style={{ padding: "24px 20px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {/* Kolom 1 */}
              <div>
                <p style={{ fontSize: 10, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Pasien</p>
                <p style={{ fontSize: 14, color: "#111827", fontWeight: 800 }}>Ahmad Surya</p>
              </div>
              {/* Kolom 2 */}
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: 10, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Tanggal</p>
                <p style={{ fontSize: 14, color: "#111827", fontWeight: 800 }}>22 Mei 2026</p>
              </div>
              
              {/* Kolom 3 */}
              <div>
                <p style={{ fontSize: 10, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Dokter</p>
                <p style={{ fontSize: 14, color: "#111827", fontWeight: 800 }}>Dr. Rina Santoso</p>
                <p style={{ fontSize: 11, color: "#6b7280" }}>Spesialis Ortodonti</p>
              </div>
              {/* Kolom 4 */}
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: 10, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Waktu</p>
                <p style={{ fontSize: 18, color: "#2A6B9B", fontWeight: 900 }}>09:00</p>
                <p style={{ fontSize: 11, color: "#6b7280" }}>WIB</p>
              </div>
            </div>

            {/* Separator / Tear Line */}
            <div style={{ position: "relative", margin: "24px -20px" }}>
              <div style={{ borderTop: "2px dashed #e5e7eb", position: "absolute", top: "50%", left: 0, right: 0 }} />
              {/* Circle Cutouts */}
              <div style={{ width: 24, height: 24, background: "#f7f9fb", borderRadius: "50%", position: "absolute", top: "50%", left: -12, transform: "translateY(-50%)", borderRight: "1px solid rgba(115,199,227,0.12)" }} />
              <div style={{ width: 24, height: 24, background: "#f7f9fb", borderRadius: "50%", position: "absolute", top: "50%", right: -12, transform: "translateY(-50%)", borderLeft: "1px solid rgba(115,199,227,0.12)" }} />
            </div>

            {/* QR Code Placeholder */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <p style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, marginBottom: 12 }}>
                Scan QR saat kedatangan di resepsionis
              </p>
              <div style={{ 
                width: 140, height: 140, 
                border: "2px solid #111827", borderRadius: 12,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: `
                  linear-gradient(45deg, #111827 25%, transparent 25%, transparent 75%, #111827 75%, #111827),
                  linear-gradient(45deg, #111827 25%, transparent 25%, transparent 75%, #111827 75%, #111827)
                `,
                backgroundSize: "20px 20px",
                backgroundPosition: "0 0, 10px 10px",
              }}>
                <div style={{ width: 50, height: 50, background: "white", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8 }}>
                  <span style={{ fontSize: 24 }}>🦷</span>
                </div>
              </div>
            </div>
            
          </div>
        </div>

        {/* Info Note */}
        <div style={{
          display: "flex", gap: 10, alignItems: "flex-start",
          background: "#eff6ff",
          borderRadius: 12, padding: "12px 14px",
        }}>
          <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>💡</span>
          <p style={{ fontSize: 11, color: "#1e3a8a", lineHeight: 1.6, fontWeight: 500 }}>
            Harap tiba di klinik selambatnya 15 menit sebelum waktu yang telah ditentukan untuk proses registrasi dokumen jika diperlukan.
          </p>
        </div>

      </div>

    </div>
  );
}
