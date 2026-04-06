const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SECRET_KEY =
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const SUPABASE_BOOKINGS_TABLE = process.env.SUPABASE_BOOKINGS_TABLE || "patient_bookings";
const SUPABASE_DOCTOR_SCHEDULES_TABLE =
  process.env.SUPABASE_DOCTOR_SCHEDULES_TABLE || "doctor_schedules";

const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_SECRET_KEY);

const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

module.exports = {
  supabase,
  isSupabaseConfigured,
  SUPABASE_BOOKINGS_TABLE,
  SUPABASE_DOCTOR_SCHEDULES_TABLE,
};
