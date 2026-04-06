const express = require("express");
const router = express.Router();

const {
  addAppreciation,
  deleteAppreciation,
  getAppreciations,
  updateAppreciation,
  getAppreciationById
} = require("../controllers/appreciationController");

const { verifyToken, authorizeRoles } = require("../middleware/authMiddleware");

/* ADD */
router.post(
  "/add",
  verifyToken,
  authorizeRoles("SUPER_ADMIN", "ADMIN"),
  addAppreciation
);

/* GET ALL */
router.get(
  "/",
  verifyToken,
  getAppreciations
);

/* GET BY ID */
router.get(
  "/:id",
  verifyToken,
  getAppreciationById
);

/* DELETE */
router.delete(
  "/:id",
  verifyToken,
  authorizeRoles("SUPER_ADMIN", "ADMIN"),
  deleteAppreciation
);

/* UPDATE */
router.put(
  "/update/:id",
  verifyToken,
  authorizeRoles("SUPER_ADMIN", "ADMIN"),
  updateAppreciation
);

module.exports = router;