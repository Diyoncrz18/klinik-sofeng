const {
  supabase,
  isSupabaseConfigured,
  SUPABASE_BOOKINGS_TABLE,
} = require("../supabaseClient");

const REQUIRED_BOOKING_FIELDS = [
  "patientName",
  "patientPhone",
  "serviceType",
  "visitDate",
  "visitTime",
];

const PHONE_REGEX = /^[0-9+()\-\s]{8,20}$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

function normalizeStringValue(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeOptionalValue(value) {
  const normalized = normalizeStringValue(value);
  return normalized || null;
}

function normalizeBookingPayload(payload = {}) {
  return {
    patientName: normalizeStringValue(payload.patientName),
    patientPhone: normalizeStringValue(payload.patientPhone),
    serviceType: normalizeStringValue(payload.serviceType),
    visitDate: normalizeStringValue(payload.visitDate),
    visitTime: normalizeStringValue(payload.visitTime),
    preferredDentist: normalizeOptionalValue(payload.preferredDentist),
    complaint: normalizeOptionalValue(payload.complaint),
  };
}

function isValidDateString(value) {
  if (!DATE_REGEX.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map((part) => Number(part));
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() + 1 === month &&
    date.getUTCDate() === day
  );
}

function validatePatientBookingPayload(payload = {}) {
  const normalizedPayload = normalizeBookingPayload(payload);
  const missingFields = REQUIRED_BOOKING_FIELDS.filter(
    (field) => !normalizedPayload[field]
  );
  const validationErrors = {};

  if (
    normalizedPayload.patientPhone &&
    !PHONE_REGEX.test(normalizedPayload.patientPhone)
  ) {
    validationErrors.patientPhone =
      "Nomor WhatsApp tidak valid. Gunakan 8-20 karakter angka/simbol telepon.";
  }

  if (
    normalizedPayload.visitDate &&
    !isValidDateString(normalizedPayload.visitDate)
  ) {
    validationErrors.visitDate =
      "Tanggal kunjungan tidak valid. Gunakan format YYYY-MM-DD.";
  }

  if (normalizedPayload.visitTime && !TIME_REGEX.test(normalizedPayload.visitTime)) {
    validationErrors.visitTime =
      "Jam kunjungan tidak valid. Gunakan format HH:MM atau HH:MM:SS.";
  }

  if (normalizedPayload.patientName && normalizedPayload.patientName.length < 3) {
    validationErrors.patientName = "Nama pasien minimal 3 karakter.";
  }

  return {
    normalizedPayload,
    missingFields,
    validationErrors,
  };
}

function getMissingRequiredFields(payload = {}) {
  const normalizedPayload = normalizeBookingPayload(payload);
  return REQUIRED_BOOKING_FIELDS.filter((field) => !normalizedPayload[field]);
}

function mapBookingPayload(payload = {}) {
  return {
    patient_name: payload.patientName,
    patient_phone: payload.patientPhone,
    service_type: payload.serviceType,
    visit_date: payload.visitDate,
    visit_time: payload.visitTime,
    preferred_dentist: payload.preferredDentist || null,
    complaint: payload.complaint || null,
  };
}

async function insertPatientBooking(payload) {
  const bookingPayload = mapBookingPayload(payload);

  return supabase
    .from(SUPABASE_BOOKINGS_TABLE)
    .insert([bookingPayload])
    .select("*")
    .single();
}

async function listPatientBookings(limit = 20) {
  return supabase
    .from(SUPABASE_BOOKINGS_TABLE)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
}

async function checkBookingsTableAccess() {
  return supabase
    .from(SUPABASE_BOOKINGS_TABLE)
    .select("id")
    .limit(1);
}

module.exports = {
  SUPABASE_BOOKINGS_TABLE,
  isSupabaseConfigured,
  REQUIRED_BOOKING_FIELDS,
  getMissingRequiredFields,
  validatePatientBookingPayload,
  insertPatientBooking,
  listPatientBookings,
  checkBookingsTableAccess,
};
