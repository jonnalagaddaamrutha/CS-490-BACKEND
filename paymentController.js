const pool = require("../utils/db");

// 1. Pay securely online (simulate payment & record)
exports.processPayment = async (req, res) => {
  const { user_id, amount, payment_method, appointment_id } = req.body;
  try {
    const conn = await pool.getConnection();
    // Mark payment as completed (production would use payment gateway)
    const [result] = await conn.query(
      `INSERT INTO payments (user_id, amount, payment_method, payment_status, appointment_id)
       VALUES (?, ?, ?, 'completed', ?)`,
      [user_id, amount, payment_method, appointment_id]
    );
    conn.release();
    res.json({
      message: "Payment processed successfully",
      payment_id: result.insertId,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 2. Track payments - get all for a salon
exports.getPaymentsForSalon = async (req, res) => {
  const { salon_id } = req.params;
  try {
    const conn = await pool.getConnection();
    const [payments] = await conn.query(
      `SELECT p.*, u.full_name AS customer_name
         FROM payments p
         LEFT JOIN appointments a ON p.appointment_id = a.appointment_id
         LEFT JOIN users u ON p.user_id = u.user_id
         WHERE a.salon_id = ?`,
      [salon_id]
    );
    conn.release();
    res.json({ payments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
