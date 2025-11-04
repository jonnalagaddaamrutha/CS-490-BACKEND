// salon-backend/routes/reviewRoutes.js
const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const { authenticateToken } = require("../middlewares/authMiddleware");

router.post("/add", authenticateToken, reviewController.addReview);
router.put(
  "/respond/:id",
  authenticateToken,
  reviewController.addReviewResponse
);

module.exports = router;
