const pool = require("../utils/db");

// 3. Earn loyalty points (call after payment/visit completion)
exports.earnLoyaltyPoints = async (req, res) => {
  const { user_id, salon_id, points_earned } = req.body;
  try {
    const conn = await pool.getConnection();
    // Check if loyalty record exists
    const [[loyalty]] = await conn.query(
      `SELECT * FROM loyalty WHERE user_id = ? AND salon_id = ?`,
      [user_id, salon_id]
    );
    if (loyalty) {
      await conn.query(
        `UPDATE loyalty SET points = points + ?, last_earned = NOW(), updated_at = NOW() WHERE loyalty_id = ?`,
        [points_earned, loyalty.loyalty_id]
      );
    } else {
      await conn.query(
        `INSERT INTO loyalty (user_id, salon_id, points, last_earned) VALUES (?, ?, ?, NOW())`,
        [user_id, salon_id, points_earned]
      );
    }
    conn.release();
    res.json({ message: "Loyalty points updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 4. View points balance (user-salon)
exports.getLoyaltyPoints = async (req, res) => {
  const { user_id, salon_id } = req.params;
  try {
    const conn = await pool.getConnection();
    const [[loyalty]] = await conn.query(
      `SELECT points FROM loyalty WHERE user_id = ? AND salon_id = ?`,
      [user_id, salon_id]
    );
    conn.release();
    res.json({ points: loyalty ? loyalty.points : 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 5. Redeem points for discount
exports.redeemLoyaltyPoints = async (req, res) => {
  const { user_id, salon_id, points_to_redeem } = req.body;
  try {
    const conn = await pool.getConnection();
    const [[loyalty]] = await conn.query(
      `SELECT points FROM loyalty WHERE user_id = ? AND salon_id = ?`,
      [user_id, salon_id]
    );
    if (!loyalty || loyalty.points < points_to_redeem) {
      conn.release();
      return res.status(400).json({ error: "Not enough points" });
    }
    await conn.query(
      `UPDATE loyalty SET points = points - ?, last_redeemed = NOW(), updated_at = NOW() WHERE user_id = ? AND salon_id = ?`,
      [points_to_redeem, user_id, salon_id]
    );
    conn.release();
    res.json({ message: "Points redeemed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 6. Configure loyalty rewards (extend salon_settings, or implement table as above)
exports.setLoyaltyConfig = async (req, res) => {
  const { salon_id, points_per_visit, redeem_rate } = req.body;
  try {
    const conn = await pool.getConnection();
    // Add custom table if not present: loyalty_settings (see prior samples)
    await conn.query(
      `INSERT INTO salon_settings (salon_id, cancellation_policy, auto_complete_after)
         VALUES (?, CONCAT('loyalty:', ?), 120)
         ON DUPLICATE KEY UPDATE cancellation_policy = CONCAT('loyalty:', ?)`,
      [
        salon_id,
        JSON.stringify({ points_per_visit, redeem_rate }),
        JSON.stringify({ points_per_visit, redeem_rate }),
      ]
    );
    conn.release();
    res.json({ message: "Loyalty config updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
