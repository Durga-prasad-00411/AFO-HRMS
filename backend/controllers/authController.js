const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.loginUser = (req, res) => {
  const { email, password } = req.body;

  const sql = `
    SELECT
      u.id,
      u.email,
      u.password,
      u.role_id,
      r.role_name,
      COALESCE(e.first_name, u.username, u.email) AS first_name,
      COALESCE(e.last_name, '')                    AS last_name
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    LEFT JOIN employees e ON u.id = e.user_id
    WHERE u.email = ?
    LIMIT 1
  `;

  db.query(sql, [email], (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });

    if (results.length === 0)
      return res.status(400).json({ message: "Invalid credentials" });

    const user = results[0];

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const roleName = user.role_name || "EMPLOYEE";

    const token = jwt.sign(
      {
        id:      user.id,
        role:    roleName,
        role_id: user.role_id,
        email:   user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message:    "Login Successful",
      token,
      role:       roleName,
      user_id:    user.id,
      first_name: user.first_name,
      last_name:  user.last_name,
    });
  });
};
