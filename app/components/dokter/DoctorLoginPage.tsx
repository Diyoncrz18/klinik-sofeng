"use client";

/**
 * DoctorLoginPage
 * ───────────────
 * Halaman login untuk dokter — desain konsisten dengan sistem klinik:
 * - Palet warna: biru medis (#2A6B9B, #73C7E3, #1E3A4C)
 * - Typography: Inter (sama dengan layout global)
 * - Glassmorphism card + animated background blobs
 * - Micro-interactions: focus states, loading state, password toggle
 */

import { useState, useId } from "react";
import { useRouter } from "next/navigation";

export default function DoctorLoginPage() {
  const router = useRouter();
  const formId = useId();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [focusedField, setFocusedField] = useState<"email" | "password" | null>(null);

  const emailId = `${formId}-email`;
  const passwordId = `${formId}-password`;
  const rememberId = `${formId}-remember`;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Email dan password wajib diisi.");
      return;
    }

    setIsLoading(true);

    // Simulasi proses login — ganti dengan API call nyata
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsLoading(false);
    // Arahkan ke dashboard dokter setelah login
    router.push("/dokter");
  }

  return (
    <>
      <style>{`
        /* ── Reset & font ───────────────────────────── */
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .login-root {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          font-family: var(--font-inter, 'Inter', system-ui, -apple-system, sans-serif);
          background: #0d2333;
          overflow: hidden;
        }

        /* ── Left panel — ilustrasi ─────────────────── */
        .login-panel-left {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          overflow: hidden;
          background: linear-gradient(145deg, #0d2333 0%, #1a3f5c 40%, #0f2e44 100%);
        }

        /* Background decorative blobs */
        .blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(72px);
          opacity: 0.35;
          pointer-events: none;
          animation: blobFloat 8s ease-in-out infinite;
        }
        .blob-1 {
          width: 420px; height: 420px;
          background: radial-gradient(circle, #2A6B9B, #155a8a);
          top: -120px; left: -80px;
          animation-delay: 0s;
        }
        .blob-2 {
          width: 320px; height: 320px;
          background: radial-gradient(circle, #73C7E3, #4ab3d8);
          bottom: -60px; right: -60px;
          animation-delay: 3s;
        }
        .blob-3 {
          width: 200px; height: 200px;
          background: radial-gradient(circle, #1e8fb8, #0c5f80);
          top: 50%; right: 10%;
          animation-delay: 1.5s;
        }

        @keyframes blobFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(12px, -18px) scale(1.04); }
          66% { transform: translate(-8px, 10px) scale(0.97); }
        }

        /* Grid pattern overlay */
        .login-panel-left::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(115, 199, 227, 0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(115, 199, 227, 0.06) 1px, transparent 1px);
          background-size: 40px 40px;
          mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%);
        }

        .left-content {
          position: relative;
          z-index: 1;
          text-align: center;
          max-width: 420px;
        }

        /* Brand logo */
        .brand-logo-wrap {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 80px;
          height: 80px;
          border-radius: 24px;
          background: linear-gradient(180deg, #ffffff 0%, #e8f5fb 100%);
          border: 1px solid rgba(108, 189, 233, 0.3);
          box-shadow:
            0 20px 48px rgba(115, 199, 227, 0.3),
            0 4px 12px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.9);
          margin-bottom: 1.75rem;
        }

        .brand-logo-wrap svg {
          width: 48px;
          height: 48px;
        }

        .left-headline {
          font-size: 2rem;
          font-weight: 800;
          color: #ffffff;
          line-height: 1.15;
          letter-spacing: -0.03em;
          margin-bottom: 0.75rem;
        }

        .left-headline span {
          background: linear-gradient(135deg, #73C7E3, #a8dff0);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .left-tagline {
          font-size: 0.9375rem;
          color: rgba(175, 215, 232, 0.75);
          line-height: 1.6;
          margin-bottom: 2.5rem;
        }

        /* Feature list */
        .feature-list {
          display: flex;
          flex-direction: column;
          gap: 0.875rem;
          text-align: left;
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(115, 199, 227, 0.15);
          border-radius: 12px;
          padding: 0.75rem 1rem;
          backdrop-filter: blur(8px);
          transition: background 0.2s ease, border-color 0.2s ease;
        }

        .feature-item:hover {
          background: rgba(115, 199, 227, 0.08);
          border-color: rgba(115, 199, 227, 0.28);
        }

        .feature-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: rgba(42, 107, 155, 0.5);
          border: 1px solid rgba(115, 199, 227, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: #73C7E3;
        }

        .feature-text strong {
          display: block;
          font-size: 0.875rem;
          font-weight: 600;
          color: #e8f5fb;
          line-height: 1.2;
        }

        .feature-text span {
          font-size: 0.78125rem;
          color: rgba(175, 215, 232, 0.6);
          line-height: 1.4;
        }

        /* ── Right panel — form ─────────────────────── */
        .login-panel-right {
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f8fbfd;
          padding: 2.5rem;
          position: relative;
        }

        /* Subtle background texture */
        .login-panel-right::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 100% 60% at 50% 0%, rgba(115, 199, 227, 0.07), transparent 70%);
          pointer-events: none;
        }

        .form-card {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 420px;
        }

        /* Form header */
        .form-header {
          margin-bottom: 2rem;
        }

        .form-welcome {
          font-size: 0.8125rem;
          font-weight: 600;
          color: #2A6B9B;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 0.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .form-welcome::before {
          content: '';
          display: inline-block;
          width: 20px;
          height: 2px;
          background: #2A6B9B;
          border-radius: 2px;
        }

        .form-title {
          font-size: 1.75rem;
          font-weight: 800;
          color: #0d2333;
          line-height: 1.2;
          letter-spacing: -0.025em;
          margin-bottom: 0.5rem;
        }

        .form-subtitle {
          font-size: 0.9rem;
          color: #4a7a94;
          line-height: 1.5;
        }

        /* Form fields */
        .field-group {
          display: flex;
          flex-direction: column;
          gap: 1.125rem;
          margin-bottom: 1.25rem;
        }

        .field-label {
          display: block;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #1a3f5c;
          margin-bottom: 0.4rem;
          letter-spacing: 0.01em;
        }

        .field-wrap {
          position: relative;
        }

        .field-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #7aadcc;
          pointer-events: none;
          transition: color 0.2s ease;
        }

        .field-wrap:focus-within .field-icon {
          color: #2A6B9B;
        }

        .field-input {
          width: 100%;
          height: 48px;
          padding: 0 14px 0 42px;
          border-radius: 12px;
          border: 1.5px solid #cde4f0;
          background: #ffffff;
          font-family: inherit;
          font-size: 0.9375rem;
          font-weight: 400;
          color: #0d2333;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          -webkit-appearance: none;
        }

        .field-input::placeholder {
          color: #a8c8da;
          font-weight: 400;
        }

        .field-input:focus {
          border-color: #2A6B9B;
          box-shadow: 0 0 0 3.5px rgba(42, 107, 155, 0.12);
        }

        .field-input.field-error {
          border-color: #e05252;
          box-shadow: 0 0 0 3px rgba(224, 82, 82, 0.1);
        }

        /* Password toggle button */
        .pwd-toggle {
          position: absolute;
          right: 13px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #7aadcc;
          padding: 4px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s ease, background 0.15s ease;
        }

        .pwd-toggle:hover {
          color: #2A6B9B;
          background: rgba(42, 107, 155, 0.08);
        }

        .pwd-toggle:focus-visible {
          outline: 2px solid #2A6B9B;
          outline-offset: 2px;
        }

        /* Remember + Forgot row */
        .form-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
        }

        .remember-wrap {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }

        .remember-cb {
          width: 18px;
          height: 18px;
          border-radius: 5px;
          border: 1.5px solid #a8c8da;
          background: #ffffff;
          cursor: pointer;
          accent-color: #2A6B9B;
          flex-shrink: 0;
          transition: border-color 0.15s ease;
        }

        .remember-cb:checked {
          border-color: #2A6B9B;
        }

        .remember-label {
          font-size: 0.875rem;
          color: #4a7a94;
          user-select: none;
          cursor: pointer;
        }

        .forgot-link {
          font-size: 0.875rem;
          font-weight: 600;
          color: #2A6B9B;
          text-decoration: none;
          transition: color 0.15s ease;
        }

        .forgot-link:hover {
          color: #1a5480;
          text-decoration: underline;
        }

        /* Error alert */
        .error-alert {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          background: #fff0f0;
          border: 1.5px solid #fcc;
          border-radius: 10px;
          padding: 0.75rem 1rem;
          margin-bottom: 1.25rem;
          font-size: 0.875rem;
          color: #c0392b;
          font-weight: 500;
          animation: alertSlide 0.2s ease;
        }

        @keyframes alertSlide {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Submit button */
        .submit-btn {
          width: 100%;
          height: 52px;
          border-radius: 14px;
          border: none;
          background: linear-gradient(135deg, #2A6B9B 0%, #1a5480 100%);
          color: #ffffff;
          font-family: inherit;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.625rem;
          letter-spacing: 0.01em;
          transition:
            transform 0.15s ease,
            box-shadow 0.2s ease,
            background 0.2s ease;
          box-shadow:
            0 4px 14px rgba(42, 107, 155, 0.35),
            0 1px 3px rgba(0, 0, 0, 0.1);
          margin-bottom: 1.375rem;
          position: relative;
          overflow: hidden;
        }

        .submit-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0));
          border-radius: inherit;
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-1.5px);
          box-shadow:
            0 8px 24px rgba(42, 107, 155, 0.4),
            0 2px 6px rgba(0, 0, 0, 0.12);
          background: linear-gradient(135deg, #2e78ae 0%, #1d5e91 100%);
        }

        .submit-btn:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: 0 2px 8px rgba(42, 107, 155, 0.3);
        }

        .submit-btn:disabled {
          opacity: 0.75;
          cursor: not-allowed;
        }

        .submit-btn:focus-visible {
          outline: 3px solid rgba(42, 107, 155, 0.45);
          outline-offset: 2px;
        }

        /* Loading spinner in button */
        .btn-spinner {
          width: 20px;
          height: 20px;
          border: 2.5px solid rgba(255,255,255,0.35);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          flex-shrink: 0;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }



        /* ── Responsive ─────────────────────────────── */
        @media (max-width: 768px) {
          .login-root {
            grid-template-columns: 1fr;
          }

          .login-panel-left {
            display: none;
          }

          .login-panel-right {
            padding: 1.5rem 1.25rem;
            align-items: flex-start;
            padding-top: 3rem;
          }

          .form-card {
            max-width: 100%;
          }
        }
      `}</style>

      <div className="login-root" role="main">
        {/* ── LEFT ─────────────────────────────────── */}
        <aside className="login-panel-left" aria-hidden="true">
          {/* Decorative blobs */}
          <div className="blob blob-1" />
          <div className="blob blob-2" />
          <div className="blob blob-3" />

          <div className="left-content">
            {/* Brand logo mark */}
            <div className="brand-logo-wrap">
              <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
                <defs>
                  <linearGradient id="loginToothFill" x1="18" y1="12" x2="48" y2="54" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stopColor="#FFFFFF" />
                    <stop offset="1" stopColor="#DFF1F8" />
                  </linearGradient>
                </defs>
                <path
                  d="M23.5 10.5C16.02 10.5 11 16.25 11 23.85c0 7.6 2.68 16.36 5.85 23.03 1.32 2.8 3.3 5.12 5.94 5.12 2.67 0 4.38-2.33 5.39-5.48l2.18-6.83c.25-.8.99-1.35 1.84-1.35.85 0 1.59.55 1.84 1.35l2.18 6.83c1.01 3.15 2.72 5.48 5.39 5.48 2.64 0 4.62-2.32 5.94-5.12C50.32 40.21 53 31.45 53 23.85c0-7.6-5.02-13.35-12.5-13.35-2.98 0-5.66.97-8.5 2.7-2.84-1.73-5.52-2.7-8.5-2.7Z"
                  fill="url(#loginToothFill)" stroke="#2A6B9B" strokeWidth="2.5" strokeLinejoin="round"
                />
                <path d="M32 19.5v9.5" stroke="#2A6B9B" strokeWidth="2.8" strokeLinecap="round" />
                <path d="M27.25 24.25h9.5" stroke="#2A6B9B" strokeWidth="2.8" strokeLinecap="round" />
                <circle cx="32" cy="24.25" r="12.5" fill="#73C7E3" opacity="0.1" />
              </svg>
            </div>

            <h1 className="left-headline">
              Sistem Manajemen<br />
              <span>Klinik Gigi</span>
            </h1>
            <p className="left-tagline">
              Platform terpadu untuk dokter gigi mengelola appointment, rekam medis, dan antrian pasien secara efisien.
            </p>

            {/* Feature highlights */}
            <div className="feature-list" role="list">
              {[
                {
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M8 2v4" /><path d="M16 2v4" />
                      <rect width="18" height="18" x="3" y="4" rx="2" />
                      <path d="M3 10h18" /><path d="m9 16 2 2 4-4" />
                    </svg>
                  ),
                  title: "Smart Scheduling",
                  desc: "Manajemen jadwal dan appointment cerdas",
                },
                {
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" />
                      <path d="M14 2v5a1 1 0 0 0 1 1h5" />
                      <path d="M10 9H8" /><path d="M16 13H8" /><path d="M16 17H8" />
                    </svg>
                  ),
                  title: "Rekam Medis Digital",
                  desc: "Riwayat pasien lengkap dan terstruktur",
                },
                {
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
                      <path d="M12 9v4" /><path d="M12 17h.01" />
                    </svg>
                  ),
                  title: "Prioritas Darurat",
                  desc: "Sistem triage real-time untuk kasus mendesak",
                },
              ].map((f) => (
                <div key={f.title} className="feature-item" role="listitem">
                  <div className="feature-icon">{f.icon}</div>
                  <div className="feature-text">
                    <strong>{f.title}</strong>
                    <span>{f.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* ── RIGHT ─────────────────────────────────── */}
        <section className="login-panel-right">
          <div className="form-card">
            {/* Header */}
            <header className="form-header">
              <p className="form-welcome">Portal Dokter</p>
              <h2 className="form-title">Selamat Datang Kembali</h2>
              <p className="form-subtitle">
                Masukkan kredensial Anda untuk mengakses dashboard dokter.
              </p>
            </header>

            {/* Error alert */}
            {error && (
              <div className="error-alert" role="alert">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4" /><path d="M12 16h.01" />
                </svg>
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate>
              <div className="field-group">
                {/* Email */}
                <div>
                  <label htmlFor={emailId} className="field-label">
                    Email Dokter
                  </label>
                  <div className="field-wrap">
                    <span className="field-icon" aria-hidden="true">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="20" height="16" x="2" y="4" rx="2" />
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                      </svg>
                    </span>
                    <input
                      id={emailId}
                      type="email"
                      className={`field-input${error ? " field-error" : ""}`}
                      placeholder="dokter@klinik.com"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(""); }}
                      onFocus={() => setFocusedField("email")}
                      onBlur={() => setFocusedField(null)}
                      autoComplete="email"
                      required
                      aria-required="true"
                      aria-label="Email dokter"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label htmlFor={passwordId} className="field-label">
                    Password
                  </label>
                  <div className="field-wrap">
                    <span className="field-icon" aria-hidden="true">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </span>
                    <input
                      id={passwordId}
                      type={showPassword ? "text" : "password"}
                      className={`field-input${error ? " field-error" : ""}`}
                      placeholder="Masukkan password Anda"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(""); }}
                      onFocus={() => setFocusedField("password")}
                      onBlur={() => setFocusedField(null)}
                      autoComplete="current-password"
                      required
                      aria-required="true"
                      aria-label="Password"
                      style={{ paddingRight: "44px" }}
                    />
                    <button
                      type="button"
                      className="pwd-toggle"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                    >
                      {showPassword ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Remember + Forgot */}
              <div className="form-row">
                <label className="remember-wrap" htmlFor={rememberId}>
                  <input
                    id={rememberId}
                    type="checkbox"
                    className="remember-cb"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span className="remember-label">Ingat saya</span>
                </label>
                <a href="#" className="forgot-link">Lupa password?</a>
              </div>

              {/* Submit */}
              <button
                id="login-submit-btn"
                type="submit"
                className="submit-btn"
                disabled={isLoading}
                aria-busy={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="btn-spinner" aria-hidden="true" />
                    Memproses…
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                      <polyline points="10 17 15 12 10 7" />
                      <line x1="15" y1="12" x2="3" y2="12" />
                    </svg>
                    Masuk ke Dashboard
                  </>
                )}
              </button>
            </form>


          </div>
        </section>
      </div>
    </>
  );
}
