"use client";

/**
 * DoctorSidebar
 * ─────────────
 * Komponen sidebar dokter yang berdiri sendiri.
 *
 * Perbaikan (2026-04-12):
 * - Import CSS Module (DoctorSidebar.module.css) — CSS sidebar tidak lagi inline di dokter.html
 * - Aksesibilitas: aria-label pada <nav>, aria-current pada item aktif, aria-expanded pada toggle
 * - Navigasi menggunakan window.__doctorDesignNavigate (didaftarkan oleh DoctorDesignShell)
 * - Active state dikelola oleh script runtime (mencari id="nav-*" dan class="menu-item")
 * - Tidak bergantung pada Lucide CDN — ikon sudah sebagai inline SVG
 */

// CSS Module — sidebar-specific styles (dipindahkan dari dokter.html <style> block)
import styles from "./DoctorSidebar.module.css";

// Tipe window yang diperlukan (didefinisikan di DoctorDesignShell)
type DoctorWindow = Window & {
  __doctorDesignNavigate?: (path: string) => void;
  toggleSidebar?: () => void;
};

// Map pageId → URL path (sumber kebenaran: doctorDesignRouting.ts)
const PAGE_PATHS: Record<string, string> = {
  dashboard:     "/dokter",
  appointment:   "/dokter/appointment",
  triage:        "/dokter/triage",
  "rekam-medis": "/dokter/rekam-medis",
  jadwal:        "/dokter/jadwal",
  antrian:       "/dokter/antrian",
  notifikasi:    "/dokter/notifikasi",
  analitik:      "/dokter/analitik",
};

function navigate(pageId: string) {
  if (typeof window === "undefined") return;
  const path = PAGE_PATHS[pageId];
  if (path) (window as DoctorWindow).__doctorDesignNavigate?.(path);
}

function toggleSidebarMenu() {
  if (typeof window !== "undefined") {
    (window as DoctorWindow).toggleSidebar?.();
  }
}

// ── Konstanta kelas menu item ──────────────────────────────────────────────
const MENU_ITEM_CLASS =
  "menu-item flex items-center px-3 py-2.5 rounded-lg mb-1 cursor-pointer group transition-colors duration-150 hover:bg-sidebar-hover";
const MENU_ICON_CLASS =
  "menu-icon w-5 h-5 text-sidebar-text group-hover:text-gray-800 flex-shrink-0 transition-colors";

