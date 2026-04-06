const express = require("express");
const { healthCheck, apiStatus } = require("../controllers/healthController");

const router = express.Router();

router.get("/health", healthCheck);
router.get("/api", apiStatus);

module.exports = router;
