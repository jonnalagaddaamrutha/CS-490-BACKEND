const express = require("express");
const router = express.Router();
const appointmentController = require("../controllers/appointmentController");
const { authenticateToken } = require("../middlewares/authMiddleware");

router.post("/", authenticateToken, appointmentController.bookAppointment);

module.exports = router;
