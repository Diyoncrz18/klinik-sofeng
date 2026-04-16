/**
 * pasienStyles.ts
 * ──────────────
 * CSS string untuk halaman pasien (mobile app shell).
 * Dipisah dari komponen utama agar mudah dirawat.
 */

export const PASIEN_STYLES = `
  /* ── Reset & base ───────────────────────────── */
  *, *::before, *::after {
    box-sizing: border-box;
    -webkit-tap-highlight-color: transparent;
  }

  :root {
    --primary: #2A6B9B;
    --font-app: var(--font-inter, 'Inter', system-ui, -apple-system, sans-serif);
  }

  /* ── Outer shell (desktop background) ─────── */
  .pasien-root {
    font-family: var(--font-app);
    color: #1f2937;
    background-color: #dde3eb;
    background-image:
      radial-gradient(ellipse at top, #c9d8e8, transparent 60%),
      radial-gradient(ellipse at bottom, #d5e6ee, transparent 60%);
    height: 100dvh;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* ── Mobile app container ──────────────────── */
  .pasien-app {
    background-color: #f7f9fb;
    height: 100%;
    width: 100%;
    max-width: 440px;
    position: relative;
    box-shadow:
      0 0 0 1px rgba(0,0,0,0.06),
      0 24px 64px rgba(0,0,0,0.18),
      0 8px 24px rgba(0,0,0,0.1);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    border-radius: 0;
  }

  /* Desktop: show phone frame */
  @media (min-height: 700px) and (min-width: 480px) {
    .pasien-root { padding: 24px 0; }
    .pasien-app {
      border-radius: 40px;
      height: calc(100dvh - 48px);
    }
  }

  /* ── App Header (Glassmorphism) ────────────── */
  .app-header {
    background: rgba(255, 255, 255, 0.96);
    border-bottom: 1px solid rgba(115, 199, 227, 0.2);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
  }

  /* ── Main scroll area ──────────────────────── */
  .pasien-main {
    flex: 1;
    width: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
    padding: 0 18px 16px 18px;
    background: #f7f9fb;
  }
  .pasien-main::-webkit-scrollbar { display: none; }
  .pasien-main { -ms-overflow-style: none; scrollbar-width: none; }

  /* ── Cards ─────────────────────────────────── */
  .glass-card {
    background: #ffffff;
    border: 1px solid rgba(115, 199, 227, 0.12);
    box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  }

  .gradient-hero-card {
    background: linear-gradient(135deg, #1d4e73 0%, #2A6B9B 100%);
    position: relative;
    overflow: hidden;
  }
  .gradient-hero-card::after {
    content: '';
    position: absolute;
    top: -20px; right: -20px;
    width: 100px; height: 100px;
    background: radial-gradient(circle, rgba(255,255,255,0.15), transparent 70%);
    border-radius: 50%;
  }

  /* ── Bottom Nav ─────────────────────────────── */
  /*
   * PENTING: Gunakan flex item biasa (bukan position:absolute/fixed).
   * Di mobile browser, position:absolute di dalam overflow:auto parent
   * akan kehilangan touch events karena scroll container menangkap
   * semua pointer events lebih dulu.
   */
  .pasien-bottom-nav {
    /* Flex item — duduk di bawah pasien-app secara alami */
    flex-shrink: 0;
    width: 100%;
    background: rgba(255, 255, 255, 0.98);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    /* Safe area untuk iPhone notch/home indicator */
    padding-bottom: env(safe-area-inset-bottom, 0px);
    border-top: 1px solid rgba(229, 231, 235, 0.8);
    box-shadow: 0 -4px 16px rgba(0,0,0,0.06);
    /* Pastikan selalu di atas konten scroll */
    position: relative;
    z-index: 50;
  }

  .nav-item {
    transition: all 0.2s ease;
    color: #9ca3af;
  }
  .nav-active { color: #2A6B9B; }
  .nav-active .nav-icon { color: #2A6B9B; transform: scale(1.1); }
  .nav-active .nav-label { color: #1e5f8c; }

  .nav-indicator {
    opacity: 0;
    transform: translateY(4px);
    transition: all 0.2s ease;
    background-color: #2A6B9B;
    width: 4px; height: 4px;
    border-radius: 50%;
    margin-top: 2px;
  }
  .nav-active .nav-indicator {
    opacity: 1;
    transform: translateY(0);
  }

  /* ── Page fade-in ──────────────────────────── */
  @keyframes pasienFadeIn {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .page-content { animation: pasienFadeIn 0.25s ease-out forwards; }

  /* ── No scrollbar on filter chips ─────────── */
  .no-scrollbar::-webkit-scrollbar { display: none; }
  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

  /* ── Sticky section header ─────────────────── */
  .sticky-tab-header {
    position: sticky;
    top: 0;
    z-index: 30;
    background: rgba(247, 249, 251, 0.96);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    padding-bottom: 16px;
    padding-top: 40px;
    margin-left: -18px;
    margin-right: -18px;
    padding-left: 18px;
    padding-right: 18px;
    border-bottom: 1px solid #f3f4f6;
    box-shadow: 0 1px 4px rgba(0,0,0,0.04);
    margin-bottom: 16px;
  }

  /* ── Filter pill buttons ────────────────────── */
  .filter-pill-active {
    background: #111827;
    color: #fff;
    font-weight: 900;
    box-shadow: 0 4px 10px rgba(17,24,39,0.2);
  }
  .filter-pill-active-emerald {
    background: #059669;
    color: #fff;
    font-weight: 900;
    box-shadow: 0 4px 10px rgba(5,150,105,0.3);
  }
  .filter-pill {
    background: #fff;
    border: 1px solid #e5e7eb;
    color: #374151;
    font-weight: 700;
  }

  /* ── Animate scale on press ────────────────── */
  .press-scale:active { transform: scale(0.95); }
`;
