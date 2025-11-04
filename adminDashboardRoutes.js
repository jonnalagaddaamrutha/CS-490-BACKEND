const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminDashboardController");
const { authenticateToken } = require("../middlewares/authMiddleware");

// Protect all routes by authentication and optionally role check (e.g., admin only)
// Example without role middleware, add inside controller if needed

router.get(
  "/user-engagement",
  authenticateToken,
  adminController.getUserEngagement
);
router.get(
  "/appointment-trends",
  authenticateToken,
  adminController.getAppointmentTrends
);
router.get(
  "/salon-revenues",
  authenticateToken,
  adminController.getSalonRevenues
);
router.get(
  "/loyalty-usage",
  authenticateToken,
  adminController.getLoyaltyUsage
);
router.get(
  "/user-demographics",
  authenticateToken,
  adminController.getUserDemographics
);
router.get(
  "/customer-retention",
  authenticateToken,
  adminController.getCustomerRetention
);
router.get("/reports", authenticateToken, adminController.getReports);
router.get("/system-logs", authenticateToken, adminController.getSystemLogs);

module.exports = router;
