const PORT = Number(process.env.BACKEND_PORT || 4000);
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:3000";

module.exports = {
  PORT,
  FRONTEND_ORIGIN,
};
