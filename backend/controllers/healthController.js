const { isSupabaseConfigured } = require("../supabaseClient");

function healthCheck(_req, res) {
  res.status(200).json({
    ok: true,
    service: "klinik-sofeng-backend",
    supabaseConfigured: isSupabaseConfigured,
    timestamp: new Date().toISOString(),
  });
}

function apiStatus(_req, res) {
  res.status(200).json({
    message: "Express backend siap digunakan.",
  });
}

module.exports = {
  healthCheck,
  apiStatus,
};
