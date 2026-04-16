/**
 * PasienBottomNav — Bottom Navigation Bar
 * ────────────────────────────────────────
 * Glassmorphism bottom nav dengan 4 tab: Home, Jadwal, Riwayat, Profil
 * Konsisten dengan styling dokter (biru #2A6B9B)
 */

import type { TabId, TabSwitcher } from "./PasienShell";

interface PasienBottomNavProps {
  activeTab: TabId;
  switchTab: TabSwitcher;
}

const NAV_ITEMS: {
  id: TabId;
  label: string;
  badge?: string;
  icon: (active: boolean) => React.ReactNode;
}[] = [
  {
    id: "home",
    label: "Home",
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
        stroke={active ? "#2A6B9B" : "#9ca3af"}
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    id: "jadwal",
    label: "Jadwal",
    badge: "1",
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
        stroke={active ? "#2A6B9B" : "#9ca3af"}
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M8 2v4" /><path d="M16 2v4" />
        <rect width="18" height="18" x="3" y="4" rx="2" />
        <path d="M3 10h18" /><path d="m9 16 2 2 4-4" />
      </svg>
    ),
  },
  {
    id: "riwayat",
    label: "Riwayat",
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
        stroke={active ? "#2A6B9B" : "#9ca3af"}
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" />
        <path d="M14 2v5a1 1 0 0 0 1 1h5" />
        <path d="M10 9H8" /><path d="M16 13H8" /><path d="M16 17H8" />
      </svg>
    ),
  },
  {
    id: "profil",
    label: "Profil",
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
        stroke={active ? "#2A6B9B" : "#9ca3af"}
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="8" r="4" /><path d="M20 21a8 8 0 1 0-16 0" />
      </svg>
    ),
  },
];

export default function PasienBottomNav({ activeTab, switchTab }: PasienBottomNavProps) {
  return (
    <nav
      className="pasien-bottom-nav"
      aria-label="Navigasi bawah aplikasi pasien"
    >
      <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center", padding: "12px 8px" }}>
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-pasien-${item.id}`}
              onClick={() => switchTab(item.id)}
              aria-current={isActive ? "page" : undefined}
              aria-label={item.label}
              className={`nav-item${isActive ? " nav-active" : ""}`}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                width: 64, gap: 6, background: "none", border: "none", cursor: "pointer",
                fontFamily: "inherit", transition: "all 0.2s ease",
              }}
            >
              {/* Icon wrapper (with optional badge) */}
              <div style={{ position: "relative" }}>
                <span className="nav-icon" style={{ display: "flex", transition: "transform 0.2s ease", transform: isActive ? "scale(1.1)" : "scale(1)" }}>
                  {item.icon(isActive)}
                </span>
                {item.badge && (
                  <span
                    aria-label={`${item.badge} jadwal aktif`}
                    style={{
                      position: "absolute", top: -4, right: -6,
                      width: 14, height: 14, borderRadius: "50%",
                      background: "#10b981", border: "2px solid white",
                      fontSize: 8, fontWeight: 700, color: "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      lineHeight: 1,
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                className="nav-label"
                style={{
                  fontSize: 11, fontWeight: 700, lineHeight: 1,
                  color: isActive ? "#1e5f8c" : "#6b7280",
                  transition: "color 0.2s ease",
                }}
              >
                {item.label}
              </span>

              {/* Active dot indicator */}
              <div className="nav-indicator" />
            </button>
          );
        })}
      </div>
    </nav>
  );
}
