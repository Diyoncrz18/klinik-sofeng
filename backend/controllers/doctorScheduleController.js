const {
  isSupabaseConfigured,
  SUPABASE_DOCTOR_SCHEDULES_TABLE,
  syncRollingDoctorSchedules,
} = require("../services/doctorScheduleService");

const REQUIRED_SUPABASE_ENV = [
  "SUPABASE_URL atau NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SECRET_KEY atau SUPABASE_SERVICE_ROLE_KEY",
];

function getTableNotReadyResponse(error) {
  return {
    error: `Tabel Supabase \"${SUPABASE_DOCTOR_SCHEDULES_TABLE}\" belum tersedia.`,
    detail: error?.message || "Schema cache belum menemukan tabel tujuan.",
    table: SUPABASE_DOCTOR_SCHEDULES_TABLE,
    nextStep:
      "Buat tabel dengan SQL di backend/sql/doctor_schedules.sql lalu coba lagi.",
  };
}

function mapDoctorSchedule(payload = {}) {
  return {
    id: payload.id,
    scheduleDate: payload.schedule_date,
    startTime: payload.start_time,
    endTime: payload.end_time,
  };
}

async function getDoctorSchedules(req, res) {
  if (!isSupabaseConfigured) {
    return res.status(500).json({
      error: "Supabase belum terkonfigurasi.",
      requiredEnv: REQUIRED_SUPABASE_ENV,
    });
  }

  const requestedLimit = Number(req.query.limit || 3);
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(requestedLimit, 1), 100)
    : 3;

  const { data, error, updated } = await syncRollingDoctorSchedules(limit);

  if (error) {
    console.error("Supabase select schedule error:", error);

    if (error.code === "PGRST205") {
      return res.status(500).json(getTableNotReadyResponse(error));
    }

    return res.status(500).json({
      error: "Gagal mengambil data jadwal dari Supabase.",
      detail: error.message,
    });
  }

  return res.status(200).json({
    table: SUPABASE_DOCTOR_SCHEDULES_TABLE,
    total: data.length,
    updated,
    schedules: data.map(mapDoctorSchedule),
  });
}

module.exports = {
  getDoctorSchedules,
};
