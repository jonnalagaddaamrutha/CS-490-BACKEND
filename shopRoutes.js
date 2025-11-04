const express = require("express");
const router = express.Router();
const shopController = require("../controllers/shopController");
const { authenticateToken } = require("../middlewares/authMiddleware");

// Owner endpoints
router.post("/add-product", authenticateToken, shopController.addProduct);
router.put(
  "/update-product/:product_id",
  authenticateToken,
  shopController.updateProduct
);

// Public endpoints
router.get("/products/:salon_id", shopController.getSalonProducts);

// User endpoints
router.post("/add-to-cart", authenticateToken, shopController.addToCart);
router.get("/cart", authenticateToken, shopController.getCart);
router.post("/checkout", authenticateToken, shopController.checkoutCart);

module.exports = router;
