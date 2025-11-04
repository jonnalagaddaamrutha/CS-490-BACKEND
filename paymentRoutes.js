// paymentRoutes.js
const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const { authenticateToken } = require("../middlewares/authMiddleware");

router.post("/pay", authenticateToken, paymentController.processPayment);
router.get(
  "/salon/:salon_id",
  authenticateToken,
  paymentController.getPaymentsForSalon
);

module.exports = router;
