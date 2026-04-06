const pool = require("../config/db");

// Get all performance reviews
exports.getAllReviews = async (req, res) => {
  try {
    const query = `
      SELECT pr.*, e.first_name AS employee_first_name, e.last_name AS employee_last_name, 
             e.employee_code, u.username AS reviewer_name, d.name AS department, r.role_name AS reviewer_role
      FROM performance_reviews pr
      JOIN employees e ON pr.employee_id = e.id
      JOIN users u ON pr.reviewer_id = u.id
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN departments d ON e.department_id = d.id
      ORDER BY pr.review_date DESC, pr.id DESC
    `;
    const [reviews] = await pool.query(query);
    res.status(200).json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch performance reviews" });
  }
};

// Get performance reviews for a specific employee (based on their user ID)
exports.getEmployeeReviews = async (req, res) => {
  try {
    const { userId } = req.params;
    const query = `
      SELECT pr.*, u.username AS reviewer_name, r.role_name AS reviewer_role
      FROM performance_reviews pr
      JOIN employees e ON pr.employee_id = e.id
      JOIN users u ON pr.reviewer_id = u.id
      JOIN roles r ON u.role_id = r.id
      WHERE e.user_id = ?
      ORDER BY pr.review_date DESC
    `;
    const [reviews] = await pool.query(query, [userId]);
    res.status(200).json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch employee performance reviews" });
  }
};

// Submit a new performance review
exports.submitReview = async (req, res) => {
  try {
    const { employee_id, reviewer_id, review_date, rating, feedback } = req.body;

    if (!employee_id || !reviewer_id || !review_date || !rating) {
      return res.status(400).json({ error: "Required fields are missing." });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5." });
    }

    const query = `
      INSERT INTO performance_reviews (employee_id, reviewer_id, review_date, rating, feedback, status)
      VALUES (?, ?, ?, ?, ?, 'SUBMITTED')
    `;

    const values = [employee_id, reviewer_id, review_date, rating, feedback || ""];
    
    await pool.query(query, values);
    
    try {
      const [empRes] = await pool.query("SELECT user_id FROM employees WHERE id = ?", [employee_id]);
      if (empRes.length > 0) {
        const { createNotification } = require("./notificationController");
        // For performance, we need to get the last inserted ID if we want to link it
        const [lastReview] = await pool.query("SELECT id FROM performance_reviews WHERE employee_id = ? AND reviewer_id = ? ORDER BY id DESC LIMIT 1", [employee_id, reviewer_id]);
        await createNotification(empRes[0].user_id, "New Performance Review", "A new performance review has been submitted for you.", 'PERFORMANCE_REVIEW', lastReview[0]?.id || null);
      }
    } catch (notifErr) {
      console.error("Non-fatal notification error:", notifErr);
    }
    
    res.status(201).json({ message: "Performance Review Submitted Successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to submit performance review" });
  }
};
