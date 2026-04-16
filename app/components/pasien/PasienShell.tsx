"use client";

/**
 * PasienShell
 * ────────────
 * Client component utama halaman pasien.
 * Mengelola state tab aktif dan merender tab content + bottom nav.
 *
 * Struktur:
 * ┌─────────────────────────────┐
 * │  .pasien-root               │ ← Latar desktop (bg-gray)
 * │  ┌───────────────────────┐  │
 * │  │  .pasien-app          │  │ ← Max-width 440px, bg teal-warm
 * │  │  ┌─────────────────┐  │  │
 * │  │  │  .pasien-main   │  │  │ ← Scrollable content area
 * │  │  │  [Tab Content]  │  │  │
 * │  │  └─────────────────┘  │  │
 * │  │  [PasienBottomNav]    │  │ ← Fixed bottom nav
 * │  └───────────────────────┘  │
 * └─────────────────────────────┘
 */

import { useState } from "react";
import { PASIEN_STYLES } from "./pasienStyles";
import PasienBottomNav from "./PasienBottomNav";
import TabHome from "./TabHome";
import TabJadwal from "./TabJadwal";
import TabRiwayat from "./TabRiwayat";
import TabProfil from "./TabProfil";

// ── Types ekspor untuk digunakan oleh child components ─────────────────────
export type TabId = "home" | "jadwal" | "riwayat" | "profil";
export type TabSwitcher = (tab: TabId) => void;

// ── Komponen utama ─────────────────────────────────────────────────────────
export default function PasienShell() {
  const [activeTab, setActiveTab] = useState<TabId>("home");

  const switchTab: TabSwitcher = (tab) => {
    setActiveTab(tab);
    // Scroll ke atas saat pindah tab
    const main = document.querySelector(".pasien-main");
    if (main) main.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      {/* Inject CSS pasien (terpisah dari globals.css agar tidak conflict) */}
      <style dangerouslySetInnerHTML={{ __html: PASIEN_STYLES }} />

      <div className="pasien-root">
        <div className="pasien-app">

          {/* ── Scrollable Content ─────────── */}
          <main className="pasien-main" aria-label="Konten utama aplikasi pasien">
            {activeTab === "home" && (
              <div className="page-content" key="home">
                <TabHome switchTab={switchTab} />
              </div>
            )}
            {activeTab === "jadwal" && (
              <div className="page-content" key="jadwal">
                <TabJadwal />
              </div>
            )}
            {activeTab === "riwayat" && (
              <div className="page-content" key="riwayat">
                <TabRiwayat />
              </div>
            )}
            {activeTab === "profil" && (
              <div className="page-content" key="profil">
                <TabProfil />
              </div>
            )}
          </main>

          {/* ── Bottom Navigation ──────────── */}
          <PasienBottomNav activeTab={activeTab} switchTab={switchTab} />

        </div>
      </div>
    </>
  );
}
