const express = require("express");
const router = express.Router();
const {
  addHoliday,
  getHolidays,
  deleteHoliday,
  getHolidayById,
  updateHoliday
} = require("../controllers/holidayController");


router.post("/", addHoliday);

router.get("/", getHolidays);


router.delete("/:id", deleteHoliday);
router.get("/:id", getHolidayById);
router.put("/:id", updateHoliday);

module.exports = router;