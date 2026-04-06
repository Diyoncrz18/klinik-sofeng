const express = require("express");
const {
	createPatientBooking,
	getPatientBookings,
	getSupabaseStatus,
} = require("../controllers/bookingController");
const {
	getDoctorSchedules,
} = require("../controllers/doctorScheduleController");

const router = express.Router();

router.get("/supabase/status", getSupabaseStatus);
router.get("/patient-bookings", getPatientBookings);
router.post("/patient-bookings", createPatientBooking);
router.get("/schedules", getDoctorSchedules);

module.exports = router;
