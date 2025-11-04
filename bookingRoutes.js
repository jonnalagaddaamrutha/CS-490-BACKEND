const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");
const { authenticateToken } = require("../middlewares/authMiddleware");

// Customers: Get available barbers and calculated time slots
router.get(
  "/available",
  authenticateToken,
  bookingController.getAvailableBarbersAndSlots
);

// Book appointment (Customer)
router.post("/book", authenticateToken, bookingController.bookAppointment);

// Reschedule appointment (Customer)
router.put(
  "/reschedule/:id",
  authenticateToken,
  bookingController.rescheduleAppointment
);

// Cancel appointment (Customer)
router.delete(
  "/cancel/:id",
  authenticateToken,
  bookingController.cancelAppointment
);

// Barber: Get daily schedule
router.get(
  "/barber/schedule",
  authenticateToken,
  bookingController.getBarberSchedule
);

// Barber: Block time off (unavailable slots)
router.post(
  "/barber/block-slot",
  authenticateToken,
  bookingController.blockTimeSlot
);

module.exports = router;
