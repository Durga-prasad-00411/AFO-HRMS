const express = require("express");
const router = express.Router();
const { verifyToken, authorizeRoles } = require("../middleware/authMiddleware");
const { applyLeave, getLeaves, updateLeaveStatus, toggleCasualLeaveCarryForward } = require("../controllers/leaveController");

router.post("/apply", verifyToken, applyLeave);
router.get("/", verifyToken, getLeaves);
router.put("/:id/status", verifyToken, authorizeRoles("SUPER_ADMIN", "ADMIN", "HR", "MANAGER", "TL"), updateLeaveStatus);
router.post("/toggle-casual-carry-forward", verifyToken, authorizeRoles("SUPER_ADMIN"), toggleCasualLeaveCarryForward);

module.exports = router;
