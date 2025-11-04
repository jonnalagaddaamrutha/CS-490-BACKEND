const pool = require("../utils/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const saltRounds = 10;

exports.signup = async (req, res) => {
  const { full_name, phone, email, password, user_role } = req.body;
  try {
    const conn = await pool.getConnection();
    try {
      // Check duplicates
      const [existing] = await conn.execute(
        "SELECT user_id FROM users WHERE email = ? OR phone = ?",
        [email, phone]
      );
      if (existing.length > 0) {
        return res
          .status(400)
          .json({ message: "Email or phone already registered" });
      }
      // Insert new user
      const [result] = await conn.execute(
        "INSERT INTO users (full_name, phone, email, user_role) VALUES (?, ?, ?, ?)",
        [full_name, phone, email, user_role]
      );
      const userId = result.insertId;
      // Hash password then store
      const password_hash = await bcrypt.hash(password, saltRounds);
      await conn.execute(
        "INSERT INTO auth (user_id, email, password_hash) VALUES (?, ?, ?)",
        [userId, email, password_hash]
      );
      res.status(201).json({ message: "User registered successfully" });
    } finally {
      conn.release();
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const conn = await pool.getConnection();
    try {
      const [rows] = await conn.execute("SELECT * FROM auth WHERE email = ?", [
        email,
      ]);
      if (rows.length === 0)
        return res.status(401).json({ message: "Invalid email or password" });
      const user = rows[0];
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid)
        return res.status(401).json({ message: "Invalid email or password" });

      // Create JWT token
      const token = jwt.sign(
        { user_id: user.user_id, email: user.email },
        process.env.JWT_SECRET,
        {
          expiresIn: "6h",
        }
      );

      // Update last login
      await conn.execute(
        "UPDATE auth SET last_login = NOW(), login_count = login_count + 1 WHERE auth_id = ?",
        [user.auth_id]
      );

      res.json({ token });
    } finally {
      conn.release();
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
