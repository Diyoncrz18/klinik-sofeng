"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import {
  checkInAppointment,
  type CheckInAppointmentResponse,
} from "@/lib/appointments";
import {
  appointmentTitle,
  dokterFullName,
  dokterSpesialisasi,
  shortAppointmentId,
} from "@/lib/appointment-display";
import {
  formatJamRange,
  formatStatusLabel,
  formatTanggalIndo,
} from "@/lib/format";

type CheckInState =
  | { status: "loading"; data?: undefined; error?: undefined }
  | { status: "success"; data: CheckInAppointmentResponse; error?: undefined }
  | { status: "error"; data?: undefined; error: string };

export default function CheckInAppointmentPage() {
  const params = useParams<{ id: string }>();
  const rawId = params?.id;
  const appointmentId = Array.isArray(rawId) ? rawId[0] : rawId;
  const [state, setState] = useState<CheckInState>({ status: "loading" });

  const submitCheckIn = useCallback(async (showLoading = true) => {
    if (!appointmentId) {
      setState({ status: "error", error: "ID appointment tidak valid." });
      return;
    }

    if (showLoading) setState({ status: "loading" });
    try {
      const data = await checkInAppointment(appointmentId);
      setState({ status: "success", data });
    } catch (err) {
      setState({
        status: "error",
        error:
          err instanceof Error
            ? err.message
            : "Gagal mengonfirmasi kedatangan.",
      });
    }
  }, [appointmentId]);

  useEffect(() => {
    let alive = true;

    async function runInitialCheckIn() {
      await Promise.resolve();
      if (!appointmentId) {
        setState({ status: "error", error: "ID appointment tidak valid." });
        return;
      }

      try {
        const data = await checkInAppointment(appointmentId);
        if (alive) setState({ status: "success", data });
      } catch (err) {
        if (!alive) return;
        setState({
          status: "error",
          error:
            err instanceof Error
              ? err.message
              : "Gagal mengonfirmasi kedatangan.",
        });
      }
    }

    void runInitialCheckIn();

    return () => {
      alive = false;
    };
  }, [appointmentId]);

  const appointment = state.status === "success" ? state.data.appointment : null;
  const title = useMemo(() => {
    if (state.status === "loading") return "Memproses Scan";
    if (state.status === "error") return "Scan Gagal";
    return state.data.confirmed ? "Kedatangan Terkonfirmasi" : "Sudah Terkonfirmasi";
  }, [state]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f7f9fb",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: 440,
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 18,
          boxShadow: "0 20px 44px rgba(15,23,42,0.12)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            background:
              state.status === "error"
                ? "linear-gradient(135deg, #991b1b, #ef4444)"
                : "linear-gradient(135deg, #1d4e73, #2A6B9B)",
            color: "#fff",
            padding: "24px 22px",
          }}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              opacity: 0.8,
              marginBottom: 8,
            }}
          >
            Resepsionis Check-in
          </p>
          <h1 style={{ fontSize: 24, lineHeight: 1.15, fontWeight: 900 }}>
            {title}
          </h1>
        </div>

        <div style={{ padding: 22 }}>
          {state.status === "loading" && (
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ height: 14, width: "70%", background: "#e5e7eb", borderRadius: 999 }} />
              <div style={{ height: 48, background: "#f1f5f9", borderRadius: 12 }} />
              <div style={{ height: 48, background: "#f1f5f9", borderRadius: 12 }} />
            </div>
          )}

          {state.status === "error" && (
            <div>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: "#7f1d1d", fontWeight: 650 }}>
                {state.error}
              </p>
              <button
                onClick={() => void submitCheckIn()}
                style={{
                  marginTop: 18,
                  width: "100%",
                  padding: "12px 16px",
                  border: "none",
                  borderRadius: 12,
                  background: "#991b1b",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                Coba Lagi
              </button>
            </div>
          )}

          {appointment && state.status === "success" && (
            <div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                  marginBottom: 18,
                }}
              >
                <InfoBox label="Nomor Antrian" value={String(state.data.queue.nomor)} strong />
                <InfoBox label="Status" value={formatStatusLabel(appointment.status)} />
                <InfoBox label="Tanggal" value={formatTanggalIndo(appointment.tanggal)} />
                <InfoBox label="Waktu" value={formatJamRange(appointment.jam)} />
              </div>

              <div
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e5e7eb",
                  borderRadius: 14,
                  padding: 14,
                  marginBottom: 18,
                }}
              >
                <p style={{ fontSize: 11, color: "#64748b", fontWeight: 800, marginBottom: 6 }}>
                  {shortAppointmentId(appointment.id)}
                </p>
                <h2 style={{ fontSize: 16, color: "#111827", fontWeight: 900, marginBottom: 4 }}>
                  {appointmentTitle(appointment)}
                </h2>
                <p style={{ fontSize: 13, color: "#475569", fontWeight: 650 }}>
                  {dokterFullName(appointment)} - {dokterSpesialisasi(appointment)}
                </p>
              </div>

              <p style={{ fontSize: 12, color: "#64748b", lineHeight: 1.65 }}>
                Jadwal pasien sekarang sudah terkonfirmasi di sistem. Pasien dapat
                membuka halaman Jadwal Saya untuk melihat status terbaru.
              </p>
            </div>
          )}

          <Link
            href="/"
            style={{
              display: "block",
              marginTop: 18,
              textAlign: "center",
              color: "#2A6B9B",
              fontSize: 12,
              fontWeight: 800,
              textDecoration: "none",
            }}
          >
            Kembali ke Beranda
          </Link>
        </div>
      </section>
    </main>
  );
}

function InfoBox({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: "11px 12px",
      }}
    >
      <p style={{ fontSize: 10, color: "#94a3b8", fontWeight: 800, textTransform: "uppercase" }}>
        {label}
      </p>
      <p
        style={{
          fontSize: strong ? 24 : 13,
          color: strong ? "#059669" : "#111827",
          fontWeight: 900,
          marginTop: 3,
          lineHeight: 1.1,
        }}
      >
        {value}
      </p>
    </div>
  );
}
