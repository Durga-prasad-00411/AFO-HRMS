const express = require("express");
const router = express.Router();
const performanceController = require("../controllers/performanceController");

router.post("/submit", performanceController.submitReview);
router.get("/", performanceController.getAllReviews);
router.get("/employee/:userId", performanceController.getEmployeeReviews);

module.exports = router;
