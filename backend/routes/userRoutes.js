const express = require("express");
const router = express.Router();
const { verifyToken, authorizeRoles } = require("../middleware/authMiddleware");

// Example Protected Routes

router.get(
  "/superadmin",
  verifyToken,
  authorizeRoles("SUPER_ADMIN", "ADMIN"),
  (req, res) => {
    res.json({ message: "Welcome Super Admin" });
  }
);

router.get(
  "/admin",
  verifyToken,
  authorizeRoles("HR"),
  (req, res) => {
    res.json({ message: "Welcome HR Admin" });
  }
);

router.get(
  "/manager",
  verifyToken,
  authorizeRoles("MANAGER"),
  (req, res) => {
    res.json({ message: "Welcome Manager" });
  }
);

module.exports = router;
