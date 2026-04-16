"use client";

/**
 * TabProfil — Halaman Profil Pasien (Redesigned)
 * ─────────────────────────────────────────────────
 * Design konsisten dengan beranda, jadwal & riwayat:
 * - Hero header dengan gradient + avatar besar
 * - Info card ringkasan data pasien
 * - Menu grup dengan icon gradient
 * - Versi app footer
 * - Logout button merah premium
 */

// ── Data ──────────────────────────────────────────────────────────────────────

const MENU_GROUPS: MenuGroup[] = [
  {
    label: "Akun Saya",
    items: [
      {
        id: "menu-data-pribadi",
        label: "Data Pribadi",
        sublabel: "Nama, tanggal lahir, kontak",
        iconGradient: "linear-gradient(135deg, #1d4e73, #2A6B9B)",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="8" r="4" /><path d="M20 21a8 8 0 1 0-16 0" />
          </svg>
        ),
      },
      {
        id: "menu-pembayaran",
        label: "Riwayat Pembayaran",
        sublabel: "Tagihan & cicilan aktif",
        iconGradient: "linear-gradient(135deg, #064e3b, #059669)",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
            <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
            <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
          </svg>
        ),
      },
      {
        id: "menu-dokumen",
        label: "Dokumen & Resep",
        sublabel: "Surat rujukan & resep dokter",
        iconGradient: "linear-gradient(135deg, #4c1d95, #7c3aed)",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8l6 6v12a2 2 0 0 1-2 2z" />
            <path d="M14 2v6h6" />
            <path d="M10 9H8" /><path d="M16 13H8" /><path d="M16 17H8" />
          </svg>
        ),
      },
    ],
  },
  {
    label: "Pengaturan",
    items: [
      {
        id: "menu-notifikasi",
        label: "Notifikasi",
        sublabel: "Pengingat jadwal & promo",
        iconGradient: "linear-gradient(135deg, #78350f, #d97706)",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M10.268 21a2 2 0 0 0 3.464 0" />
            <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
          </svg>
        ),
      },
      {
        id: "menu-keamanan",
        label: "Keamanan & Password",
        sublabel: "PIN, biometrik, sandi",
        iconGradient: "linear-gradient(135deg, #1e3a5f, #0ea5e9)",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        ),
      },
    ],
  },
];

interface MenuGroup {
  label: string;
  items: MenuItem[];
}

