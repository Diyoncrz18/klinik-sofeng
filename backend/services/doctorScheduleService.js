const {
  supabase,
  isSupabaseConfigured,
  SUPABASE_DOCTOR_SCHEDULES_TABLE,
} = require("../supabaseClient");

function formatDateOnly(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date, days) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function normalizeScheduleLimit(limit = 3) {
  if (!Number.isFinite(limit)) {
    return 3;
  }

  return Math.min(Math.max(Number(limit), 1), 20);
}

async function listDoctorSchedules(limit = 20) {
  const safeLimit = normalizeScheduleLimit(limit);

  return supabase
    .from(SUPABASE_DOCTOR_SCHEDULES_TABLE)
    .select("id,schedule_date,start_time,end_time,doctor_name")
    .order("schedule_date", { ascending: true })
    .order("start_time", { ascending: true })
    .limit(safeLimit);
}

async function getDoctorScheduleTemplates(limit = 3) {
  const safeLimit = normalizeScheduleLimit(limit);

  return supabase
    .from(SUPABASE_DOCTOR_SCHEDULES_TABLE)
    .select("id,schedule_date,start_time,end_time,doctor_name")
    .order("id", { ascending: true })
    .limit(safeLimit);
}

async function syncRollingDoctorSchedules(limit = 3) {
  const safeLimit = normalizeScheduleLimit(limit);
  const templatesResponse = await getDoctorScheduleTemplates(safeLimit);

  if (templatesResponse.error) {
    return {
      data: null,
      error: templatesResponse.error,
      updated: false,
    };
  }

  const templates = templatesResponse.data || [];

  if (templates.length === 0) {
    return {
      data: [],
      error: null,
      updated: false,
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const pendingUpdates = templates
    .map((template, index) => {
      const nextDate = addDays(today, index + 1);
      const targetDate = formatDateOnly(nextDate);

      if (template.schedule_date === targetDate) {
        return null;
      }

      return {
        id: template.id,
        schedule_date: targetDate,
      };
    })
    .filter(Boolean);

  for (const updatePayload of pendingUpdates) {
    const { error } = await supabase
      .from(SUPABASE_DOCTOR_SCHEDULES_TABLE)
      .update({
        schedule_date: updatePayload.schedule_date,
        updated_at: new Date().toISOString(),
      })
      .eq("id", updatePayload.id);

    if (error) {
      return {
        data: null,
        error,
        updated: false,
      };
    }
  }

  const schedulesResponse = await listDoctorSchedules(safeLimit);

  return {
    data: schedulesResponse.data || [],
    error: schedulesResponse.error || null,
    updated: pendingUpdates.length > 0,
  };
}

module.exports = {
  isSupabaseConfigured,
  SUPABASE_DOCTOR_SCHEDULES_TABLE,
  listDoctorSchedules,
  syncRollingDoctorSchedules,
};
