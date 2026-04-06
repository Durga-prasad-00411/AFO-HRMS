const express = require("express");
const router = express.Router();
const payrollController = require("../controllers/payrollController");

router.post("/generate", payrollController.generatePayroll);
router.get("/", payrollController.getAllPayrolls);
router.get("/employee/:userId", payrollController.getEmployeePayrolls);
router.put("/:id/status", payrollController.updatePayrollStatus);

module.exports = router;
