"use client";

/**
 * FormDetailRiwayat — Halaman Detail Riwayat / Jadwal Selesai
 * ──────────────────────────────────────────────────────────
 * Menampilkan rincian dari janji temu yang telah usai. Termasuk
 * catatan dokter, diagnosis, ringkasan biaya, dan resep obat.
 */

interface Props {
  onBack: () => void;
}

export default function FormDetailRiwayat({ onBack }: Props) {
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
              Detail Rekam Medis
            </h2>
            <p style={{ fontSize: 11, color: "#6b7280", marginTop: 2, fontWeight: 500 }}>
              Riwayat Kunjungan
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        
        {/* Status / Header Info */}
        <div style={{
          background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
          borderRadius: 20, padding: "20px", color: "white",
          boxShadow: "0 8px 24px rgba(16,185,129,0.2)",
          display: "flex", flexDirection: "column", gap: 12,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", background: "rgba(255,255,255,0.2)", padding: "4px 10px", borderRadius: 999 }}>
              Selesai
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>
              ID: APT-08112
            </span>
          </div>
          <div>
            <h3 style={{ fontSize: 20, fontWeight: 900, marginBottom: 4 }}>Pemeriksaan Rutin</h3>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.9)" }}>15 Mar 2026 • 10:00 WIB</p>
          </div>
        </div>

        {/* Profil Dokter & Rating */}
        <div style={{
          background: "#fff", border: "1px solid #f3f4f6", borderRadius: 16,
          padding: "16px", display: "flex", alignItems: "center", gap: 14,
          boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
        }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#e0f2fe", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 20, fontWeight: 900, color: "#0284c7" }}>RA</span>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 11, color: "#6b7280", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>Ditangani Oleh</p>
            <p style={{ fontSize: 14, fontWeight: 800, color: "#111827" }}>Dr. Rani Atmaja</p>
            <p style={{ fontSize: 12, color: "#6b7280" }}>Spesialis Gigi Umum</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 11, color: "#6b7280", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>Penilaian</p>
            <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: "#111827" }}>5.0</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#fbbf24" stroke="none">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Diagnosa & Catatan Medis */}
        <div style={{
          background: "#fff", border: "1px solid #f3f4f6", borderRadius: 16,
          padding: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
        }}>
          <h4 style={{ fontSize: 13, fontWeight: 800, color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16 }}>📋</span> Hasil Pemeriksaan
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <p style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, marginBottom: 2 }}>Diagnosis Utama</p>
              <p style={{ fontSize: 13, color: "#111827", fontWeight: 700 }}>Karies dentin gigi 36 & 46.</p>
            </div>
            <div style={{ background: "#f8fafc", padding: "12px", borderRadius: 8, border: "1px solid #f1f5f9" }}>
              <p style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, marginBottom: 4 }}>Catatan Dokter</p>
              <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.5 }}>
                Telah dilakukan penambalan komposit pada gigi 36 dan 46. Pasien dianjurkan untuk mengurangi konsumsi yang terlalu manis, rajin menggunakan dental floss, dan minum obat jika terjadi nyeri.
              </p>
            </div>
          </div>
        </div>

        {/* Resep Obat */}
        <div style={{
          background: "#fff", border: "1px solid #f3f4f6", borderRadius: 16,
          padding: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h4 style={{ fontSize: 13, fontWeight: 800, color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16 }}>💊</span> Resep Obat
            </h4>
            <span style={{ fontSize: 11, color: "#059669", background: "#ecfdf5", padding: "4px 8px", borderRadius: 6, fontWeight: 700 }}>Ditebus</span>
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            <li style={{ display: "flex", justifyContent: "space-between", fontSize: 13, borderBottom: "1px dashed #e5e7eb", paddingBottom: 8 }}>
              <span style={{ color: "#111827", fontWeight: 600 }}>Paracetamol 500mg</span>
              <span style={{ color: "#6b7280" }}>3 x 1 (PRN Pusing/Nyeri)</span>
            </li>
            <li style={{ display: "flex", justifyContent: "space-between", fontSize: 13, borderBottom: "0px dashed #e5e7eb", paddingBottom: 0 }}>
              <span style={{ color: "#111827", fontWeight: 600 }}>Asam Mefenamat 500mg</span>
              <span style={{ color: "#6b7280" }}>3 x 1 (Habiskan)</span>
            </li>
          </ul>
        </div>

        {/* Rincian Biaya */}
        <div style={{
          background: "#fff", border: "1px solid #f3f4f6", borderRadius: 16,
          padding: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
        }}>
          <h4 style={{ fontSize: 13, fontWeight: 800, color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16 }}>💳</span> Informasi Penagihan
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13, color: "#475569" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Jasa Medis & Konsultasi</span>
              <span>Rp 250.000</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Tindakan (Tambal Gigi x2)</span>
              <span>Rp 600.000</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Obat-obatan</span>
              <span>Rp 85.000</span>
            </div>
            <div style={{ height: 1, borderBottom: "1px dashed #cbd5e1", margin: "4px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 900, color: "#111827", fontSize: 15 }}>
              <span>Total Dibayar</span>
              <span>Rp 935.000</span>
            </div>
          </div>
          <button style={{
            width: "100%", padding: "10px 0", marginTop: 14,
            background: "#eff6ff", border: "none", color: "#2A6B9B",
            fontWeight: 800, fontSize: 13, borderRadius: 10,
            cursor: "pointer", fontFamily: "inherit",
          }}>
            Download Invoice (PDF)
          </button>
        </div>

      </div>
    </div>
  );
}
