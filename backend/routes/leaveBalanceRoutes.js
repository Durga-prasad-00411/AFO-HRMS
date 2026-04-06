const express = require("express");
const router = express.Router();
const { verifyToken, authorizeRoles } = require("../middleware/authMiddleware");
const { getLeaveBalances, getEmployeeLeaveBalances, getAllLeaveBalances } = require("../controllers/leaveBalanceController");

router.get("/my-balances", verifyToken, getLeaveBalances);
router.get("/all-balances", verifyToken, authorizeRoles("SUPER_ADMIN", "ADMIN", "HR"), getAllLeaveBalances);
router.get("/employee/:employeeId", verifyToken, authorizeRoles("SUPER_ADMIN", "ADMIN", "HR", "MANAGER", "TL"), getEmployeeLeaveBalances);

module.exports = router;
