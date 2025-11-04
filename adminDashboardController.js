const pool = require("../utils/db");

// 1. User Engagement Stats
exports.getUserEngagement = async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [activeUsers] = await conn.query(
      `SELECT COUNT(*) AS active_user_count FROM users WHERE updated_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`
    );
    const [totalUsers] = await conn.query(
      `SELECT COUNT(*) AS total_user_count FROM users`
    );
    conn.release();
    res.json({ activeUsers: activeUsers[0], totalUsers: totalUsers[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 2. Appointment Trends
exports.getAppointmentTrends = async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [trends] = await conn.query(
      `SELECT HOUR(scheduled_time) AS hour, COUNT(*) AS appointments
       FROM appointments
       WHERE scheduled_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY hour
       ORDER BY hour`
    );
    conn.release();
    res.json(trends);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 3. Salon Revenues
exports.getSalonRevenues = async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [revenues] = await conn.query(
      `SELECT s.salon_id, s.name AS salon_name, SUM(p.amount) AS total_revenue
       FROM payments p
       JOIN appointments a ON p.appointment_id = a.appointment_id
       JOIN salons s ON a.salon_id = s.salon_id
       WHERE p.payment_status = 'completed'
       GROUP BY s.salon_id, s.name`
    );
    conn.release();
    res.json(revenues);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 4. Loyalty Program Usage
exports.getLoyaltyUsage = async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [usage] = await conn.query(
      `SELECT salon_id, SUM(points) AS total_points
       FROM loyalty
       WHERE last_earned >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY salon_id`
    );
    conn.release();
    res.json(usage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 5. User Demographics
exports.getUserDemographics = async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [demographics] = await conn.query(
      `SELECT user_role, COUNT(*) AS count FROM users GROUP BY user_role`
    );
    conn.release();
    res.json(demographics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 6. Customer Retention Metrics
exports.getCustomerRetention = async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [retention] = await conn.query(
      `SELECT user_id FROM appointments
       WHERE scheduled_time >= DATE_SUB(NOW(), INTERVAL 90 DAY)
       GROUP BY user_id
       HAVING COUNT(appointment_id) > 1`
    );
    conn.release();
    res.json({ retained_customers: retention.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 7. Generate Reports
exports.getReports = async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [reports] = await conn.query(
      `SELECT s.salon_id, s.name AS salon_name, SUM(p.amount) AS total_sales
       FROM payments p
       JOIN appointments a ON p.appointment_id = a.appointment_id
       JOIN salons s ON a.salon_id = s.salon_id
       WHERE p.payment_status = 'completed'
       GROUP BY s.salon_id, s.name`
    );
    conn.release();
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 8. Monitor Platform Logs
exports.getSystemLogs = async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [logs] = await conn.query(
      `SELECT event_type, COUNT(*) AS count
       FROM salon_audit
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       GROUP BY event_type
       ORDER BY count DESC
       LIMIT 50`
    );
    conn.release();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
