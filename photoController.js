const pool = require("../utils/db");

exports.addServicePhoto = async (req, res) => {
  const user_id = req.user.user_id;
  const { appointment_id, staff_id, service_id, photo_type, photo_url } =
    req.body;
  try {
    const conn = await pool.getConnection();
    await conn.query(
      `INSERT INTO service_photos (appointment_id, user_id, staff_id, service_id, photo_type, photo_url)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        appointment_id,
        user_id,
        staff_id || null,
        service_id || null,
        photo_type,
        photo_url,
      ]
    );
    conn.release();
    res.json({ message: "Service photo uploaded" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getServicePhotos = async (req, res) => {
  const appointment_id = req.params.appointment_id;
  try {
    const conn = await pool.getConnection();
    const [photos] = await conn.query(
      `SELECT * FROM service_photos WHERE appointment_id = ?`,
      [appointment_id]
    );
    conn.release();
    res.json({ photos });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
