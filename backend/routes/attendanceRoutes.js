const express = require("express");
const router = express.Router();
const attendanceController = require("../controllers/attendanceController");
const { verifyToken, authorizeRoles } = require("../middleware/authMiddleware");

router.post(
  "/manual",
  verifyToken,
  authorizeRoles("SUPER_ADMIN", "ADMIN"),
  attendanceController.addManualAttendance
);

router.post("/check-in", verifyToken, attendanceController.checkIn);
router.post("/check-out", verifyToken, attendanceController.checkOut);
router.get("/status", verifyToken, attendanceController.getAttendanceStatus);
router.get("/summary", verifyToken, authorizeRoles("SUPER_ADMIN", "ADMIN", "HR"), attendanceController.getAttendanceSummary);
router.get("/today", verifyToken, authorizeRoles("SUPER_ADMIN", "ADMIN", "HR"), attendanceController.getTodayCheckedInEmployees);
router.get("/monthly-summary", verifyToken, authorizeRoles("SUPER_ADMIN", "ADMIN", "HR"), attendanceController.getMonthlySummary);
router.get("/monthly-logs", verifyToken, authorizeRoles("SUPER_ADMIN", "ADMIN", "HR"), attendanceController.getMonthlyAttendanceLogs);
router.get("/grid", verifyToken, authorizeRoles("SUPER_ADMIN", "ADMIN", "HR"), attendanceController.getAttendanceSummaryGrid);

module.exports = router;