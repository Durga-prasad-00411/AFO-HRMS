const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/complaintmiddleware");
const complaintController = require("../controllers/complaintController");

router.post("/add", verifyToken, complaintController.createComplaint);
router.get("/", verifyToken, complaintController.getAllComplaints);
router.put("/:id", verifyToken, complaintController.updateComplaint);
router.delete("/:id", verifyToken, complaintController.deleteComplaint);

module.exports = router;