const db = require("../config/db");
const { addActivity } = require("./activityController");


// ADD HOLIDAY
exports.addHoliday = async (req, res) => {
  try {

    console.log("REQUEST BODY:", req.body);
    let { title, holiday_date, description, holiday_type } = req.body;

    if (!title || !holiday_date) {
      return res.status(400).json({
        message: "Title and Date required"
      });
    }

    // convert to DB format
    if (holiday_type === "Full Day") holiday_type = "FULL_DAY";
    if (holiday_type === "Half Day") holiday_type = "HALF_DAY";

    const sql = `
      INSERT INTO holidays
      (title, holiday_date, description, holiday_type)
      VALUES (?, ?, ?, ?)
    `;

    await db.query(sql, [
      title,
      holiday_date,
      description || null,
      holiday_type || "FULL_DAY"
    ]);

    await addActivity('HOLIDAY', `New holiday added: <b>${title}</b>`, '#ec4899');

    res.status(201).json({
      message: "Holiday added successfully"
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


// GET HOLIDAYS
exports.getHolidays = async (req, res) => {
  try {

    const [rows] = await db.query(`
      SELECT
        id,
        title,
        holiday_date,
        holiday_type,
        description,
        created_at,
        updated_at
      FROM holidays
      ORDER BY holiday_date ASC
    `);

    res.json(rows);

  } catch (error) {

    console.error("GET HOLIDAYS ERROR:", error);

    res.status(500).json({
      message: "Server error"
    });

  }
};


// UPDATE HOLIDAY
exports.updateHoliday = async (req, res) => {
  try {
    const { id } = req.params;
    let { title, holiday_date, description, holiday_type } = req.body;

    if (holiday_type === "Full Day") holiday_type = "FULL_DAY";
    if (holiday_type === "Half Day") holiday_type = "HALF_DAY";

    await db.query(
      "UPDATE holidays SET title = ?, holiday_date = ?, description = ?, holiday_type = ? WHERE id = ?",
      [title, holiday_date, description || null, holiday_type || "FULL_DAY", id]
    );

    await addActivity('HOLIDAY', `Holiday updated: <b>${title}</b>`, '#f59e0b');

    res.json({ message: "Holiday updated successfully" });
  } catch (error) {
    console.error("UPDATE HOLIDAY ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// GET HOLIDAY BY ID
exports.getHolidayById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query("SELECT * FROM holidays WHERE id = ?", [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: "Holiday not found" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("GET HOLIDAY ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE HOLIDAY
exports.deleteHoliday = async (req, res) => {
  try {

    const { id } = req.params;

    await db.query(
      "DELETE FROM holidays WHERE id = ?",
      [id]
    );

    res.json({
      message: "Holiday deleted"
    });

  } catch (error) {

    console.error("DELETE HOLIDAY ERROR:", error);

    res.status(500).json({
      message: "Server error"
    });

  }
};