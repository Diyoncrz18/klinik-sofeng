/**
 * doctorRuntimeScript.ts
 * ────────────────────────
 * Routing runtime yang di-inject ke browser sebagai <script> tag.
 * Dipisahkan dari DoctorDesignShell.tsx agar mudah dirawat.
 *
 * CATATAN: File ini di-import sebagai modul biasa. Nilai default export-nya
 * adalah factory function yang menerima data routing dan mengembalikan
 * string JavaScript siap dieksekusi di browser.
 */

import type { DoctorDesignPageId } from "./doctorDesignRouting";

interface RoutingMaps {
  pathByPageId: Record<string, string>;
  navPageByPageId: Record<string, string>;
  pageIdByPathname: Record<string, string>;
}

export function buildDoctorRuntimeScript({
  pathByPageId,
  navPageByPageId,
  pageIdByPathname,
}: RoutingMaps): string {
  return /* javascript */ `
(function () {

  // ── Routing data (injected at build time) ──────────────────────────────
  var doctorDesignPathByPageId    = ${JSON.stringify(pathByPageId)};
  var doctorDesignNavPageByPageId = ${JSON.stringify(navPageByPageId)};
  var doctorDesignPageIdByPathname = ${JSON.stringify(pageIdByPathname)};

  // ── Helpers ────────────────────────────────────────────────────────────
  function normalizeDoctorDesignPathname(pathname) {
    if (!pathname) return doctorDesignPathByPageId.dashboard;
    return pathname.endsWith('/') && pathname !== '/'
      ? pathname.slice(0, -1)
      : pathname;
  }

  function resolveDoctorDesignPageId() {
    var pathname = normalizeDoctorDesignPathname(window.location.pathname || '');
    var pageIdFromPathname = doctorDesignPageIdByPathname[pathname];
    if (pageIdFromPathname) return pageIdFromPathname;

    var hashPageId = window.location.hash ? window.location.hash.slice(1) : '';
    if (doctorDesignPathByPageId[hashPageId]) return hashPageId;

    return window.__doctorDesignInitialPageId || 'dashboard';
  }

  function syncDoctorDesignRoute(pageId, historyMode) {
    var nextPathname = doctorDesignPathByPageId[pageId] || doctorDesignPathByPageId.dashboard;
    var currentPathname = normalizeDoctorDesignPathname(window.location.pathname || '');

    if (!nextPathname) return;

    if (currentPathname === nextPathname && !window.location.hash) return;

    if (currentPathname === nextPathname && window.location.hash) {
      if (window.__doctorDesignNavigate) {
        window.__doctorDesignNavigate(nextPathname, 'replace');
      } else {
        window.history.replaceState(null, '', nextPathname);
      }
      return;
    }

    if (window.__doctorDesignNavigate) {
      window.__doctorDesignNavigate(nextPathname, historyMode === 'replace' ? 'replace' : 'push');
    } else if (historyMode === 'replace') {
      window.history.replaceState(null, '', nextPathname);
    } else {
      window.history.pushState(null, '', nextPathname);
    }
  }

  // ── Wrap setActive to sync URL ──────────────────────────────────────────
  // Menggunakan window.setActive agar tidak ada konflik TDZ dengan outer scope
  if (typeof window.setActive === 'function' && !window.__doctorDesignSetActiveWrapped) {
    var originalSetActive = window.setActive;

    window.setActive = function (el, pageId) {
      originalSetActive(el, pageId);

      var historyMode = window.__doctorDesignSetActiveHistoryMode != null
        ? window.__doctorDesignSetActiveHistoryMode
        : 'push';

      if (historyMode === 'none') return;

      syncDoctorDesignRoute(pageId, historyMode);
    };

    window.__doctorDesignSetActiveWrapped = true;
  }

  // ── Apply route on navigation ───────────────────────────────────────────
  window.__doctorDesignApplyRoute = function (historyMode) {
    var pageId = resolveDoctorDesignPageId();
    var navPageId = doctorDesignNavPageByPageId[pageId] || pageId;
    var navEl = document.getElementById('nav-' + navPageId);

    window.__doctorDesignSetActiveHistoryMode = historyMode || 'none';

    if (typeof window.setActive === 'function') {
      if (navEl && navEl.classList.contains('menu-item')) {
        window.setActive(navEl, pageId);
      } else {
        window.setActive(null, pageId);
      }
    }

    window.__doctorDesignSetActiveHistoryMode = null;

    if (window.location.hash && doctorDesignPathByPageId[pageId]) {
      syncDoctorDesignRoute(pageId, 'replace');
    }
  };

  // ── Browser history listeners ───────────────────────────────────────────
  if (!window.__doctorDesignHandlePopState) {
    window.__doctorDesignHandlePopState = function () {
      window.__doctorDesignApplyRoute && window.__doctorDesignApplyRoute('none');
    };
    window.addEventListener('popstate', window.__doctorDesignHandlePopState);
  }

  if (!window.__doctorDesignHandleHashChange) {
    window.__doctorDesignHandleHashChange = function () {
      window.__doctorDesignApplyRoute && window.__doctorDesignApplyRoute('replace');
    };
    window.addEventListener('hashchange', window.__doctorDesignHandleHashChange);
  }

  // ── Bootstrap ──────────────────────────────────────────────────────────
  window.__doctorDesignBootstrapped = true;
  window.__doctorDesignApplyRoute('none');
}());
`.trim();
}

// Type re-export for convenience
export type { DoctorDesignPageId };
