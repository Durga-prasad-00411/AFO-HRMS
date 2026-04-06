const db = require('../config/db');

exports.addActivity = async (activity_type, activity_text, color) => {
    try {
        await db.query(
            "INSERT INTO recent_activities (activity_type, activity_text, color) VALUES (?, ?, ?)",
            [activity_type, activity_text, color || '#3b82f6']
        );
    } catch (error) {
        console.error("Failed to log activity:", error);
    }
};