interface MenuItem {
  id: string;
  label: string;
  sublabel: string;
  iconGradient: string;
  icon: React.ReactNode;
  badge?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function TabProfil() {
  return (
    <div style={{ paddingBottom: 16 }}>

      {/* ═══════════════════════════════════════════
          HERO — Header profil dengan gradient
          ═══════════════════════════════════════════ */}
      <div style={{ position: "relative", marginLeft: -18, marginRight: -18, marginBottom: 20 }}>

        {/* Background gradient */}
        <div style={{
          background: "linear-gradient(160deg, #0f3a5c 0%, #1d5a8a 55%, #2A6B9B 100%)",
          padding: "32px 24px 24px",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* Decorative circles */}
          <div style={{
            position: "absolute", top: -30, right: -30,
            width: 140, height: 140, borderRadius: "50%",
            background: "rgba(255,255,255,0.06)",
          }} aria-hidden="true" />
          <div style={{
            position: "absolute", bottom: 10, left: -20,
            width: 100, height: 100, borderRadius: "50%",
            background: "rgba(115,199,227,0.1)",
          }} aria-hidden="true" />

          {/* Page title */}
          <h2 style={{
            fontSize: 13, fontWeight: 700, color: "rgba(186,230,253,0.7)",
            textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 20,
          }}>
            Profil Saya
          </h2>

          {/* Avatar row */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: 16 }}>
            {/* Avatar */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div style={{
                width: 80, height: 80, borderRadius: "50%",
                background: "linear-gradient(135deg, #3b9bd4 0%, #1d4060 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 0 0 3px rgba(255,255,255,0.25), 0 8px 24px rgba(0,0,0,0.3)",
              }}>
                <span style={{ color: "#fff", fontSize: 26, fontWeight: 900, letterSpacing: 1 }}>AS</span>
              </div>
              {/* Online badge */}
              <div style={{
                position: "absolute", bottom: 3, right: 3,
                width: 16, height: 16, borderRadius: "50%",
                background: "#22c55e", border: "2.5px solid white",
                boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
              }} aria-hidden="true" />
              {/* Camera button */}
              <button
                id="btn-ganti-foto"
                aria-label="Ganti foto profil"
                style={{
                  position: "absolute", top: -4, right: -4,
                  width: 26, height: 26, borderRadius: "50%",
                  background: "#fff", border: "none",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", color: "#6b7280",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                  transition: "transform 0.15s ease",
                }}
                onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.9)")}
                onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z" />
                  <circle cx="12" cy="13" r="3" />
                </svg>
              </button>
            </div>

            {/* Name & info */}
            <div style={{ flex: 1, paddingBottom: 4 }}>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em", marginBottom: 3 }}>
                Ahmad Surya
              </h2>
              <p style={{ fontSize: 12, color: "rgba(186,230,253,0.75)", fontWeight: 500 }}>
                No. RM: 0092-1249-11
              </p>
            </div>

            {/* Edit button */}
            <button
              id="btn-edit-profil"
              aria-label="Edit profil"
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "7px 12px",
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "#fff", borderRadius: 10,
                fontSize: 11, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit",
                backdropFilter: "blur(8px)",
                flexShrink: 0, paddingBottom: 4,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white"
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit
            </button>
          </div>
        </div>

      </div>

      {/* ═══════════════════════════════════════════
          STATS — Ringkasan aktivitas
          ═══════════════════════════════════════════ */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
        gap: 10, marginBottom: 24,
      }}>
        {[
          { value: "8", label: "Kunjungan", icon: "🦷" },
          { value: "1", label: "Janji Aktif", icon: "📅" },
          { value: "3", label: "Dokumen", icon: "📋" },
        ].map((stat, i) => (
          <div key={i} style={{
            background: "#fff",
            border: "1px solid rgba(115,199,227,0.12)",
            borderRadius: 14, padding: "12px 10px", textAlign: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}>
            <div style={{ fontSize: 18, marginBottom: 4 }}>{stat.icon}</div>
            <p style={{ fontSize: 20, fontWeight: 900, color: "#111827", lineHeight: 1, marginBottom: 4 }}>
              {stat.value}
            </p>
            <p style={{ fontSize: 10, fontWeight: 600, color: "#9ca3af" }}>
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* ═══════════════════════════════════════════
          INFO CARD — Data diri singkat
          ═══════════════════════════════════════════ */}
      <div style={{
        background: "#fff",
        border: "1px solid rgba(115,199,227,0.12)",
        borderRadius: 16, overflow: "hidden",
        boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
        marginBottom: 20,
      }}>
        {/* Card header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 16px", borderBottom: "1px solid #f1f5f9",
        }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Informasi Pasien</span>
          <button style={{
            fontSize: 11, fontWeight: 700, color: "#2A6B9B",
            background: "none", border: "none", cursor: "pointer", fontFamily: "inherit",
          }}>
            Edit →
          </button>
        </div>

        {/* Info rows */}
        {[
          { label: "Nama Lengkap", value: "Ahmad Surya" },
          { label: "Tanggal Lahir", value: "12 Maret 1995" },
          { label: "Golongan Darah", value: "O+" },
          { label: "No. Telepon", value: "+62 812-3456-7890" },
        ].map((row, i, arr) => (
          <div key={row.label} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "11px 16px",
            borderBottom: i < arr.length - 1 ? "1px solid #f9fafb" : "none",
          }}>
            <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 500, flex: 1 }}>
              {row.label}
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#1f2937", flex: 1, textAlign: "right" }}>
              {row.value}
            </span>
          </div>
        ))}
      </div>

