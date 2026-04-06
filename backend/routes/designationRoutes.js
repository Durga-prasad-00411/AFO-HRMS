const express = require("express");
const router = express.Router();
const designationController = require("../controllers/designationController");

// CREATE
router.post("/", designationController.createDesignation);

// READ ALL
router.get("/", designationController.getAllDesignations);

// READ SINGLE
router.get("/:id", designationController.getDesignationById);

// UPDATE
router.put("/:id", designationController.updateDesignation);

// DELETE
router.delete("/:id", designationController.deleteDesignation);

module.exports = router;