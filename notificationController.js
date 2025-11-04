const pool = require("../utils/db");

// 1. Send appointment reminder notification to user
exports.sendAppointmentReminder = async (req, res) => {
  const { user_id, appointment_id, message, scheduled_for } = req.body;
  try {
    const conn = await pool.getConnection();
    // Insert notification reminder in queue for scheduled delivery
    await conn.query(
      `INSERT INTO notification_queue (user_id, message, delivery_method, scheduled_for, sent)
       VALUES (?, ?, 'email', ?, FALSE)`,
      [user_id, message, scheduled_for]
    );
    conn.release();
    res.json({ message: "Reminder scheduled" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 2. Salon owner sends promotions to loyal customers
exports.sendPromotionalOffer = async (req, res) => {
  const { user_ids, message, scheduled_for } = req.body;
  try {
    const conn = await pool.getConnection();
    // Bulk insert notifications to queue for all user_ids
    for (let user_id of user_ids) {
      await conn.query(
        `INSERT INTO notification_queue (user_id, message, delivery_method, scheduled_for, sent)
         VALUES (?, ?, 'push', ?, FALSE)`,
        [user_id, message, scheduled_for]
      );
    }
    conn.release();
    res.json({ message: "Promotional offers queued" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 3. Barber notifies client of delay
exports.notifyClientDelay = async (req, res) => {
  const { user_id, message } = req.body;
  try {
    const conn = await pool.getConnection();
    // Insert notification immediately, mark as not sent
    await conn.query(
      `INSERT INTO notification_queue (user_id, message, delivery_method, scheduled_for, sent)
       VALUES (?, ?, 'sms', NOW(), FALSE)`,
      [user_id, message]
    );
    conn.release();
    res.json({ message: "Client notified of delay" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 4. Notify user about discounts
exports.notifyUserDiscount = async (req, res) => {
  const { user_id, message } = req.body;
  try {
    const conn = await pool.getConnection();
    // Immediate or scheduled notification (here immediate)
    await conn.query(
      `INSERT INTO notification_queue (user_id, message, delivery_method, scheduled_for, sent)
       VALUES (?, ?, 'email', NOW(), FALSE)`,
      [user_id, message]
    );
    conn.release();
    res.json({ message: "Discount notification sent" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Optional API to fetch all notifications for a user
exports.getUserNotifications = async (req, res) => {
  const user_id = req.user.user_id;
  try {
    const conn = await pool.getConnection();
    const [notifications] = await conn.query(
      `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC`,
      [user_id]
    );
    conn.release();
    res.json({ notifications });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
