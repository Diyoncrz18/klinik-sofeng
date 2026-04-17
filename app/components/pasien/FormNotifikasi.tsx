"use client";

/**
 * FormNotifikasi — Halaman Daftar Notifikasi Pasien
 * ──────────────────────────────────────────────────────────
 * Menampilkan daftar pemberitahuan seperti pengingat jadwal,
 * promo khusus, dan info akun.
 *
 * Design konsisten dengan PasienShell:
 * - Sticky header + back button
 * - Unread badges
 * - Card list layout
 */

interface Props {
  onBack: () => void;
}

const NOTIFICATIONS = [
  {
    id: 1,
    title: "Pengingat Jadwal",
    desc: "Besok Anda memiliki jadwal Kontrol Kawat Gigi pada pk 14.00 WIB. Harap hadir 10 menit lebih awal.",
    time: "2 Jam lalu",
    icon: "📅",
    bg: "#eff6ff",
    color: "#2A6B9B",
    unread: true,
  },
  {
    id: 2,
    title: "Promo Scaling Gigi 20%",
    desc: "Khusus bulan ini! Klaim voucher potongan 20% untuk semua layanan pembersihan karang gigi.",
    time: "Kemarin",
    icon: "🎉",
    bg: "#fef2f2",
    color: "#ef4444",
    unread: false,
  },
  {
    id: 3,
    title: "Sistem Terhubung",
    desc: "Akun Anda kini berhasil dihubungkan ke asuransi kesehatan mandiri Anda.",
    time: "3 Hari lalu",
    icon: "🛡️",
    bg: "#ecfdf5",
    color: "#059669",
    unread: false,
  },
];

export default function FormNotifikasi({ onBack }: Props) {
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
          
          <div style={{ flex: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 900, color: "#111827", letterSpacing: "-0.02em" }}>
                Notifikasi
              </h2>
              <p style={{ fontSize: 11, color: "#6b7280", marginTop: 2, fontWeight: 500 }}>
                1 pesan baru
              </p>
            </div>
            
            <button style={{
              background: "none", border: "none", color: "#2A6B9B",
              fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            }}>
              Tandai Dibaca
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          LIST NOTIFIKASI
          ═══════════════════════════════════════════ */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {NOTIFICATIONS.map((notif) => (
          <div key={notif.id} style={{
            background: notif.unread ? "#fff" : "rgba(255,255,255,0.6)",
            border: notif.unread ? "1.5px solid #bae6fd" : "1px solid #f3f4f6",
            borderRadius: 16, padding: "16px",
            display: "flex", gap: 14, position: "relative",
            boxShadow: notif.unread ? "0 4px 12px rgba(42,107,155,0.06)" : "none",
            transition: "all 0.2s ease",
          }}>
            {/* Unread dot indicator */}
            {notif.unread && (
              <span style={{
                position: "absolute", top: 16, right: 16,
                width: 8, height: 8, borderRadius: "50%", background: "#ef4444"
              }} />
            )}

            {/* Icon */}
            <div style={{
              width: 44, height: 44, borderRadius: "50%",
              background: notif.bg,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <span style={{ fontSize: 20 }}>{notif.icon}</span>
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0, paddingRight: notif.unread ? 12 : 0 }}>
              <h4 style={{ fontSize: 14, fontWeight: 800, color: "#111827", marginBottom: 4 }}>
                {notif.title}
              </h4>
              <p style={{ fontSize: 12, color: "#4b5563", lineHeight: 1.5, marginBottom: 8 }}>
                {notif.desc}
              </p>
              <p style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af" }}>
                {notif.time}
              </p>
            </div>
          </div>
        ))}
        
        {/* End of list state */}
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <p style={{ fontSize: 12, color: "#9ca3af", fontWeight: 500 }}>
            Tidak ada notifikasi lainnya
          </p>
        </div>

      </div>

    </div>
  );
}
