// salon-backend/routes/photoRoutes.js
const express = require("express");
const router = express.Router();
const photoController = require("../controllers/photoController");
const { authenticateToken } = require("../middlewares/authMiddleware");

router.post("/add", authenticateToken, photoController.addServicePhoto);
router.get(
  "/:appointment_id",
  authenticateToken,
  photoController.getServicePhotos
);

module.exports = router;
