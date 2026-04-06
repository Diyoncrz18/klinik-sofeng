import { PatientBookingForm } from "./components/patient/PatientBookingForm";
import { PatientHero } from "./components/patient/PatientHero";
import { ScheduleRecommendations } from "./components/patient/ScheduleRecommendations";
import type { ScheduleRecommendation } from "./components/patient/types";
import {
  scheduleRecommendations,
  serviceOptions,
} from "./components/patient/patient-data";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export const dynamic = "force-dynamic";

type ScheduleApiItem = {
  scheduleDate: string;
  startTime: string;
  endTime: string;
};

type SchedulesApiResponse = {
  schedules?: ScheduleApiItem[];
};

function normalizeTimeLabel(value: string): string {
  const [hour = "00", minute = "00"] = String(value).split(":");
  return `${hour}.${minute}`;
}

function normalizeTimeInputValue(value: string): string {
  const [hour = "00", minute = "00"] = String(value).split(":");
  return `${hour}:${minute}`;
}

function normalizeDateInputValue(value: string): string {
  return String(value).split("T")[0] || String(value);
}

function formatDateLabel(value: string): string {
  const [year, month, day] = String(value)
    .split("-")
    .map((part) => Number(part));

  if (!year || !month || !day) {
    return String(value);
  }

  const date = new Date(Date.UTC(year, month - 1, day));
  const formatted = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);

  return `${formatted.charAt(0).toUpperCase()}${formatted.slice(1)}`;
}

function mapScheduleToRecommendation(
  schedule: ScheduleApiItem
): ScheduleRecommendation {
  return {
    day: formatDateLabel(schedule.scheduleDate),
    time: `${normalizeTimeLabel(schedule.startTime)} - ${normalizeTimeLabel(
      schedule.endTime
    )}`,
    visitDate: normalizeDateInputValue(schedule.scheduleDate),
    visitTime: normalizeTimeInputValue(schedule.startTime),
  };
}

async function getScheduleRecommendations(): Promise<ScheduleRecommendation[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/schedules?limit=3`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Gagal memuat jadwal. Status: ${response.status}`);
    }

    const responseBody = (await response.json()) as SchedulesApiResponse | null;

    if (!Array.isArray(responseBody?.schedules)) {
      throw new Error("Format response jadwal tidak valid.");
    }

    return responseBody.schedules.map(mapScheduleToRecommendation);
  } catch (error) {
    console.error("Fallback ke data lokal jadwal:", error);
    return scheduleRecommendations;
  }
}

export default async function Home() {
  const recommendations = await getScheduleRecommendations();

  return (
    <>
      <header className="site-header">
        <div className="site-header-inner">
          <p className="site-brand">Klinik Sofeng</p>
        </div>
      </header>

      <main className="patient-shell">
        <PatientHero />

        <section
          className="patient-workspace"
          aria-label="Area booking dan rekomendasi jadwal"
        >
          <PatientBookingForm serviceOptions={serviceOptions} />
          <ScheduleRecommendations recommendations={recommendations} />
        </section>
      </main>

      <footer className="site-footer">
        <div className="site-footer-inner">
          <p>Klinik Sofeng</p>
          <p>Jln. Arnold Mononutu Airmadidi Bawah</p>
          <p>WhatsApp: 0895323941730</p>
        </div>
      </footer>
    </>
  );
}
