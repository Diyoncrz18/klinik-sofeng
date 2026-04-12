"use client";

/**
 * DoctorDesignShell
 * ─────────────────
 * Client component yang mengelola lifecycle halaman dokter:
 * 1. Mene-inject body CSS classes dari dokter.html
 * 2. Mencegah hash anchor navigation
 * 3. Mendaftarkan window.__doctorDesignNavigate ke Next.js router
 * 4. Mene-inject script runtime (content switcher + routing) sekali saat bootstrap
 * 5. Mengaplikasikan route yang benar saat navigasi terjadi
 *
 * Perubahan (2026-04-12):
 * - DIHAPUS: Lucide CDN (unpkg.com) — SVG sudah inlined, tidak perlu createIcons()
 * - BARU: Routing runtime dipindah ke doctorRuntimeScript.ts (lebih bersih)
 * - Sidebar dipindah ke DoctorSidebar.tsx (tidak dirender di sini lagi — dirender sebagai sibling)
 */

import { startTransition, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import {
  doctorDesignNavPageByPageId,
  doctorDesignPageIdByPathname,
  doctorDesignPathByPageId,
} from "./doctorDesignRouting";
import { buildDoctorRuntimeScript } from "./doctorRuntimeScript";
import DoctorSidebar from "./DoctorSidebar";

declare global {
  interface Window {
    handleResize?: () => void;
    __doctorDesignBootstrapped?: boolean;
    __doctorDesignApplyRoute?: (historyMode?: "none" | "push" | "replace") => void;
    __doctorDesignSetActiveWrapped?: boolean;
    __doctorDesignNavigate?: (pathname: string, mode?: "push" | "replace") => void;
    __doctorDesignInitialPageId?: string;
    __doctorDesignSetActiveHistoryMode?: "none" | "push" | "replace" | null;
    __doctorDesignHandlePopState?: () => void;
    __doctorDesignHandleHashChange?: () => void;
  }
}

interface DoctorDesignShellProps {
  bodyClassName: string;
  bodyHtml: string;
  initialPageId?: string;
  styles: string;
  scriptContent: string;
}

export default function DoctorDesignShell({
  bodyClassName,
  bodyHtml,
  initialPageId = "dashboard",
  styles,
  scriptContent,
}: DoctorDesignShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  // ── 1. Body class dari dokter.html (bg-gray-50, dll.) ─────────────────
  useEffect(() => {
    const bodyClasses = bodyClassName.split(/\s+/).filter(Boolean);
    if (bodyClasses.length > 0) {
      document.body.classList.add(...bodyClasses);
    }
    return () => {
      if (bodyClasses.length > 0) {
        document.body.classList.remove(...bodyClasses);
      }
    };
  }, [bodyClassName]);

  // ── 2. Cegah hash anchor navigation (href="#pageId") ──────────────────
  useEffect(() => {
    const preventHashAnchors = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const link = event.target.closest<HTMLAnchorElement>('a[href^="#"]');
      if (!link) return;
      event.preventDefault();
    };

    document.addEventListener("click", preventHashAnchors, true);
    return () => document.removeEventListener("click", preventHashAnchors, true);
  }, []);

  // ── 3. Daftarkan window.__doctorDesignNavigate ke Next.js router ───────
  useEffect(() => {
    window.__doctorDesignNavigate = (nextPathname, mode = "push") => {
      startTransition(() => {
        if (mode === "replace") {
          router.replace(nextPathname, { scroll: false });
        } else {
          router.push(nextPathname, { scroll: false });
        }
      });
    };

    return () => {
      delete window.__doctorDesignNavigate;
    };
  }, [router]);

  // ── 4. Bootstrap: inject script runtime SEKALI ────────────────────────
  //    Catatan: SVG sudah inlined di HTML dan di DoctorSidebar.tsx,
  //    sehingga Lucide CDN (createIcons) tidak diperlukan lagi.
  useEffect(() => {
    let cancelled = false;

    window.__doctorDesignInitialPageId = initialPageId;

    // Bangun routing runtime dari factory function (doctorRuntimeScript.ts)
    const routingRuntime = buildDoctorRuntimeScript({
      pathByPageId: doctorDesignPathByPageId as Record<string, string>,
      navPageByPageId: doctorDesignNavPageByPageId as Record<string, string>,
      pageIdByPathname: doctorDesignPageIdByPathname,
    });

    if (!window.__doctorDesignBootstrapped) {
      // Hapus script runtime lama jika ada
      document
        .querySelectorAll('script[data-doctor-design-runtime="true"]')
        .forEach((node) => node.remove());

      const runtimeScript = document.createElement("script");
      runtimeScript.dataset.doctorDesignRuntime = "true";
      // Script content dari dokter.html (setActive, toggleSidebar, dll.)
      // digabung dengan routing runtime dari doctorRuntimeScript.ts
      runtimeScript.text = `${scriptContent}\n${routingRuntime}`;
      document.body.appendChild(runtimeScript);
    } else if (!cancelled) {
      // Sudah bootstrap — hanya apply route
      window.__doctorDesignApplyRoute?.("none");
    }

    return () => {
      cancelled = true;

      // Bersihkan browser history listeners (akan didaftarkan ulang saat mount berikutnya)
      if (window.__doctorDesignHandlePopState) {
        window.removeEventListener("popstate", window.__doctorDesignHandlePopState);
      }
      if (window.__doctorDesignHandleHashChange) {
        window.removeEventListener("hashchange", window.__doctorDesignHandleHashChange);
      }
      if (typeof window.handleResize === "function") {
        window.removeEventListener("resize", window.handleResize);
      }

      delete window.__doctorDesignHandlePopState;
      delete window.__doctorDesignHandleHashChange;
      // Sengaja TIDAK delete __doctorDesignBootstrapped dan __doctorDesignApplyRoute
      // karena akan menyebabkan SyntaxError (redeclaration of const/let dari scriptContent)
    };

    // scriptContent statis — semua route dokter menggunakan HTML runtime yang sama
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 5. Terapkan route dan restore sidebar saat navigasi ───────────────
  useEffect(() => {
    window.__doctorDesignInitialPageId = initialPageId;
    window.__doctorDesignApplyRoute?.("none");
  }, [initialPageId, pathname]);

  // Fix: Restore sidebar setelah Next.js routing
  // Sidebar mulai dengan transform: translateX(-100%) sebagai initial state.
  // handleResize() dari script runtime mengatur posisi yang benar.
  useEffect(() => {
    if (typeof window.handleResize === "function") {
      window.handleResize();
    }
  }, [pathname]);

  return (
    <>
      {/* CSS dari dokter.html (purge Tailwind per halaman — Poin 3) */}
      <style dangerouslySetInnerHTML={{ __html: styles }} />

      {/* Sidebar — komponen tersendiri di DoctorSidebar.tsx */}
      <DoctorSidebar />

      {/* Konten halaman dari dokter.html */}
      <div
        data-doctor-design-root
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: bodyHtml }}
      />
    </>
  );
}
