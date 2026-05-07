/**
 * pasienStyles.ts
 * ──────────────
 * Design System: "Clinical Luxury Minimal"
 * Tone: Luxury / Refined + Medical Trust
 * Color: Deep Teal (#0B4F71) + Warm Slate + Soft Cream
 * Font: Plus Jakarta Sans (expressive display) + Inter (body)
 */

export const PASIEN_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=Inter:wght@400;500;600;700&display=swap');

  /* ── Design Tokens ───────────────────────────── */
  :root {
    /* Brand */
    --primary-900: #052B40;
    --primary-800: #0B4F71;
    --primary-700: #0D6B9A;
    --primary-600: #1483BC;
    --primary-400: #4BADD9;
    --primary-200: #A8D8EF;
    --primary-100: #D4EEF8;
    --primary-50:  #EBF6FB;

    /* Accent */
    --accent-teal: #0ABFBC;
    --accent-mint: #E6FAFA;

    /* Neutrals */
    --gray-950: #0C1117;
    --gray-900: #111827;
    --gray-700: #374151;
    --gray-500: #6B7280;
    --gray-400: #9CA3AF;
    --gray-300: #D1D5DB;
    --gray-200: #E5E7EB;
    --gray-100: #F3F4F6;
    --gray-50:  #F9FAFB;

    /* Semantic */
    --success-600: #059669;
    --success-100: #D1FAE5;
    --warning-600: #D97706;
    --warning-100: #FEF3C7;
    --danger-600: #DC2626;
    --danger-100: #FEE2E2;

    /* Surface */
    --bg-app: #F0F4F8;
    --bg-card: #FFFFFF;
    --bg-surface: #FAFBFD;

    /* Typography */
    --font-display: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
    --font-body: 'Inter', system-ui, -apple-system, sans-serif;

    /* Radius */
    --radius-xs: 8px;
    --radius-sm: 12px;
    --radius-md: 16px;
    --radius-lg: 20px;
    --radius-xl: 24px;
    --radius-full: 9999px;

    /* Shadow */
    --shadow-xs: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
    --shadow-sm: 0 2px 8px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04);
    --shadow-md: 0 4px 16px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04);
    --shadow-lg: 0 8px 28px rgba(0,0,0,0.10), 0 4px 10px rgba(0,0,0,0.05);
    --shadow-xl: 0 16px 48px rgba(0,0,0,0.13), 0 6px 16px rgba(0,0,0,0.06);
    --shadow-primary: 0 8px 24px rgba(11,79,113,0.28);
    --shadow-primary-sm: 0 4px 14px rgba(11,79,113,0.20);
  }

  /* ── Reset & Base ─────────────────────────────── */
  *, *::before, *::after {
    box-sizing: border-box;
    -webkit-tap-highlight-color: transparent;
  }

  /* ── Outer Shell (Desktop Background) ────────── */
  .pasien-root {
    font-family: var(--font-body);
    color: var(--gray-900);
    background: linear-gradient(145deg, #CBD8E5 0%, #D8E6F0 40%, #BFD4E6 100%);
    background-attachment: fixed;
    height: 100dvh;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* ── Mobile App Container ─────────────────────── */
  .pasien-app {
    background: var(--bg-app);
    height: 100%;
    width: 100%;
    max-width: 430px;
    position: relative;
    box-shadow:
      0 0 0 1px rgba(0,0,0,0.07),
      0 32px 80px rgba(0,0,0,0.22),
      0 10px 28px rgba(0,0,0,0.12);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    border-radius: 0;
  }

  @media (min-height: 700px) and (min-width: 480px) {
    .pasien-root { padding: 20px 0; }
    .pasien-app {
      border-radius: 44px;
      height: calc(100dvh - 40px);
    }
  }

  /* ── Main Scroll Area ─────────────────────────── */
  .pasien-main {
    flex: 1;
    width: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
    padding: 0 16px 20px 16px;
    background: var(--bg-app);
  }
  .pasien-main::-webkit-scrollbar { display: none; }
  .pasien-main { -ms-overflow-style: none; scrollbar-width: none; }

  /* Chat mode: ChatRoomView fills the main area without padding */
  .pasien-main.chat-mode {
    padding: 0 !important;
    overflow: hidden !important;
    display: flex;
    flex-direction: column;
  }
  .pasien-main.chat-mode .page-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: none !important;
  }

  /* ── Bottom Nav ───────────────────────────────── */
  .pasien-bottom-nav {
    flex-shrink: 0;
    width: 100%;
    background: rgba(255,255,255,0.97);
    backdrop-filter: blur(24px) saturate(180%);
    -webkit-backdrop-filter: blur(24px) saturate(180%);
    padding-bottom: env(safe-area-inset-bottom, 0px);
    border-top: 1px solid rgba(209,213,219,0.6);
    box-shadow: 0 -2px 20px rgba(0,0,0,0.07);
    position: relative;
    z-index: 50;
  }

  .nav-item {
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    color: var(--gray-400);
    text-decoration: none !important;
    -webkit-user-select: none;
    user-select: none;
  }

  .nav-active { color: var(--primary-800); }

  .nav-active .nav-icon svg {
    stroke: var(--primary-800) !important;
  }

  .nav-active .nav-label {
    color: var(--primary-800);
    font-weight: 700;
  }

  /* Active pill indicator */
  .nav-active-pill {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 32px;
    height: 3px;
    background: linear-gradient(90deg, var(--primary-700), var(--primary-400));
    border-radius: 0 0 var(--radius-full) var(--radius-full);
    transition: opacity 0.2s ease;
  }

  .nav-indicator {
    width: 4px; height: 4px;
    border-radius: 50%;
    background: var(--primary-600);
    opacity: 0;
    transform: scale(0);
    transition: all 0.2s ease;
    margin-top: 2px;
  }

  .nav-active .nav-indicator {
    opacity: 1;
    transform: scale(1);
  }

  /* ── Cards ────────────────────────────────────── */
  .glass-card {
    background: var(--bg-card);
    border: 1px solid rgba(209,213,219,0.5);
    box-shadow: var(--shadow-sm);
    border-radius: var(--radius-md);
  }

  /* ── Animations ───────────────────────────────── */
  @keyframes pasienFadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes slideUp {
    from { transform: translateY(100%); }
    to   { transform: translateY(0); }
  }

  @keyframes shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }

  @keyframes pulse-ring {
    0%   { box-shadow: 0 0 0 0 rgba(11,79,113,0.4); }
    70%  { box-shadow: 0 0 0 8px rgba(11,79,113,0); }
    100% { box-shadow: 0 0 0 0 rgba(11,79,113,0); }
  }

  .page-content { animation: pasienFadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards; }

  /* Skeleton shimmer */
  .skeleton {
    background: linear-gradient(90deg,
      #EDF2F7 25%,
      #E2E8F0 50%,
      #EDF2F7 75%
    );
    background-size: 800px 100%;
    animation: shimmer 1.6s ease-in-out infinite;
    border-radius: var(--radius-xs);
  }

  /* ── Filter Pills ─────────────────────────────── */
  .no-scrollbar::-webkit-scrollbar { display: none; }
  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

  .filter-pill {
    background: var(--bg-card);
    border: 1.5px solid var(--gray-200);
    color: var(--gray-700);
    font-weight: 600;
    transition: all 0.18s ease;
  }

  .filter-pill-active {
    background: var(--primary-800);
    border-color: var(--primary-800);
    color: #fff;
    font-weight: 700;
    box-shadow: var(--shadow-primary-sm);
  }

  .filter-pill-active-emerald {
    background: var(--success-600);
    border-color: var(--success-600);
    color: #fff;
    font-weight: 700;
  }

  /* ── Sticky Header ────────────────────────────── */
  .sticky-tab-header {
    position: sticky;
    top: 0;
    z-index: 30;
    background: rgba(240,244,248,0.96);
    backdrop-filter: blur(16px) saturate(160%);
    -webkit-backdrop-filter: blur(16px) saturate(160%);
    padding: 16px 0;
    margin-left: -16px;
    margin-right: -16px;
    padding-left: 16px;
    padding-right: 16px;
    border-bottom: 1px solid rgba(209,213,219,0.4);
    margin-bottom: 16px;
  }

  /* ── Press scale ─────────────────────────────── */
  .press-scale { transition: transform 0.12s ease; }
  .press-scale:active { transform: scale(0.94); }

  /* ── Interactive cards ───────────────────────── */
  .card-interactive {
    transition: transform 0.15s ease, box-shadow 0.15s ease;
    cursor: pointer;
  }
  .card-interactive:hover {
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }
  .card-interactive:active {
    transform: translateY(0) scale(0.99);
  }
`;
