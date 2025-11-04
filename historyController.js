const pool = require("../utils/db");

exports.getUserHistory = async (req, res) => {
  const user_id = req.user.user_id;
  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.query(
      `SELECT h.*, s.full_name AS staff_name, sv.custom_name AS service_name, sl.name AS salon_name
       FROM history h
       LEFT JOIN staff st ON h.staff_id = st.staff_id
       LEFT JOIN users s ON st.user_id = s.user_id
       LEFT JOIN services sv ON h.service_id = sv.service_id
       LEFT JOIN salons sl ON h.salon_id = sl.salon_id
       WHERE h.user_id = ?
       ORDER BY h.visit_date DESC`,
      [user_id]
    );
    conn.release();
    res.json({ history: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getSalonVisitHistory = async (req, res) => {
  const salon_id = req.params.salon_id;
  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.query(
      `SELECT h.*, u.full_name AS customer_name, s.full_name AS staff_name, sv.custom_name AS service_name
       FROM history h
       LEFT JOIN users u ON h.user_id = u.user_id
       LEFT JOIN staff st ON h.staff_id = st.staff_id
       LEFT JOIN users s ON st.user_id = s.user_id
       LEFT JOIN services sv ON h.service_id = sv.service_id
       WHERE h.salon_id = ?
       ORDER BY h.visit_date DESC`,
      [salon_id]
    );
    conn.release();
    res.json({ visits: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
