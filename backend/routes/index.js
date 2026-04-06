const express = require("express");
const healthRoutes = require("./healthRoutes");
const bookingRoutes = require("./bookingRoutes");

const router = express.Router();

router.use(healthRoutes);
router.use("/api", bookingRoutes);

module.exports = router;
