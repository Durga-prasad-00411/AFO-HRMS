const express = require("express");
const router = express.Router();
const upload = require("../middleware/uploadMiddleware");
const {
  addEmployee,
  getAllEmployees,
  updateEmployee,
  updateEmployeeStatus,
  deleteEmployee,
  getEmployeeById
} = require("../controllers/employeeController");

/* names MUST match React form */
router.post(
  "/add",
  upload.fields([
    { name: "profile_photo", maxCount: 1 },
    { name: "aadhaar_photo", maxCount: 1 },
    { name: "pan_photo", maxCount: 1 },
  ]),
  addEmployee
);

router.get("/", getAllEmployees);
router.get("/:id", getEmployeeById);
router.put(
  "/:id",
  upload.fields([
    { name: "profile_photo", maxCount: 1 },
    { name: "aadhaar_photo", maxCount: 1 },
    { name: "pan_photo", maxCount: 1 },
  ]),
  updateEmployee
);
router.put("/:id/status", updateEmployeeStatus);
router.delete("/:id", deleteEmployee);

module.exports = router;
