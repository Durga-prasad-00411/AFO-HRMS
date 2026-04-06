const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

const router = express.Router();

/* =====================================================
   REGISTER USER (SUPER ADMIN CAN CREATE EMPLOYEES)
   ===================================================== */
router.post("/register", async (req, res) => {
  try {
    const { username, email, password, role_id, shift_id } = req.body;

    // Validation
    if (!username || !email || !password || !role_id) {
      return res.status(400).json({ message: "All required fields missing" });
    }

    // Email already exists?
    const [existing] = await db.execute(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert
    await db.execute(
      `INSERT INTO users (username, email, password, role_id, shift_id)
       VALUES (?, ?, ?, ?, ?)`,
      [username, email, hashedPassword, role_id, shift_id || null]
    );

    res.status(201).json({
      message: "User created successfully"
    });

  } catch (err) {
    console.log("REGISTER ERROR:", err);
    res.status(500).json({ message: "Registration failed" });
  }
});


/* =====================================================
   LOGIN USER
   ===================================================== */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Email and password required" });

    /* ---------- GET USER FIRST (NO ROLE JOIN BLOCK) ---------- */
    const [users] = await db.execute(
      `SELECT id, username, email, password, role_id
       FROM users
       WHERE email = ?`,
      [email]
    );

    if (users.length === 0)
      return res.status(401).json({ message: "User not found" });

    const user = users[0];

    /* ---------- PASSWORD CHECK ---------- */
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch)
      return res.status(401).json({ message: "Invalid password" });

    /* ---------- NOW FETCH ROLE ---------- */
    const [roleData] = await db.execute(
      "SELECT role_name FROM roles WHERE id = ?",
      [user.role_id]
    );

    let roleName = "EMPLOYEE"; // fallback safety
    if (roleData.length > 0) {
      roleName = roleData[0].role_name;
    }

    /* ---------- JWT ---------- */
    const token = jwt.sign(
      {
        id: user.id,
        role: roleName,
        role_id: user.role_id,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token,
      role: roleName,
      user_id: user.id
    });

  } catch (err) {
    console.log("LOGIN ERROR:", err);
    res.status(500).json({ message: "Login error" });
  }
});
module.exports = router; 