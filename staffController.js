const pool = require("../utils/db");

// Only allow admin/owner from your app logic/middleware!
exports.enrollStaff = async (req, res) => {
  const { user_id, salon_id, role, specialization } = req.body;
  try {
    const conn = await pool.getConnection();
    // Check if user exists and is actually a 'staff'
    const [users] = await conn.execute(
      "SELECT * FROM users WHERE user_id = ? AND user_role = 'staff'",
      [user_id]
    );
    if (users.length === 0) {
      conn.release();
      return res
        .status(404)
        .json({ error: "User does not exist or is not staff" });
    }
    // Optional: check if user already staff in this salon
    const [exists] = await conn.execute(
      "SELECT * FROM staff WHERE user_id = ? AND salon_id = ?",
      [user_id, salon_id]
    );
    if (exists.length) {
      conn.release();
      return res
        .status(409)
        .json({ error: "Staff already exists in this salon" });
    }
    // Insert staff
    await conn.execute(
      `INSERT INTO staff (salon_id, user_id, role, specialization, is_active) 
       VALUES (?, ?, ?, ?, TRUE)`,
      [salon_id, user_id, role || "barber", specialization || null]
    );
    conn.release();
    res.status(201).json({ message: "Staff enrolled successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
