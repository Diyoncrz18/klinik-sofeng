"use client";

import type { ScheduleRecommendation } from "./types";

const SCHEDULE_SELECTED_EVENT = "patient:schedule-selected";

type ScheduleSelectedDetail = {
  visitDate: string;
  visitTime: string;
};

type ScheduleRecommendationsProps = {
  recommendations: ScheduleRecommendation[];
};

export function ScheduleRecommendations({
  recommendations,
}: ScheduleRecommendationsProps) {
  function selectSchedule(slot: ScheduleRecommendation) {
    const detail: ScheduleSelectedDetail = {
      visitDate: slot.visitDate,
      visitTime: slot.visitTime,
    };

    window.dispatchEvent(
      new CustomEvent<ScheduleSelectedDetail>(SCHEDULE_SELECTED_EVENT, {
        detail,
      })
    );

    document
      .getElementById("patient-booking-form")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (recommendations.length === 0) {
    return (
      <aside className="recommendation-card">
        <header>
          <h2>Rekomendasi Jadwal</h2>
        </header>
        <p className="recommendation-time">Belum ada jadwal tersedia.</p>
      </aside>
    );
  }

  return (
    <aside className="recommendation-card">
      <header>
        <h2>Rekomendasi Jadwal</h2>
      </header>

      <ol className="recommendation-list">
        {recommendations.map((slot) => (
          <li key={`${slot.day}-${slot.time}`} className="recommendation-item">
            <div>
              <h3>{slot.day}</h3>
              <p className="recommendation-time">{slot.time}</p>
            </div>
            <button
              type="button"
              className="slot-button"
              onClick={() => selectSchedule(slot)}
            >
              Pilih Jadwal Ini
            </button>
          </li>
        ))}
      </ol>
    </aside>
  );
}