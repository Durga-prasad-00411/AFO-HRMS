const express = require("express");
const router = express.Router();

const {
  addTermination,
  getTerminations,
  updateTermination,
  deleteTermination,
} = require("../controllers/terminationController");
const { verifyToken } = require("../middleware/authMiddleware");

router.get("/", verifyToken, getTerminations);
router.post("/", verifyToken, addTermination);
router.put("/:id", verifyToken, updateTermination);
router.delete("/:id", verifyToken, deleteTermination);

module.exports = router;
