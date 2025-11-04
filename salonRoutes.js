const express = require("express");
const router = express.Router();
const salonController = require("../controllers/salonController");
const { authenticateToken } = require("../middlewares/authMiddleware");

router.post("/", authenticateToken, salonController.createSalon);
// Add this new route for customers:
router.get("/", authenticateToken, salonController.listActiveSalons);
router.get("/pending", authenticateToken, salonController.listPendingSalons);
router.put(
  "/:salon_id/status",
  authenticateToken,
  salonController.updateSalonStatus
);

module.exports = router;