export default function DoctorSidebar() {
  // Import CSS module — memastikan styles dimuat saat komponen dirender
  void styles;

  return (
    <>
      {/* Mobile Overlay */}
      <div
        id="sidebar-overlay"
        className="fixed inset-0 bg-black/50 z-40 hidden lg:hidden"
        onClick={toggleSidebarMenu}
        aria-hidden="true"
      />

      {/* ==================== SIDEBAR ==================== */}
      <aside
        id="sidebar"
        role="complementary"
        aria-label="Navigasi sidebar dokter"
        className="fixed top-0 left-0 h-full bg-sidebar-bg z-50 flex flex-col shadow-xl shadow-black/20"
        style={{ width: 260, transform: "translateX(-100%)" }}
      >
        {/* Logo & Brand */}
        <div className="brand-header flex items-center px-5 h-16 border-b border-sidebar-border flex-shrink-0">
          <div className="brand-mark flex items-center justify-center flex-shrink-0" aria-hidden="true">
            <svg viewBox="0 0 64 64" className="brand-symbol" fill="none" aria-hidden="true">
              <defs>
                <linearGradient id="brandToothFill" x1="18" y1="12" x2="48" y2="54" gradientUnits="userSpaceOnUse">
                  <stop offset="0" stopColor="#FFFFFF" />
                  <stop offset="1" stopColor="#DFF1F8" />
                </linearGradient>
              </defs>
              <path
                d="M23.5 10.5C16.02 10.5 11 16.25 11 23.85c0 7.6 2.68 16.36 5.85 23.03 1.32 2.8 3.3 5.12 5.94 5.12 2.67 0 4.38-2.33 5.39-5.48l2.18-6.83c.25-.8.99-1.35 1.84-1.35.85 0 1.59.55 1.84 1.35l2.18 6.83c1.01 3.15 2.72 5.48 5.39 5.48 2.64 0 4.62-2.32 5.94-5.12C50.32 40.21 53 31.45 53 23.85c0-7.6-5.02-13.35-12.5-13.35-2.98 0-5.66.97-8.5 2.7-2.84-1.73-5.52-2.7-8.5-2.7Z"
                fill="url(#brandToothFill)" stroke="#2A6B9B" strokeWidth="2.5" strokeLinejoin="round"
              />
              <path d="M32 19.5v9.5" stroke="#2A6B9B" strokeWidth="2.8" strokeLinecap="round" />
              <path d="M27.25 24.25h9.5" stroke="#2A6B9B" strokeWidth="2.8" strokeLinecap="round" />
              <circle cx="32" cy="24.25" r="12.5" fill="#73C7E3" opacity="0.08" />
            </svg>
          </div>
          <div className="logo-text ml-3">
            {/* h1 di sini adalah judul sidebar, bukan judul halaman utama */}
            <span className="brand-title">Klinik Gigi</span>
            <p className="brand-subtitle">Professional Dental</p>
          </div>
        </div>

        {/* Navigation — aria-label memberi konteks ke screen reader */}
        <nav
          className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3"
          aria-label="Menu utama dokter"
        >
          {/* MAIN MENU */}
          <div className="section-label px-3 mb-2" aria-hidden="true">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-heading">
              Menu Utama
            </span>
          </div>

          {/* Dashboard */}
          <a
            href="/dokter"
            id="nav-dashboard"
            className={MENU_ITEM_CLASS}
            onClick={(e) => { e.preventDefault(); navigate("dashboard"); }}
            title="Dashboard"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              aria-hidden="true" className={MENU_ICON_CLASS}>
              <rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" />
              <rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" />
            </svg>
            <span className="menu-text ml-3 text-sm text-sidebar-text group-hover:text-gray-800 transition-colors">
              Dashboard
            </span>
            <span className="menu-tooltip" aria-hidden="true">Dashboard</span>
          </a>

          {/* Appointment */}
          <a
            href="/dokter/appointment"
            id="nav-appointment"
            className={MENU_ITEM_CLASS}
            onClick={(e) => { e.preventDefault(); navigate("appointment"); }}
            title="Appointment"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              aria-hidden="true" className={MENU_ICON_CLASS}>
              <path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" />
              <path d="M3 10h18" /><path d="m9 16 2 2 4-4" />
            </svg>
            <span className="menu-text ml-3 text-sm text-sidebar-text group-hover:text-gray-800 transition-colors flex-1">
              Appointment
            </span>
            <span className="menu-text ml-auto bg-gray-50 text-gray-200 text-xs font-semibold px-2.5 py-0.5 rounded-full"
              aria-label="12 appointment">
              12
            </span>
            <span className="menu-tooltip" aria-hidden="true">Appointment</span>
          </a>

          {/* Panel Darurat / Triage */}
          <a
            href="/dokter/triage"
            id="nav-triage"
            className={MENU_ITEM_CLASS}
            onClick={(e) => { e.preventDefault(); navigate("triage"); }}
            title="Panel Darurat"
          >
            <div className="relative flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                aria-hidden="true" className={MENU_ICON_CLASS}>
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
                <path d="M12 9v4" /><path d="M12 17h.01" />
              </svg>
              <div className="notification-dot badge-pulse hidden" aria-hidden="true" />
            </div>
            <span className="menu-text ml-3 text-sm text-sidebar-text group-hover:text-gray-800 transition-colors flex-1">
              Panel Darurat
            </span>
            <span className="menu-text ml-auto bg-[#ffdddd] text-[#ff6b6b] text-xs font-semibold px-2.5 py-0.5 rounded-full"
              aria-label="3 kasus darurat">
              3
            </span>
            <span className="menu-tooltip" aria-hidden="true">Panel Darurat</span>
          </a>

          {/* Rekam Medis */}
          <a
            href="/dokter/rekam-medis"
            id="nav-rekam-medis"
            className={MENU_ITEM_CLASS}
            onClick={(e) => { e.preventDefault(); navigate("rekam-medis"); }}
            title="Rekam Medis"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              aria-hidden="true" className={MENU_ICON_CLASS}>
              <path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" />
              <path d="M14 2v5a1 1 0 0 0 1 1h5" /><path d="M10 9H8" /><path d="M16 13H8" /><path d="M16 17H8" />
            </svg>
            <span className="menu-text ml-3 text-sm text-sidebar-text group-hover:text-gray-800 transition-colors">
              Rekam Medis
            </span>
            <span className="menu-tooltip" aria-hidden="true">Rekam Medis</span>
          </a>

          {/* Divider: Operasional */}
          <div className="section-label mt-5 mb-2 px-3" aria-hidden="true">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-heading">
              Operasional
            </span>
          </div>

          {/* Optimasi Jadwal */}
          <a
            href="/dokter/jadwal"
            id="nav-jadwal"
            className={MENU_ITEM_CLASS}
            onClick={(e) => { e.preventDefault(); navigate("jadwal"); }}
            title="Optimasi Jadwal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              aria-hidden="true" className={MENU_ICON_CLASS}>
              <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
            </svg>
            <span className="menu-text ml-3 text-sm text-sidebar-text group-hover:text-gray-800 transition-colors">
              Optimasi Jadwal
            </span>
            <span className="menu-tooltip" aria-hidden="true">Optimasi Jadwal</span>
          </a>

          {/* Antrian */}
          <a
            href="/dokter/antrian"
            id="nav-antrian"
            className={MENU_ITEM_CLASS}
            onClick={(e) => { e.preventDefault(); navigate("antrian"); }}
            title="Antrian"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              aria-hidden="true" className={MENU_ICON_CLASS}>
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <path d="M16 3.128a4 4 0 0 1 0 7.744" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <circle cx="9" cy="7" r="4" />
            </svg>
            <span className="menu-text ml-3 text-sm text-sidebar-text group-hover:text-gray-800 transition-colors flex-1">
              Antrian
            </span>
            <span className="menu-text ml-auto flex items-center gap-1.5" aria-label="Live">
              <span className="w-2 h-2 rounded-full bg-primary-300 animate-pulse" aria-hidden="true" />
              <span className="text-primary-100 text-[11px] font-medium">Live</span>
            </span>
            <span className="menu-tooltip" aria-hidden="true">Antrian</span>
          </a>

          {/* Divider: Lainnya */}
          <div className="section-label mt-5 mb-2 px-3" aria-hidden="true">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-heading">
              Lainnya
            </span>
          </div>

          {/* Notifikasi */}
          <a
            href="/dokter/notifikasi"
            id="nav-notifikasi"
            className={MENU_ITEM_CLASS}
            onClick={(e) => { e.preventDefault(); navigate("notifikasi"); }}
            title="Notifikasi"
          >
            <div className="relative flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                aria-hidden="true" className={MENU_ICON_CLASS}>
                <path d="M10.268 21a2 2 0 0 0 3.464 0" />
                <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
              </svg>
              <div className="notification-dot" aria-hidden="true" />
            </div>
            <span className="menu-text ml-3 text-sm text-sidebar-text group-hover:text-gray-800 transition-colors flex-1">
              Notifikasi
            </span>
            <span className="menu-text ml-auto bg-primary-400/20 text-primary-100 text-[11px] font-semibold px-2 py-0.5 rounded-full"
              aria-label="5 notifikasi baru">
              5
            </span>
            <span className="menu-tooltip" aria-hidden="true">Notifikasi</span>
          </a>

          {/* Analitik */}
          <a
            href="/dokter/analitik"
            id="nav-analitik"
            className={MENU_ITEM_CLASS}
            onClick={(e) => { e.preventDefault(); navigate("analitik"); }}
            title="Analitik"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              aria-hidden="true" className={MENU_ICON_CLASS}>
              <path d="M3 3v16a2 2 0 0 0 2 2h16" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" />
            </svg>
            <span className="menu-text ml-3 text-sm text-sidebar-text group-hover:text-gray-800 transition-colors">
              Analitik
            </span>
            <span className="menu-tooltip" aria-hidden="true">Analitik</span>
          </a>
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-sidebar-border flex-shrink-0">
          {/* Collapse Toggle — aria-expanded dikelola JS runtime via #collapse-btn */}
          <button
            id="collapse-btn"
            type="button"
            onClick={toggleSidebarMenu}
            aria-expanded="true"
            aria-controls="sidebar"
            aria-label="Tutup sidebar"
            className="hidden lg:flex items-center w-full px-5 py-3 text-sidebar-text hover:text-gray-800 hover:bg-sidebar-hover transition-colors duration-150"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              aria-hidden="true" id="collapse-icon" className="flex-shrink-0 transition-transform duration-300">
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <path d="M9 3v18" /><path d="m16 15-3-3 3-3" />
            </svg>
            <span className="menu-text ml-3 text-sm">Tutup Sidebar</span>
          </button>

          {/* Profile Section */}
          <div
            className="flex items-center px-4 py-3 border-t border-sidebar-border group cursor-pointer hover:bg-sidebar-hover transition-colors duration-150"
            role="button"
            tabIndex={0}
            aria-label="Profil Dr. Rina Santoso"
          >
            <div
              className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-300 to-primary-700 flex items-center justify-center flex-shrink-0 ring-2 ring-primary-200/40"
              aria-hidden="true"
            >
              <span className="text-white text-sm font-bold">DR</span>
            </div>
            <div className="profile-info ml-3">
              <p className="text-gray-800 text-sm font-semibold leading-tight">Dr. Rina Santoso</p>
              <p className="text-sidebar-text text-[11px] leading-tight">Dokter Gigi Spesialis</p>
            </div>
            <div className="profile-info ml-auto" aria-hidden="true">
              {/* Logout icon */}
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className="text-sidebar-text group-hover:text-red-400 transition-colors">
                <path d="m16 17 5-5-5-5" /><path d="M21 12H9" /><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              </svg>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
