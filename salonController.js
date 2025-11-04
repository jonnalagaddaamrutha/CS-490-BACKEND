const pool = require("../utils/db");

exports.createSalon = async (req, res) => {
  const owner_id = req.user.user_id;
  const { name, address, description } = req.body;
  try {
    const conn = await pool.getConnection();
    try {
      const [result] = await conn.execute(
        "INSERT INTO salons (owner_id, name, address, description, status) VALUES (?, ?, ?, ?, ?)",
        [owner_id, name, address, description, "pending"]
      );
      res.status(201).json({
        salon_id: result.insertId,
        message: "Salon registration submitted",
      });
    } finally {
      conn.release();
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.listPendingSalons = async (req, res) => {
  try {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.execute(
        "SELECT * FROM salons WHERE status = ?",
        ["pending"]
      );
      res.json(rows);
    } finally {
      conn.release();
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateSalonStatus = async (req, res) => {
  const { salon_id } = req.params;
  // Accept both status and review_status
  const { status, review_status, rejected_reason } = req.body;
  const reviewed_by = req.user.user_id;
  try {
    const conn = await pool.getConnection();
    try {
      // Update salon status (must be pending, active, blocked)
      if (status) {
        if (!["pending", "active", "blocked"].includes(status)) {
          throw new Error("Invalid status. Allowed: pending, active, blocked");
        }
        await conn.execute("UPDATE salons SET status = ? WHERE salon_id = ?", [
          status,
          salon_id,
        ]);
      }

      // Update salon_admin.review_status (must be pending, approved, rejected, blocked)
      if (review_status) {
        if (
          !["pending", "approved", "rejected", "blocked"].includes(
            review_status
          )
        ) {
          throw new Error(
            "Invalid review_status. Allowed: pending, approved, rejected, blocked"
          );
        }
        await conn.execute(
          `INSERT INTO salon_admin (salon_id, reviewed_by, review_status, rejected_reason, reviewed_at)
           VALUES (?, ?, ?, ?, NOW())
           ON DUPLICATE KEY UPDATE review_status = VALUES(review_status), rejected_reason = VALUES(rejected_reason), reviewed_at = NOW()`,
          [salon_id, reviewed_by, review_status, rejected_reason || null]
        );
      }

      res.json({
        message: `Salon status updated.`,
        status,
        review_status,
      });
    } finally {
      conn.release();
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.listActiveSalons = async (req, res) => {
  try {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.execute(
        "SELECT * FROM salons WHERE status = ?",
        ["active"]
      );
      res.json(rows); // returns all active salons to the caller
    } finally {
      conn.release();
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
