// salon-backend/routes/historyRoutes.js
const express = require("express");
const router = express.Router();
const historyController = require("../controllers/historyController");
const { authenticateToken } = require("../middlewares/authMiddleware");

router.get("/user", authenticateToken, historyController.getUserHistory);
router.get(
  "/salon/:salon_id",
  authenticateToken,
  historyController.getSalonVisitHistory
);

module.exports = router;
