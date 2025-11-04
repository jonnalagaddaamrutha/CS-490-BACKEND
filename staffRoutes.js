const express = require("express");
const router = express.Router();
const staffController = require("../controllers/staffController");
const { authenticateToken } = require("../middlewares/authMiddleware");

// Only admin/salon owner should have permission to add staff!
router.post("/enroll", authenticateToken, staffController.enrollStaff);

module.exports = router;
