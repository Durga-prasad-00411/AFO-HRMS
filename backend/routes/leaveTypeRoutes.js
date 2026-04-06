const express = require("express");
const router = express.Router();
const { addLeaveType, getLeaveTypes, deleteLeaveType, updateLeaveType, getLeaveTypeById } = require("../controllers/leaveTypeController");
const { verifyToken, authorizeRoles } = require("../middleware/authMiddleware");

router.get("/", verifyToken, getLeaveTypes);
router.get("/:id", verifyToken, getLeaveTypeById);
router.post("/", verifyToken, authorizeRoles("SUPER_ADMIN", "ADMIN"), addLeaveType);
router.put("/:id", verifyToken, authorizeRoles("SUPER_ADMIN", "ADMIN"), updateLeaveType);
router.delete("/:id", verifyToken, authorizeRoles("SUPER_ADMIN", "ADMIN"), deleteLeaveType);

module.exports = router;