"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * TabHome — Halaman Dashboard Pasien (URL-based)
 * ────────────────────────────────────────────
 * Layout premium mobile app dengan:
 * - Header sticky glassmorphism + greeting dinamis
 * - Hero card jadwal terdekat dengan gradient rich
 * - Grid layanan cepat berwarna
 * - Banner promo elegan
 * - Statistik kesehatan ringkas
 * - Kunjungan terakhir dengan timeline
 *
 * Navigasi memakai URL routing (Next.js router) lewat helper di
 * `pasienRouting.ts`, bukan lagi state local di PasienShell.
 */

import { PASIEN_PATHS } from "./pasienRouting";

// Fungsi greeting berdasarkan waktu
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 11) return "Selamat Pagi";
  if (hour < 15) return "Selamat Siang";
  if (hour < 18) return "Selamat Sore";
  return "Selamat Malam";
}

export default function TabHome() {
  const router = useRouter();
  const [greeting] = useState(getGreeting);

  return (
    <div style={{ paddingBottom: 8 }}>

      {/* ═══════════════════════════════════════════
          HEADER — Fixed sticky glassmorphism
          ══════════════════════════════════════════ */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          padding: "14px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "rgba(247,249,251,0.96)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(115,199,227,0.15)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          marginLeft: -18,
          marginRight: -18,
          paddingLeft: 18,
          paddingRight: 18,
        }}
      >
        {/* Left: Avatar + Greeting */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => router.push(PASIEN_PATHS.profil)}
            aria-label="Buka profil Ahmad Surya"
            style={{ position: "relative", cursor: "pointer", background: "none", border: "none", padding: 0, flexShrink: 0 }}
          >
            {/* Avatar with gradient ring */}
            <div style={{
              width: 44, height: 44, borderRadius: "50%",
              background: "linear-gradient(135deg, #2A6B9B 0%, #1a3f5c 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 0 2.5px white, 0 0 0 4px rgba(42,107,155,0.25)",
            }}>
              <span style={{ color: "#fff", fontSize: 14, fontWeight: 900, letterSpacing: 0.5 }}>AS</span>
            </div>
            {/* Online indicator */}
            <span style={{
              position: "absolute", bottom: 1, right: 1,
              width: 11, height: 11, borderRadius: "50%",
              background: "#22c55e", border: "2px solid white",
              display: "block",
            }} aria-hidden="true" />
          </button>

          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 1 }}>
              {greeting} 👋
            </p>
            <h1 style={{ fontSize: 16, fontWeight: 800, color: "#111827", lineHeight: 1, letterSpacing: "-0.01em" }}>
              Ahmad Surya
            </h1>
          </div>
        </div>

        {/* Right: Notification bell */}
        <button
          id="btn-notifikasi"
          onClick={() => router.push(PASIEN_PATHS.notifikasi)}
          aria-label="Notifikasi (1 baru)"
          style={{
            position: "relative",
            width: 40, height: 40, borderRadius: 12,
            background: "#f9fafb", border: "1px solid #e5e7eb",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#374151"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M10.268 21a2 2 0 0 0 3.464 0" />
            <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
          </svg>
          {/* Badge */}
          <span style={{
            position: "absolute", top: 6, right: 7,
            width: 7, height: 7, borderRadius: "50%",
            background: "#ef4444", border: "1.5px solid white",
          }} aria-hidden="true" />
        </button>
      </header>

      {/* ═══════════════════════════════════════════
          CONTENT AREA
          ══════════════════════════════════════════ */}
      <div style={{ display: "flex", flexDirection: "column", gap: 20, padding: "4px 0 0" }}>

        {/* ── Search Bar ──────────────────────────────── */}
        <div style={{ position: "relative" }}>
          <span style={{
            position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
            display: "flex", alignItems: "center", pointerEvents: "none",
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </span>
          <input
            id="pasien-search"
            type="search"
            placeholder="Cari layanan atau keluhan..."
            aria-label="Cari layanan atau keluhan"
            style={{
              width: "100%", height: 46,
              paddingLeft: 42, paddingRight: 16,
              background: "#fff",
              border: "1.5px solid #e5e7eb",
              borderRadius: 14,
              fontSize: 14, color: "#374151",
              outline: "none",
              fontFamily: "inherit",
              transition: "border-color 0.2s ease, box-shadow 0.2s ease",
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#2A6B9B";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(42,107,155,0.12)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "#e5e7eb";
              e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)";
            }}
          />
        </div>

        {/* ── Hero Card — Jadwal Terdekat ─────────────── */}
        <div style={{
          borderRadius: 20,
          overflow: "hidden",
          position: "relative",
          boxShadow: "0 12px 32px rgba(29,78,115,0.28)",
        }}>
          {/* Background gradient */}
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(145deg, #0f3a5c 0%, #1d5a8a 45%, #2A6B9B 100%)",
          }} />
          {/* Decorative circles */}
          <div style={{
            position: "absolute", top: -40, right: -30,
            width: 160, height: 160, borderRadius: "50%",
            background: "rgba(255,255,255,0.07)",
          }} aria-hidden="true" />
          <div style={{
            position: "absolute", bottom: -30, left: -20,
            width: 120, height: 120, borderRadius: "50%",
            background: "rgba(115,199,227,0.12)",
          }} aria-hidden="true" />
          <div style={{
            position: "absolute", top: "50%", right: 16,
            width: 80, height: 80, borderRadius: "50%",
            background: "rgba(255,255,255,0.05)",
          }} aria-hidden="true" />

          {/* Card content */}
          <div style={{ position: "relative", zIndex: 1, padding: "20px 20px 18px" }}>
            {/* Top Row */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
              {/* Badge */}
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 999, padding: "5px 10px",
                backdropFilter: "blur(8px)",
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: "50%", background: "#4ade80",
                  boxShadow: "0 0 6px rgba(74,222,128,0.8)",
                  display: "inline-block",
                }} aria-hidden="true" />
                <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", letterSpacing: "0.08em" }}>
                  JADWAL TERDEKAT
                </span>
              </div>

              {/* Mini Calendar Widget */}
              <div style={{
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.18)",
                borderRadius: 14, padding: "8px 12px",
                textAlign: "center", minWidth: 52,
                backdropFilter: "blur(8px)",
              }}>
                <p style={{ fontSize: 9, fontWeight: 800, color: "rgba(186,230,253,0.8)", textTransform: "uppercase", letterSpacing: "0.1em" }}>JUN</p>
                <p style={{ fontSize: 24, fontWeight: 900, color: "#fff", lineHeight: 1, marginTop: 1 }}>14</p>
              </div>
            </div>

            {/* Title */}
            <h2 style={{ fontSize: 19, fontWeight: 800, color: "#fff", marginBottom: 4, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
              Kontrol Kawat Gigi
            </h2>

            {/* Doctor */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
              <div style={{
                width: 20, height: 20, borderRadius: "50%",
                background: "rgba(255,255,255,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white"
                  strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M20 21a8 8 0 1 0-16 0" />
                </svg>
              </div>
              <span style={{ fontSize: 12, color: "rgba(186,230,253,0.85)", fontWeight: 500 }}>
                Dr. Rina Santoso, Sp.KG
              </span>
            </div>

            {/* Time + Location Row */}
            <div style={{
              background: "rgba(0,0,0,0.18)",
              borderRadius: 14, padding: "10px 14px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {/* Clock icon */}
                <div style={{
                  width: 34, height: 34, borderRadius: 10,
                  background: "rgba(255,255,255,0.12)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white"
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                </div>
                <div>
                  <p style={{ fontSize: 10, color: "rgba(186,230,253,0.65)", fontWeight: 500, marginBottom: 1 }}>
                    Waktu Kunjungan
                  </p>
                  <p style={{ fontSize: 13, color: "#fff", fontWeight: 700, letterSpacing: "0.02em" }}>
                    09:00 – 09:30 WIB
                  </p>
                </div>
              </div>

              {/* Lihat Tiket button */}
              <button
                aria-label="Lihat tiket appointment"
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  background: "#fff",
                  borderRadius: 10, padding: "7px 12px",
                  border: "none", cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1d4e73"
                  strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
                </svg>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#1d4e73", whiteSpace: "nowrap" }}>Tiket</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Layanan Cepat ──────────────────────────── */}
        <section>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
            Layanan Cepat
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            {QUICK_ACTIONS.map((action, i) => (
              <button
                key={i}
                id={`btn-layanan-${action.id}`}
                aria-label={action.ariaLabel}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                  background: "none", border: "none", cursor: "pointer", padding: 0,
                  transition: "transform 0.15s ease",
                }}
                onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.93)")}
                onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                onTouchStart={(e) => (e.currentTarget.style.transform = "scale(0.93)")}
                onTouchEnd={(e) => (e.currentTarget.style.transform = "scale(1)")}
                onClick={() => {
                  if (action.id === "buat-janji") router.push(PASIEN_PATHS.buatJanji);
                  else if (action.id === "konsultasi") router.push(PASIEN_PATHS.konsultasi);
                  else if (action.id === "riwayat") router.push(PASIEN_PATHS.riwayat);
                  else if (action.id === "lokasi") router.push(PASIEN_PATHS.lokasi);
                }}
              >
                {/* Icon box */}
                <div style={{
                  width: 58, height: 58,
                  borderRadius: 18,
                  background: action.bg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  position: "relative",
                  boxShadow: `0 4px 14px ${action.shadowColor}`,
                }}>
                  {action.icon}
                  {action.badge && (
                    <span style={{
                      position: "absolute", top: -4, right: -4,
                      width: 18, height: 18, borderRadius: "50%",
                      background: action.badgeBg ?? "#2A6B9B",
                      color: "#fff", fontSize: 10, fontWeight: 800,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      border: "2px solid white",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
                    }}>
                      {action.badge}
                    </span>
                  )}
                </div>
                {/* Label */}
                <p style={{
                  fontSize: 11, fontWeight: 600, textAlign: "center",
                  color: "#374151", lineHeight: 1.3,
                }}>
                  {action.label}
                </p>
              </button>
            ))}
          </div>
        </section>

        {/* ── Stats Bar ──────────────────────────────── */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
          gap: 10,
        }}>
          {[
            { value: "8", label: "Kunjungan", color: "#2A6B9B", bg: "#eff6ff", border: "#bfdbfe" },
            { value: "1", label: "Jadwal Aktif", color: "#059669", bg: "#ecfdf5", border: "#a7f3d0" },
            { value: "0", label: "Tagihan", color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
          ].map((stat, i) => (
            <div key={i} style={{
              background: stat.bg,
              border: `1px solid ${stat.border}`,
              borderRadius: 14, padding: "12px 10px", textAlign: "center",
            }}>
              <p style={{ fontSize: 22, fontWeight: 900, color: stat.color, lineHeight: 1, marginBottom: 4 }}>
                {stat.value}
              </p>
              <p style={{ fontSize: 10, fontWeight: 600, color: "#6b7280", lineHeight: 1.2 }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* ── Promo Banner ───────────────────────────── */}
        <div style={{
          borderRadius: 18, overflow: "hidden", position: "relative",
          background: "linear-gradient(135deg, #312e81 0%, #4f46e5 100%)",
          boxShadow: "0 8px 24px rgba(79,70,229,0.25)",
        }}>
          {/* Decorative circle */}
          <div style={{
            position: "absolute", top: -24, right: -12,
            width: 100, height: 100, borderRadius: "50%",
            background: "rgba(255,255,255,0.08)",
          }} aria-hidden="true" />
          <div style={{
            position: "absolute", bottom: -20, left: 90,
            width: 80, height: 80, borderRadius: "50%",
            background: "rgba(255,255,255,0.05)",
          }} aria-hidden="true" />

          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", position: "relative", zIndex: 1 }}>
            {/* Icon */}
            <div style={{
              width: 46, height: 46, borderRadius: 14,
              background: "rgba(255,255,255,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </div>

            {/* Text */}
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                <span style={{
                  fontSize: 9, fontWeight: 800, color: "#fde68a",
                  background: "rgba(251,191,36,0.2)", borderRadius: 4,
                  padding: "2px 6px", letterSpacing: "0.08em",
                }}>
                  PROMO SPESIAL
                </span>
              </div>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: "#fff", marginBottom: 2, letterSpacing: "-0.01em" }}>
                Scaling Gigi — Diskon 20%
              </h3>
              <p style={{ fontSize: 11, color: "rgba(199,210,254,0.85)" }}>
                Pesan lewat aplikasi, hemat lebih banyak!
              </p>
            </div>

            {/* CTA */}
            <button style={{
              background: "#fff", borderRadius: 10, padding: "8px 12px",
              border: "none", cursor: "pointer", flexShrink: 0,
            }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#4f46e5", whiteSpace: "nowrap" }}>
                Klaim →
              </span>
            </button>
          </div>
        </div>

        {/* ── Kunjungan Terakhir ─────────────────────── */}
        <section>
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginBottom: 12,
          }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Kunjungan Terakhir
            </h3>
            <button
              onClick={() => router.push(PASIEN_PATHS.riwayat)}
              style={{
                fontSize: 12, fontWeight: 700, color: "#2A6B9B",
                background: "none", border: "none", cursor: "pointer", padding: 0,
              }}
            >
              Lihat Semua →
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {RECENT_VISITS.map((visit, i) => (
              <button
                key={i}
                style={{
                  display: "flex", alignItems: "center", gap: 14,
                  background: "#fff",
                  border: "1px solid rgba(115,199,227,0.15)",
                  borderRadius: 16, padding: "14px 16px",
                  cursor: "pointer", width: "100%", textAlign: "left",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                  transition: "box-shadow 0.2s ease",
                  fontFamily: "inherit",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)")}
                onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.04)")}
              >
                {/* Icon */}
                <div style={{
                  width: 42, height: 42, borderRadius: 14,
                  background: visit.iconBg, color: visit.iconColor, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {visit.icon}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: 13, fontWeight: 700, color: "#1f2937",
                    marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {visit.title}
                  </p>
                  <p style={{ fontSize: 11, color: "#9ca3af", fontWeight: 500 }}>
                    {visit.date} · {visit.doctor}
                  </p>
                </div>

                {/* Amount + status */}
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 4 }}>
                    {visit.amount}
                  </p>
                  <span style={{
                    fontSize: 9, fontWeight: 700,
                    color: visit.payColor, background: visit.payBg,
                    padding: "2px 7px", borderRadius: 20,
                  }}>
                    {visit.payLabel}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// DATA CONSTANTS
// ════════════════════════════════════════════════════════════

const QUICK_ACTIONS = [
  {
    id: "buat-janji",
    ariaLabel: "Buat janji temu",
    bg: "linear-gradient(135deg, #1d4e73 0%, #2A6B9B 100%)",
    shadowColor: "rgba(42,107,155,0.3)",
    badge: "+",
    badgeBg: "#22c55e",
    label: "Buat\nJanji",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M8 2v4" /><path d="M16 2v4" />
        <rect width="18" height="18" x="3" y="4" rx="2" />
        <path d="M3 10h18" /><path d="M12 14v4" /><path d="M10 16h4" />
      </svg>
    ),
  },
  {
    id: "konsultasi",
    ariaLabel: "Konsultasi online",
    bg: "linear-gradient(135deg, #064e3b, #059669)",
    shadowColor: "rgba(5,150,105,0.25)",
    label: "Konsultasi\nOnline",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <path d="M8 10h8" /><path d="M8 14h5" />
      </svg>
    ),
  },
  {
    id: "riwayat",
    ariaLabel: "Riwayat penyakit",
    bg: "linear-gradient(135deg, #4c1d95, #6d28d9)",
    shadowColor: "rgba(109,40,217,0.25)",
    label: "Riwayat\nPenyakit",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 3v16a2 2 0 0 0 2 2h16" />
        <path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" />
      </svg>
    ),
  },
  {
    id: "lokasi",
    ariaLabel: "Lokasi klinik",
    bg: "linear-gradient(135deg, #78350f, #d97706)",
    shadowColor: "rgba(217,119,6,0.25)",
    label: "Lokasi\nKlinik",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
];

const RECENT_VISITS = [
  {
    title: "Pembersihan Karang Gigi",
    date: "22 Mei 2026",
    doctor: "Dr. Rina",
    amount: "Rp 450.000",
    payLabel: "Lunas",
    payColor: "#059669",
    payBg: "#dcfce7",
    iconBg: "#ecfdf5",
    iconColor: "#059669",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
      </svg>
    ),
  },
  {
    title: "Pemasangan Kawat Gigi",
    date: "10 Apr 2026",
    doctor: "Dr. Rina",
    amount: "Rp 8.500.000",
    payLabel: "Cicilan",
    payColor: "#d97706",
    payBg: "#fef3c7",
    iconBg: "#eff6ff",
    iconColor: "#2A6B9B",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="18" cy="18" r="3" /><circle cx="6" cy="6" r="3" />
        <path d="M13 6h3a2 2 0 0 1 2 2v7" /><path d="m11 18-5-5 5-5" />
      </svg>
    ),
  },
];
