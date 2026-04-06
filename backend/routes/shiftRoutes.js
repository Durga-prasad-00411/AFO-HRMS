const express = require("express");
const router = express.Router();

const {
  addShift,
  getShifts,
  updateShift,
  deleteShift,
  getShiftById
} = require("../controllers/shiftController");

const { verifyToken, authorizeRoles } = require("../middleware/authMiddleware");


/* ADD SHIFT */

router.post(
  "/add",
  verifyToken,
  authorizeRoles("SUPER_ADMIN", "ADMIN"),
  addShift
);

/* GET ALL WORK MODES */
router.get("/work-modes", async (req, res) => {
  try {
    const db = require("../config/db");
    const [results] = await db.query("SELECT * FROM work_modes ORDER BY id ASC");
    res.json(results);
  } catch (err) {
    console.error("Get Work Modes Error:", err);
    res.status(500).json({ message: err.message });
  }
});


/* GET ALL SHIFTS */

router.get(
  "/",
  verifyToken,
  getShifts
);

/* GET SHIFT BY ID */
router.get(
  "/:id",
  verifyToken,
  getShiftById
);


/* UPDATE SHIFT */

router.put(
  "/:id",
  verifyToken,
  authorizeRoles("SUPER_ADMIN", "ADMIN"),
  updateShift
);


/* DELETE SHIFT */

router.delete(
  "/:id",
  verifyToken,
  authorizeRoles("SUPER_ADMIN", "ADMIN"),
  deleteShift
);

module.exports = router;