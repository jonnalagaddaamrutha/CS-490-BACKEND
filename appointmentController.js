const pool = require("../utils/db");

// Book appointment
exports.bookAppointment = async (req, res) => {
  const user_id = req.user.user_id;
  const { salon_id, staff_id, service_id, scheduled_time, price, notes } =
    req.body;
  try {
    const conn = await pool.getConnection();
    try {
      const [result] = await conn.execute(
        "INSERT INTO appointments (user_id, salon_id, staff_id, service_id, scheduled_time, price, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [
          user_id,
          salon_id,
          staff_id,
          service_id,
          scheduled_time,
          price,
          "booked",
          notes,
        ]
      );
      res
        .status(201)
        .json({
          appointment_id: result.insertId,
          message: "Appointment booked successfully",
        });
    } finally {
      conn.release();
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
