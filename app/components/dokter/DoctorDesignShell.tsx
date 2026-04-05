"use client";

import { startTransition, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import {
  doctorDesignNavPageByPageId,
  doctorDesignPageIdByPathname,
  doctorDesignPathByPageId,
} from "./doctorDesignRouting";

declare global {
  interface Window {
    lucide?: { createIcons: () => void };
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

const LUCIDE_SCRIPT_SRC = "https://unpkg.com/lucide@1.7.0/dist/umd/lucide.js";

function ensureLucideScript() {
  return new Promise<void>((resolve, reject) => {
    if (window.lucide?.createIcons) {
      resolve();
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-doctor-design-lucide="true"]',
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Failed to load Lucide runtime.")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = LUCIDE_SCRIPT_SRC;
    script.async = true;
    script.dataset.doctorDesignLucide = "true";
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener(
      "error",
      () => reject(new Error("Failed to load Lucide runtime.")),
      { once: true },
    );
    document.body.appendChild(script);
  });
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

  useEffect(() => {
    const preventHashAnchors = (event: MouseEvent) => {
      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      const link = target.closest<HTMLAnchorElement>('a[href^="#"]');

      if (!link) {
        return;
      }

      event.preventDefault();
    };

    document.addEventListener("click", preventHashAnchors, true);

    return () => {
      document.removeEventListener("click", preventHashAnchors, true);
    };
  }, []);

  useEffect(() => {
    window.__doctorDesignNavigate = (nextPathname, mode = "push") => {
      startTransition(() => {
        if (mode === "replace") {
          router.replace(nextPathname, { scroll: false });
          return;
        }

        router.push(nextPathname, { scroll: false });
      });
    };

    return () => {
      delete window.__doctorDesignNavigate;
    };
  }, [router]);

  useEffect(() => {
    let cancelled = false;

    const routingRuntime = `
const doctorDesignPathByPageId = ${JSON.stringify(doctorDesignPathByPageId)};
const doctorDesignNavPageByPageId = ${JSON.stringify(doctorDesignNavPageByPageId)};
const doctorDesignPageIdByPathname = ${JSON.stringify(doctorDesignPageIdByPathname)};

function normalizeDoctorDesignPathname(pathname) {
  if (!pathname) {
    return doctorDesignPathByPageId.dashboard;
  }

  return pathname.endsWith('/') && pathname !== '/' ? pathname.slice(0, -1) : pathname;
}

function resolveDoctorDesignPageId() {
  var pathname = normalizeDoctorDesignPathname(window.location.pathname || '');
  var pageIdFromPathname = doctorDesignPageIdByPathname[pathname];

  if (pageIdFromPathname) {
    return pageIdFromPathname;
  }

  var hashPageId = window.location.hash ? window.location.hash.slice(1) : '';

  if (doctorDesignPathByPageId[hashPageId]) {
    return hashPageId;
  }

  return window.__doctorDesignInitialPageId || 'dashboard';
}

function syncDoctorDesignRoute(pageId, historyMode) {
  var nextPathname = doctorDesignPathByPageId[pageId] || doctorDesignPathByPageId.dashboard;
  var currentPathname = normalizeDoctorDesignPathname(window.location.pathname || '');

  if (!nextPathname) {
    return;
  }

  if (currentPathname === nextPathname && !window.location.hash) {
    return;
  }

  if (currentPathname === nextPathname && window.location.hash) {
    if (window.__doctorDesignNavigate) {
      window.__doctorDesignNavigate(nextPathname, 'replace');
      return;
    }

    window.history.replaceState(null, '', nextPathname);
    return;
  }

  if (window.__doctorDesignNavigate) {
    window.__doctorDesignNavigate(nextPathname, historyMode === 'replace' ? 'replace' : 'push');
    return;
  }

  if (historyMode === 'replace') {
    window.history.replaceState(null, '', nextPathname);
    return;
  }

  window.history.pushState(null, '', nextPathname);
}

if (typeof setActive === 'function' && !window.__doctorDesignSetActiveWrapped) {
  const originalSetActive = setActive;

  setActive = function (el, pageId) {
    originalSetActive(el, pageId);

    var historyMode = window.__doctorDesignSetActiveHistoryMode ?? 'push';

    if (historyMode === 'none') {
      return;
    }

    syncDoctorDesignRoute(pageId, historyMode);
  };

  window.__doctorDesignSetActiveWrapped = true;
}

window.__doctorDesignApplyRoute = function (historyMode) {
  var pageId = resolveDoctorDesignPageId();
  var navPageId = doctorDesignNavPageByPageId[pageId] || pageId;
  var navEl = document.getElementById('nav-' + navPageId);

  window.__doctorDesignSetActiveHistoryMode = historyMode || 'none';

  if (navEl && navEl.classList.contains('menu-item')) {
    setActive(navEl, pageId);
  } else {
    setActive(null, pageId);
  }

  window.__doctorDesignSetActiveHistoryMode = null;

  if (window.location.hash && doctorDesignPathByPageId[pageId]) {
    syncDoctorDesignRoute(pageId, 'replace');
  }
};

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

window.__doctorDesignBootstrapped = true;
window.__doctorDesignApplyRoute('none');
`;

    window.__doctorDesignInitialPageId = initialPageId;

    ensureLucideScript()
      .then(() => {
        if (cancelled) {
          return;
        }

        if (!window.__doctorDesignBootstrapped) {
          document
            .querySelectorAll('script[data-doctor-design-runtime="true"]')
            .forEach((node) => node.remove());

          const runtimeScript = document.createElement("script");
          runtimeScript.dataset.doctorDesignRuntime = "true";
          runtimeScript.text = `${scriptContent}\n${routingRuntime}`;
          document.body.appendChild(runtimeScript);
          return;
        }

        window.__doctorDesignApplyRoute?.("none");
        window.lucide?.createIcons();
      })
      .catch((error) => {
        console.error("Doctor design runtime failed to initialize.", error);
      });

    return () => {
      cancelled = true;

      // DO NOT reset window.__doctorDesignBootstrapped or remove the script node.
      // If we remove the script node and re-inject it, global const/let variables 
      // from the injected HTML will throw SyntaxError on redeclaration.
      
      if (window.__doctorDesignHandlePopState) {
        window.removeEventListener("popstate", window.__doctorDesignHandlePopState);
      }

      if (window.__doctorDesignHandleHashChange) {
        window.removeEventListener("hashchange", window.__doctorDesignHandleHashChange);
      }

      if (typeof window.handleResize === "function") {
        window.removeEventListener("resize", window.handleResize);
      }

      // Re-attach handlers on next mount by tricking the logic, but don't delete bootstrapped flag
      delete window.__doctorDesignHandlePopState;
      delete window.__doctorDesignHandleHashChange;
      
      // We don't delete __doctorDesignApplyRoute or bootstrapped
    };
    // scriptContent is static because every dokter route uses the same source HTML runtime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    window.__doctorDesignInitialPageId = initialPageId;
    window.__doctorDesignApplyRoute?.("none");
  }, [initialPageId, pathname]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div
        data-doctor-design-root
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: bodyHtml }}
      />
    </>
  );
}
