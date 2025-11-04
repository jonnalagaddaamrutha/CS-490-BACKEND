// loyaltyRoutes.js
const express = require("express");
const router = express.Router();
const loyaltyController = require("../controllers/loyaltyController");
const { authenticateToken } = require("../middlewares/authMiddleware");

router.post("/earn", authenticateToken, loyaltyController.earnLoyaltyPoints);
router.get(
  "/:user_id/:salon_id",
  authenticateToken,
  loyaltyController.getLoyaltyPoints
);
router.post(
  "/redeem",
  authenticateToken,
  loyaltyController.redeemLoyaltyPoints
);
router.post("/config", authenticateToken, loyaltyController.setLoyaltyConfig);

module.exports = router;
