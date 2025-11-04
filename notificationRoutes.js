const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const { authenticateToken } = require("../middlewares/authMiddleware");

router.post(
  "/reminder",
  authenticateToken,
  notificationController.sendAppointmentReminder
);
router.post(
  "/promotion",
  authenticateToken,
  notificationController.sendPromotionalOffer
);
router.post(
  "/delay",
  authenticateToken,
  notificationController.notifyClientDelay
);
router.post(
  "/discount",
  authenticateToken,
  notificationController.notifyUserDiscount
);
router.get("/", authenticateToken, notificationController.getUserNotifications);

module.exports = router;
