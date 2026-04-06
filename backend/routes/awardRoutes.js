const express = require("express");
const router = express.Router();

const {
  addAward,
  getAwards,
  deleteAward,
  updateAward
} = require("../controllers/awardController");

const upload = require("../middleware/uploadAward");
const { verifyToken, authorizeRoles } = require("../middleware/authMiddleware");


/* ================= GET ================= */

router.get(
  "/",
  verifyToken,
  getAwards
);


/* ================= ADD ================= */

router.post(
  "/add",
  verifyToken,
  authorizeRoles("SUPER_ADMIN", "ADMIN"),
  upload.single("typeFile"),
  addAward
);


/* ================= DELETE ================= */

router.delete(
  "/:id",
  verifyToken,
  authorizeRoles("SUPER_ADMIN", "ADMIN"),
  deleteAward
);

router.put(
  "/update/:id",
  verifyToken,
  authorizeRoles("SUPER_ADMIN", "ADMIN"),
  upload.single("typeFile"),
  updateAward
);                  

module.exports = router;