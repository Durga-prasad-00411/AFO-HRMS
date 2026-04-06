const express = require("express");
const router = express.Router();
const departmentController = require("../controllers/departmentController");


router.post("/create", departmentController.createDepartment);


// READ ALL
router.get("/", departmentController.getAllDepartments);

// READ SINGLE
router.get("/:id", departmentController.getDepartmentById);

// UPDATE
router.put("/:id", departmentController.updateDepartment);
router.put("/update/:id", departmentController.updateDepartment);

// DELETE
router.delete("/:id", departmentController.deleteDepartment);


module.exports = router;
