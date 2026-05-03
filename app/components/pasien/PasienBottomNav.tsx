"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PASIEN_PATHS, getActivePasienTab, type PasienTabId } from "./pasienRouting";

interface NavItem {
  id: PasienTabId;
  label: string;
  href: string;
  badge?: string;
  icon: (active: boolean) => React.ReactNode;
}

// ── Premium Phosphor-style icons ──────────────────────────────────────────────
const HomeIcon = ({ active }: { active: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    {active ? (
      <>
        <path d="M3 9.5L12 3L21 9.5V20C21 20.5523 20.5523 21 20 21H15V15H9V21H4C3.44772 21 3 20.5523 3 20V9.5Z" fill="#0B4F71" />
        <path d="M9 21V15H15V21" stroke="#0B4F71" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </>
    ) : (
      <>
        <path d="M3 9.5L12 3L21 9.5V20C21 20.5523 20.5523 21 20 21H15V15H9V21H4C3.44772 21 3 20.5523 3 20V9.5Z" stroke="#9CA3AF" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      </>
    )}
  </svg>
);

const CalendarIcon = ({ active }: { active: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    {active ? (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2.5" fill="#0B4F71" />
        <path d="M3 10H21" stroke="white" strokeWidth="1.5"/>
        <path d="M8 3V7M16 3V7" stroke="#0B4F71" strokeWidth="2" strokeLinecap="round"/>
        <path d="M8 14L10.5 16.5L16 12" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
      </>
    ) : (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2.5" stroke="#9CA3AF" strokeWidth="1.75" fill="none"/>
        <path d="M3 10H21" stroke="#9CA3AF" strokeWidth="1.5"/>
        <path d="M8 3V7M16 3V7" stroke="#9CA3AF" strokeWidth="1.75" strokeLinecap="round"/>
        <path d="M8 14L10.5 16.5L16 12" stroke="#9CA3AF" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
      </>
    )}
  </svg>
);

const FileIcon = ({ active }: { active: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    {active ? (
      <>
        <path d="M6 2H14L20 8V20C20 21.1046 19.1046 22 18 22H6C4.89543 22 4 21.1046 4 20V4C4 2.89543 4.89543 2 6 2Z" fill="#0B4F71"/>
        <path d="M14 2V8H20" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M8 13H16M8 17H12" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      </>
    ) : (
      <>
        <path d="M6 2H14L20 8V20C20 21.1046 19.1046 22 18 22H6C4.89543 22 4 21.1046 4 20V4C4 2.89543 4.89543 2 6 2Z" stroke="#9CA3AF" strokeWidth="1.75" fill="none"/>
        <path d="M14 2V8H20" stroke="#9CA3AF" strokeWidth="1.75" strokeLinecap="round"/>
        <path d="M8 13H16M8 17H12" stroke="#9CA3AF" strokeWidth="1.75" strokeLinecap="round"/>
      </>
    )}
  </svg>
);

const UserIcon = ({ active }: { active: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    {active ? (
      <>
        <circle cx="12" cy="8" r="4" fill="#0B4F71"/>
        <path d="M4 20C4 17.7909 7.58172 16 12 16C16.4183 16 20 17.7909 20 20" stroke="#0B4F71" strokeWidth="2" strokeLinecap="round"/>
      </>
    ) : (
      <>
        <circle cx="12" cy="8" r="4" stroke="#9CA3AF" strokeWidth="1.75" fill="none"/>
        <path d="M4 20C4 17.7909 7.58172 16 12 16C16.4183 16 20 17.7909 20 20" stroke="#9CA3AF" strokeWidth="1.75" strokeLinecap="round"/>
      </>
    )}
  </svg>
);

const NAV_ITEMS: NavItem[] = [
  { id: "home",    label: "Beranda",  href: PASIEN_PATHS.home,    icon: (a) => <HomeIcon active={a} /> },
  { id: "jadwal",  label: "Jadwal",   href: PASIEN_PATHS.jadwal,  badge: "1", icon: (a) => <CalendarIcon active={a} /> },
  { id: "riwayat", label: "Riwayat",  href: PASIEN_PATHS.riwayat, icon: (a) => <FileIcon active={a} /> },
  { id: "profil",  label: "Profil",   href: PASIEN_PATHS.profil,  icon: (a) => <UserIcon active={a} /> },
];

export default function PasienBottomNav() {
  const pathname = usePathname() || "";
  const activeTab = getActivePasienTab(pathname);

  return (
    <nav className="pasien-bottom-nav" aria-label="Navigasi bawah aplikasi pasien">
      <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center", padding: "10px 4px 12px" }}>
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <Link
              key={item.id}
              id={`nav-pasien-${item.id}`}
              href={item.href}
              prefetch
              aria-current={isActive ? "page" : undefined}
              aria-label={item.label}
              className={`nav-item${isActive ? " nav-active" : ""}`}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                gap: 4, width: 72, position: "relative",
                textDecoration: "none",
                transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)",
              }}
            >
              {/* Active top indicator */}
              <div style={{
                position: "absolute", top: -10, left: "50%",
                transform: "translateX(-50%)",
                width: isActive ? 28 : 0,
                height: 3,
                background: "linear-gradient(90deg, #0B4F71, #4BADD9)",
                borderRadius: "0 0 6px 6px",
                transition: "width 0.25s cubic-bezier(0.4,0,0.2,1)",
              }} aria-hidden="true" />

              {/* Icon container */}
              <div
                className="nav-icon"
                style={{
                  width: 46, height: 34,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  borderRadius: 12,
                  background: isActive ? "rgba(11,79,113,0.09)" : "transparent",
                  transition: "background 0.2s ease",
                  position: "relative",
                }}
              >
                {item.icon(isActive)}
                {item.badge && (
                  <span
                    aria-label={`${item.badge} jadwal aktif`}
                    style={{
                      position: "absolute", top: 2, right: 6,
                      width: 15, height: 15, borderRadius: "50%",
                      background: "#EF4444", border: "2px solid white",
                      fontSize: 8, fontWeight: 800, color: "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
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
                  fontSize: 10, fontWeight: isActive ? 700 : 500,
                  color: isActive ? "#0B4F71" : "#9CA3AF",
                  letterSpacing: isActive ? "0.01em" : "0",
                  transition: "all 0.2s ease",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
