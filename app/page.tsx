import Link from "next/link";

import { PASIEN_PATHS } from "@/app/components/pasien/pasienRouting";

export const metadata = {
  title: "Klinik Gigi — Pilih Akses",
  description: "Pintu masuk pasien dan dokter Klinik Gigi Professional Dental.",
};

export default function HomeRoleSelector() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #fff9f0 0%, #f1f9fd 60%, #e6f3fa 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 20px",
        fontFamily: "var(--font-inter), system-ui, -apple-system, sans-serif",
      }}
    >
      {/* ── Brand ─────────────────────────────────────── */}
      <header style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 36, textAlign: "center" }}>
        <div
          style={{
            width: 84,
            height: 84,
            borderRadius: 26,
            background: "linear-gradient(180deg, #ffffff 0%, #DFF1F8 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid rgba(108,189,233,0.34)",
            boxShadow: "0 18px 36px rgba(115,199,227,0.22), inset 0 1px 0 rgba(255,255,255,0.95)",
            marginBottom: 20,
          }}
          aria-hidden="true"
        >
          <svg viewBox="0 0 64 64" width="48" height="48" fill="none">
            <defs>
              <linearGradient id="rootBrandFill" x1="18" y1="12" x2="48" y2="54" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#FFFFFF" />
                <stop offset="1" stopColor="#DFF1F8" />
              </linearGradient>
            </defs>
            <path
              d="M23.5 10.5C16.02 10.5 11 16.25 11 23.85c0 7.6 2.68 16.36 5.85 23.03 1.32 2.8 3.3 5.12 5.94 5.12 2.67 0 4.38-2.33 5.39-5.48l2.18-6.83c.25-.8.99-1.35 1.84-1.35.85 0 1.59.55 1.84 1.35l2.18 6.83c1.01 3.15 2.72 5.48 5.39 5.48 2.64 0 4.62-2.32 5.94-5.12C50.32 40.21 53 31.45 53 23.85c0-7.6-5.02-13.35-12.5-13.35-2.98 0-5.66.97-8.5 2.7-2.84-1.73-5.52-2.7-8.5-2.7Z"
              fill="url(#rootBrandFill)"
              stroke="#2A6B9B"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <path d="M32 19.5v9.5" stroke="#2A6B9B" strokeWidth="2.8" strokeLinecap="round" />
            <path d="M27.25 24.25h9.5" stroke="#2A6B9B" strokeWidth="2.8" strokeLinecap="round" />
          </svg>
        </div>
        <span
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "0.18em",
            color: "#5f8fa5",
            textTransform: "uppercase",
            marginBottom: 6,
          }}
        >
          Professional Dental
        </span>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 900,
            color: "#0f3a5c",
            letterSpacing: "-0.02em",
            marginBottom: 8,
            lineHeight: 1.15,
          }}
        >
          Klinik Gigi
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "#5d7280",
            lineHeight: 1.55,
            maxWidth: 340,
            fontWeight: 500,
          }}
        >
          Pilih jalur masuk sesuai peran Anda untuk memulai sesi.
        </p>
      </header>

      {/* ── Role cards ────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 16,
          width: "100%",
          maxWidth: 720,
        }}
      >
        <RoleCard
          href={PASIEN_PATHS.welcome}
          tone="patient"
          title="Saya Pasien"
          description="Buat janji, lihat jadwal, riwayat, dan resep dari smartphone."
          highlights={["📅 Buat janji 24 jam", "💬 Konsultasi online", "📋 Rekam medis pribadi"]}
          ctaLabel="Masuk sebagai Pasien"
          icon={
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="8" r="4" />
              <path d="M20 21a8 8 0 1 0-16 0" />
            </svg>
          }
        />

        <RoleCard
          href="/login"
          tone="doctor"
          title="Saya Dokter"
          description="Kelola appointment, triage darurat, EHR, dan analitik klinik."
          highlights={["🩺 Dashboard klinis", "🚨 Panel darurat real-time", "📊 Analitik & laporan"]}
          ctaLabel="Masuk sebagai Dokter"
          icon={
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M11 2v2" />
              <path d="M5 2v2" />
              <path d="M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1" />
              <path d="M8 15a6 6 0 0 0 12 0v-3" />
              <circle cx="20" cy="10" r="2" />
            </svg>
          }
        />
      </div>

      {/* ── Tagline / footer ────────────────────────────── */}
      <footer style={{ marginTop: 40, textAlign: "center" }}>
        <p style={{ fontSize: 11, color: "#9aa9b3", fontWeight: 500 }}>
          © 2026 Klinik Gigi Professional Dental — Smart Scheduling & Triage Darurat.
        </p>
      </footer>
    </main>
  );
}

// ── Role Card ─────────────────────────────────────────────────────────────────

function RoleCard({
  href,
  tone,
  title,
  description,
  highlights,
  ctaLabel,
  icon,
}: {
  href: string;
  tone: "patient" | "doctor";
  title: string;
  description: string;
  highlights: string[];
  ctaLabel: string;
  icon: React.ReactNode;
}) {
  const palettes = {
    patient: {
      iconBg: "linear-gradient(135deg, #1d4e73, #2A6B9B 60%, #3b9bd4)",
      iconShadow: "rgba(42,107,155,0.32)",
      ctaBg: "linear-gradient(135deg, #1d4e73, #2A6B9B)",
      ctaShadow: "rgba(42,107,155,0.35)",
      accent: "#2A6B9B",
    },
    doctor: {
      iconBg: "linear-gradient(135deg, #064e3b, #047857 60%, #10b981)",
      iconShadow: "rgba(4,120,87,0.32)",
      ctaBg: "linear-gradient(135deg, #064e3b, #047857)",
      ctaShadow: "rgba(4,120,87,0.35)",
      accent: "#047857",
    },
  } as const;

  const p = palettes[tone];

  return (
    <Link
      href={href}
      prefetch
      style={{
        background: "#fff",
        border: "1px solid rgba(115,199,227,0.18)",
        borderRadius: 24,
        padding: "24px 22px 22px",
        boxShadow: "0 18px 40px rgba(15,58,92,0.10)",
        textDecoration: "none",
        color: "inherit",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        transition: "transform 0.18s ease, box-shadow 0.18s ease",
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 20,
          background: p.iconBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `0 12px 28px ${p.iconShadow}`,
        }}
        aria-hidden="true"
      >
        {icon}
      </div>

      {/* Title + desc */}
      <div>
        <h2 style={{ fontSize: 19, fontWeight: 900, color: "#0f3a5c", letterSpacing: "-0.01em", marginBottom: 6 }}>
          {title}
        </h2>
        <p style={{ fontSize: 13, color: "#5d7280", lineHeight: 1.55, fontWeight: 500 }}>{description}</p>
      </div>

      {/* Highlights */}
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
        {highlights.map((item) => (
          <li key={item} style={{ fontSize: 12, color: "#374151", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: p.accent }} aria-hidden="true">
              ◆
            </span>
            {item}
          </li>
        ))}
      </ul>

      {/* CTA */}
      <span
        style={{
          marginTop: 4,
          background: p.ctaBg,
          color: "#fff",
          fontSize: 13,
          fontWeight: 800,
          padding: "12px 18px",
          borderRadius: 12,
          textAlign: "center",
          boxShadow: `0 8px 20px ${p.ctaShadow}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
        }}
      >
        {ctaLabel}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 12h14" />
          <path d="m12 5 7 7-7 7" />
        </svg>
      </span>
    </Link>
  );
}
