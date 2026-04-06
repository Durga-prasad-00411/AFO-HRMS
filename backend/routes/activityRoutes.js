const db = require("../config/db");
const { addActivity } = require("../controllers/activityController");

const router = require("express").Router();

router.get("/", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM recent_activities ORDER BY created_at DESC LIMIT 50");
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