      {/* ═══════════════════════════════════════════
          MENU GROUPS
          ═══════════════════════════════════════════ */}
      {MENU_GROUPS.map((group) => (
        <div key={group.label} style={{ marginBottom: 20 }}>
          <p style={{
            fontSize: 11, fontWeight: 700, color: "#9ca3af",
            textTransform: "uppercase", letterSpacing: "0.1em",
            marginBottom: 8, paddingLeft: 2,
          }}>
            {group.label}
          </p>

          <div style={{
            background: "#fff",
            border: "1px solid rgba(115,199,227,0.12)",
            borderRadius: 16, overflow: "hidden",
            boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
          }}>
            {group.items.map((item, i) => (
              <button
                key={item.id}
                id={item.id}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  width: "100%", padding: "13px 16px",
                  borderBottom: i < group.items.length - 1 ? "1px solid #f9fafb" : "none",
                  background: "none", cursor: "pointer",
                  fontFamily: "inherit", textAlign: "left",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                onMouseDown={(e) => (e.currentTarget.style.background = "#f1f5f9")}
                onMouseUp={(e) => (e.currentTarget.style.background = "#f8fafc")}
              >
                {/* Icon */}
                <div style={{
                  width: 36, height: 36, borderRadius: 11,
                  background: item.iconGradient,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                  boxShadow: "0 3px 8px rgba(0,0,0,0.12)",
                }}>
                  {item.icon}
                </div>

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 1 }}>
                    {item.label}
                  </p>
                  <p style={{ fontSize: 11, color: "#9ca3af", fontWeight: 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.sublabel}
                  </p>
                </div>

                {/* Badge (optional) */}
                {item.badge && (
                  <span style={{
                    background: "#ef4444", color: "#fff",
                    fontSize: 9, fontWeight: 800, borderRadius: 999,
                    padding: "2px 6px", marginRight: 4,
                  }}>
                    {item.badge}
                  </span>
                )}

                {/* Chevron */}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d1d5db"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* ═══════════════════════════════════════════
          LOGOUT
          ═══════════════════════════════════════════ */}
      <button
        id="btn-keluar"
        style={{
          display: "flex", alignItems: "center", gap: 12,
          width: "100%", padding: "14px 16px",
          background: "#fff1f2",
          border: "1.5px solid #fecdd3",
          borderRadius: 16, cursor: "pointer",
          fontFamily: "inherit", textAlign: "left",
          transition: "all 0.15s ease",
          boxShadow: "0 2px 10px rgba(225,29,72,0.08)",
          marginBottom: 8,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#ffe4e6";
          e.currentTarget.style.borderColor = "#f9a8d4";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "#fff1f2";
          e.currentTarget.style.borderColor = "#fecdd3";
        }}
      >
        {/* Icon */}
        <div style={{
          width: 36, height: 36, borderRadius: 11,
          background: "linear-gradient(135deg, #be123c, #e11d48)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, boxShadow: "0 3px 8px rgba(225,29,72,0.25)",
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m16 17 5-5-5-5" /><path d="M21 12H9" />
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          </svg>
        </div>

        {/* Text */}
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 14, fontWeight: 800, color: "#be123c" }}>Keluar dari Akun</p>
          <p style={{ fontSize: 11, color: "#fb7185", fontWeight: 400 }}>Sesi akan diakhiri</p>
        </div>

        {/* Arrow */}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fda4af"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m9 18 6-6-6-6" />
        </svg>
      </button>

      {/* ── App version footer ─────────────────── */}
      <div style={{ textAlign: "center", paddingTop: 12, paddingBottom: 4 }}>
        <p style={{ fontSize: 10, color: "#d1d5db", fontWeight: 500 }}>
          Klinik Gigi App · v1.0.0
        </p>
        <p style={{ fontSize: 10, color: "#e5e7eb", marginTop: 2 }}>
          © 2026 Klinik Gigi. Semua hak dilindungi.
        </p>
      </div>

    </div>
  );
}
