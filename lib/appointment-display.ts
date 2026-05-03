/**
 * appointment-display.ts — Helper presentational untuk Appointment.
 * Dipakai bersama oleh TabHome, TabJadwal, dan komponen lain.
 */

import type { Appointment } from "./types";

export function appointmentTitle(appt: Appointment): string {
  switch (appt.jenis) {
    case "konsultasi":
      return "Konsultasi Dokter";
    case "pemeriksaan":
      return "Pemeriksaan Rutin";
    case "kontrol":
      return "Kontrol Lanjutan";
    case "tindakan":
      return "Tindakan Gigi";
    case "darurat":
      return "Pemeriksaan Darurat";
    default:
      return "Janji Temu";
  }
}

export function dokterFullName(appt: Appointment): string {
  return appt.dokter?.profile.full_name ?? "Dokter";
}

export function dokterSpesialisasi(appt: Appointment): string {
  return appt.dokter?.spesialisasi ?? "Dokter Gigi";
}

/** Short, user-friendly version of UUID untuk tampilan "ID: ABC123" di card. */
export function shortAppointmentId(id: string): string {
  return id.slice(0, 8).toUpperCase();
}
