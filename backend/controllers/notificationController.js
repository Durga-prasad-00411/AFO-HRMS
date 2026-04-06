const pool = require("../config/db");

// Internal utility function to trigger a notification from other controllers
exports.createNotification = async (userId, title, message, type = null, relatedId = null) => {
  try {
    const query = `
      INSERT INTO notifications (user_id, title, message, type, related_id, is_read)
      VALUES (?, ?, ?, ?, ?, 0)
    `;
    await pool.query(query, [userId, title, message, type, relatedId]);
    return true;
  } catch (err) {
    console.error("Failed to create notification:", err);
    return false;
  }
};

// GET /api/notifications/:userId
exports.getNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const query = `
      SELECT * FROM notifications 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 100
    `;
    
    const [notifications] = await pool.query(query, [userId]);
    res.status(200).json(notifications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};

// PUT /api/notifications/:id/read
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `UPDATE notifications SET is_read = 1 WHERE id = ?`;
    await pool.query(query, [id]);
    
    res.status(200).json({ message: "Notification marked as read" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
};

// PUT /api/notifications/read-all/:userId
exports.markAllAsRead = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const query = `UPDATE notifications SET is_read = 1 WHERE user_id = ?`;
    await pool.query(query, [userId]);
    
    res.status(200).json({ message: "All notifications marked as read" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to mark all as read" });
  }
};
