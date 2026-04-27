"use client";

/**
 * PasienAppShell
 * ────────────────
 * Wrapper kerangka aplikasi pasien (mobile-first phone frame).
 *
 * Tugas:
 *  1. Menyuntik CSS pasien (`PASIEN_STYLES`) sekali secara global.
 *  2. Menyusun struktur: .pasien-root → .pasien-app → main + bottom nav.
 *  3. Menyembunyikan bottom nav secara otomatis pada halaman sub-view & auth.
 *
 * Komponen ini PURE shell — tidak menyimpan state navigasi.
 * Sumber kebenaran tab aktif: URL pathname (via `usePathname`).
 */

import type { ReactNode } from "react";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

import PasienBottomNav from "./PasienBottomNav";
import { PASIEN_STYLES } from "./pasienStyles";
import { isPasienTabPath } from "./pasienRouting";

interface PasienAppShellProps {
  children: ReactNode;
}

export default function PasienAppShell({ children }: PasienAppShellProps) {
  const pathname = usePathname() || "";
  const showBottomNav = isPasienTabPath(pathname);

  // Pastikan body bersih dari class dokter (kalau user pindah dari /dokter ke /pasien)
  useEffect(() => {
    document.body.classList.remove("doctor-dashboard-body", "bg-gray-50", "min-h-screen");
  }, []);

  // Scroll ke atas tiap kali route berubah (UX seperti app native)
  useEffect(() => {
    const main = document.querySelector(".pasien-main");
    if (main) main.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);

  return (
    <>
      {/* Inject CSS pasien (terpisah dari globals.css) */}
      <style dangerouslySetInnerHTML={{ __html: PASIEN_STYLES }} />

      <div className="pasien-root">
        <div className="pasien-app">
          {/* Scrollable content area */}
          <main className="pasien-main" aria-label="Konten utama aplikasi pasien">
            <div className="page-content" key={pathname}>
              {children}
            </div>
          </main>

          {/* Bottom navigation (hanya di tab utama) */}
          {showBottomNav ? <PasienBottomNav /> : null}
        </div>
      </div>
    </>
  );
}
