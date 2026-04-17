"use client";

/**
 * PasienShell
 * ────────────
 * Client component utama halaman pasien.
 * Mengelola state tab aktif + sub-view (misal: form buat janji).
 *
 * Struktur:
 * ┌─────────────────────────────┐
 * │  .pasien-root               │ ← Latar desktop (bg-gray)
 * │  ┌───────────────────────┐  │
 * │  │  .pasien-app          │  │ ← Max-width 440px
 * │  │  ┌─────────────────┐  │  │
 * │  │  │  .pasien-main   │  │  │ ← Scrollable content area
 * │  │  │  [Tab/View]     │  │  │
 * │  │  └─────────────────┘  │  │
 * │  │  [PasienBottomNav]    │  │ ← Flex item (bukan fixed/absolute)
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
import FormBuatJanji from "./FormBuatJanji";
import FormKonsultasiOnline from "./FormKonsultasiOnline";
import FormLokasiKlinik from "./FormLokasiKlinik";
import FormNotifikasi from "./FormNotifikasi";
import FormJadwalUlang from "./FormJadwalUlang";
import FormLihatTiket from "./FormLihatTiket";
import FormDetailRiwayat from "./FormDetailRiwayat";

// ── Types ekspor untuk digunakan oleh child components ─────────────────────
export type TabId = "home" | "jadwal" | "riwayat" | "profil";
export type TabSwitcher = (tab: TabId) => void;
export type OpenView = (view: "buat-janji" | "konsultasi-online" | "lokasi-klinik" | "notifikasi" | "jadwal-ulang" | "lihat-tiket" | "detail-riwayat") => void;

// ── Komponen utama ─────────────────────────────────────────────────────────
export default function PasienShell() {
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [activeView, setActiveView] = useState<"buat-janji" | "konsultasi-online" | "lokasi-klinik" | "notifikasi" | "jadwal-ulang" | "lihat-tiket" | "detail-riwayat" | null>(null);

  const switchTab: TabSwitcher = (tab) => {
    setActiveView(null); // Tutup sub-view saat pindah tab
    setActiveTab(tab);
    scrollTop();
  };

  const openView: OpenView = (view) => {
    setActiveView(view);
    scrollTop();
  };

  const closeView = () => {
    setActiveView(null);
    scrollTop();
  };

  const scrollTop = () => {
    const main = document.querySelector(".pasien-main");
    if (main) main.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Sembunyikan bottom nav saat sub-view aktif
  const showNav = activeView === null;

  return (
    <>
      {/* Inject CSS pasien (terpisah dari globals.css agar tidak conflict) */}
      <style dangerouslySetInnerHTML={{ __html: PASIEN_STYLES }} />

      <div className="pasien-root">
        <div className="pasien-app">

          {/* ── Scrollable Content ─────────── */}
          <main className="pasien-main" aria-label="Konten utama aplikasi pasien">

            {/* ── Sub-view: Form Buat Janji ── */}
            {activeView === "buat-janji" && (
              <div className="page-content" key="buat-janji">
                <FormBuatJanji
                  onBack={closeView}
                  onSuccess={() => { closeView(); switchTab("jadwal"); }}
                />
              </div>
            )}

            {/* ── Sub-view: Form Konsultasi Online ── */}
            {activeView === "konsultasi-online" && (
              <div className="page-content" key="konsultasi-online">
                <FormKonsultasiOnline
                  onBack={closeView}
                />
              </div>
            )}

            {/* ── Sub-view: Lokasi Klinik ── */}
            {activeView === "lokasi-klinik" && (
              <div className="page-content" key="lokasi-klinik">
                <FormLokasiKlinik
                  onBack={closeView}
                />
              </div>
            )}

            {/* ── Sub-view: Notifikasi ── */}
            {activeView === "notifikasi" && (
              <div className="page-content" key="notifikasi">
                <FormNotifikasi
                  onBack={closeView}
                />
              </div>
            )}

            {/* ── Sub-view: Jadwal Ulang ── */}
            {activeView === "jadwal-ulang" && (
              <div className="page-content" key="jadwal-ulang">
                <FormJadwalUlang
                  onBack={closeView}
                  onSuccess={() => { closeView(); switchTab("jadwal"); }}
                />
              </div>
            )}

            {/* ── Sub-view: Lihat Tiket ── */}
            {activeView === "lihat-tiket" && (
              <div className="page-content" key="lihat-tiket">
                <FormLihatTiket
                  onBack={closeView}
                />
              </div>
            )}

            {/* ── Sub-view: Detail Riwayat ── */}
            {activeView === "detail-riwayat" && (
              <div className="page-content" key="detail-riwayat">
                <FormDetailRiwayat
                  onBack={closeView}
                />
              </div>
            )}

            {/* ── Tab Views (tersembunyi saat sub-view aktif) ── */}
            {activeView === null && (
              <>
                {activeTab === "home" && (
                  <div className="page-content" key="home">
                    <TabHome switchTab={switchTab} openView={openView} />
                  </div>
                )}
                {activeTab === "jadwal" && (
                  <div className="page-content" key="jadwal">
                    <TabJadwal openView={openView} />
                  </div>
                )}
                {activeTab === "riwayat" && (
                  <div className="page-content" key="riwayat">
                    <TabRiwayat openView={openView} />
                  </div>
                )}
                {activeTab === "profil" && (
                  <div className="page-content" key="profil">
                    <TabProfil />
                  </div>
                )}
              </>
            )}
          </main>

          {/* ── Bottom Navigation (hanya saat tidak ada sub-view) ── */}
          {showNav && (
            <PasienBottomNav activeTab={activeTab} switchTab={switchTab} />
          )}

        </div>
      </div>
    </>
  );
}
