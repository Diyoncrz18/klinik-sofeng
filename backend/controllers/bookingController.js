const {
  SUPABASE_BOOKINGS_TABLE,
  isSupabaseConfigured,
  REQUIRED_BOOKING_FIELDS,
  validatePatientBookingPayload,
  insertPatientBooking,
  listPatientBookings,
  checkBookingsTableAccess,
} = require("../services/bookingService");

const REQUIRED_SUPABASE_ENV = [
  "SUPABASE_URL atau NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SECRET_KEY atau SUPABASE_SERVICE_ROLE_KEY",
];

function getTableNotReadyResponse(error) {
  return {
    error: `Tabel Supabase \"${SUPABASE_BOOKINGS_TABLE}\" belum tersedia.`,
    detail: error?.message || "Schema cache belum menemukan tabel tujuan.",
    table: SUPABASE_BOOKINGS_TABLE,
    nextStep:
      "Buat tabel dengan SQL di backend/sql/patient_bookings.sql lalu coba lagi.",
  };
}

async function createPatientBooking(req, res) {
  const requestPayload = req.body || {};
  const { normalizedPayload, missingFields, validationErrors } =
    validatePatientBookingPayload(requestPayload);

  if (missingFields.length > 0) {
    return res.status(400).json({
      error: "Field wajib belum lengkap.",
      requiredFields: REQUIRED_BOOKING_FIELDS,
      missingFields,
    });
  }

  if (Object.keys(validationErrors).length > 0) {
    return res.status(400).json({
      error: "Format input booking tidak valid.",
      validationErrors,
    });
  }

  if (!isSupabaseConfigured) {
    return res.status(500).json({
      error: "Supabase belum terkonfigurasi.",
      requiredEnv: REQUIRED_SUPABASE_ENV,
    });
  }

  const { data, error } = await insertPatientBooking(normalizedPayload);

  if (error) {
    console.error("Supabase insert error:", error);

    if (error.code === "PGRST205") {
      return res.status(500).json(getTableNotReadyResponse(error));
    }

    return res.status(500).json({
      error: "Gagal menyimpan booking ke Supabase.",
      detail: error.message,
    });
  }

  return res.status(201).json({
    message: "Booking pasien berhasil disimpan ke Supabase.",
    booking: data,
  });
}

async function getPatientBookings(req, res) {
  if (!isSupabaseConfigured) {
    return res.status(500).json({
      error: "Supabase belum terkonfigurasi.",
      requiredEnv: REQUIRED_SUPABASE_ENV,
    });
  }

  const requestedLimit = Number(req.query.limit || 20);
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(requestedLimit, 1), 100)
    : 20;

  const { data, error } = await listPatientBookings(limit);

  if (error) {
    console.error("Supabase select error:", error);

    if (error.code === "PGRST205") {
      return res.status(500).json(getTableNotReadyResponse(error));
    }

    return res.status(500).json({
      error: "Gagal mengambil data booking dari Supabase.",
      detail: error.message,
    });
  }

  return res.status(200).json({
    table: SUPABASE_BOOKINGS_TABLE,
    total: data.length,
    bookings: data,
  });
}

async function getSupabaseStatus(_req, res) {
  if (!isSupabaseConfigured) {
    return res.status(200).json({
      ok: false,
      supabaseConfigured: false,
      requiredEnv: REQUIRED_SUPABASE_ENV,
    });
  }

  const { count, error } = await checkBookingsTableAccess();

  if (error) {
    if (error.code === "PGRST205") {
      return res.status(200).json({
        ok: false,
        supabaseConfigured: true,
        tableReady: false,
        ...getTableNotReadyResponse(error),
      });
    }

    return res.status(200).json({
      ok: false,
      supabaseConfigured: true,
      tableReady: false,
      error: "Supabase terhubung tapi pengecekan tabel gagal.",
      detail: error.message,
    });
  }

  return res.status(200).json({
    ok: true,
    supabaseConfigured: true,
    tableReady: true,
    table: SUPABASE_BOOKINGS_TABLE,
    rowCount: count ?? 0,
  });
}

module.exports = {
  createPatientBooking,
  getPatientBookings,
  getSupabaseStatus,
};
