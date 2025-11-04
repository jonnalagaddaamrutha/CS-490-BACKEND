const pool = require("../utils/db");

exports.addReview = async (req, res) => {
  const user_id = req.user.user_id;
  const { appointment_id, salon_id, staff_id, rating, comment } = req.body;
  try {
    const conn = await pool.getConnection();
    await conn.query(
      `INSERT INTO reviews (appointment_id, user_id, salon_id, staff_id, rating, comment, is_visible, is_flagged)
       VALUES (?, ?, ?, ?, ?, ?, TRUE, FALSE)`,
      [appointment_id, user_id, salon_id, staff_id || null, rating, comment]
    );
    conn.release();
    res.json({ message: "Review added" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addReviewResponse = async (req, res) => {
  const review_id = req.params.id;
  const { response } = req.body;
  try {
    const conn = await pool.getConnection();
    await conn.query(`UPDATE reviews SET response = ? WHERE review_id = ?`, [
      response,
      review_id,
    ]);
    conn.release();
    res.json({ message: "Response added" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
