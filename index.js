require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");

const authRoutes = require("./routes/authRoutes");
const salonRoutes = require("./routes/salonRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const staffRoutes = require("./routes/staffRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const loyaltyRoutes = require("./routes/loyaltyRoutes");
const historyRoutes = require("./routes/historyRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const photoRoutes = require("./routes/photoRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const adminDashboardRoutes = require("./routes/adminDashboardRoutes");
const shopRoutes = require("./routes/shopRoutes");
// ...
// Include other routes similarly

const app = express();
app.use(bodyParser.json());

// Mount routes
app.use("/api/auth", authRoutes);
app.use("/api/salons", salonRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/booking", bookingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/loyalty", loyaltyRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/photos", photoRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin-dashboard", adminDashboardRoutes);
app.get("/api/healthz", (req, res) => {
  res.status(200).json({ status: "UP", timestamp: new Date() });
});
app.use("/api/shop", shopRoutes);
// Add further routes here

// Default 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Not Found" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend server started on port ${PORT}`);
});
