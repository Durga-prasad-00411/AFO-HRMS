const db = require("../config/db");
const { addActivity } = require("./activityController");


exports.addAppreciation = async (req, res) => {
  try {
    const {
      employeeName,
      employeeId,
      awardTitle,
      awardDate,
      awardType,
      awardPeriod,
      givenBy,
      description
    } = req.body;

    const sql = `
      INSERT INTO appreciations
      (employee_name, employee_id, award_title, award_date, award_type, award_period, given_by, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await db.query(sql, [
      employeeName,
      employeeId,
      awardTitle,
      awardDate,
      awardType,
      awardPeriod,
      givenBy,
      description || null
    ]);

    res.json({ message: "Appreciation added successfully" });
    await addActivity('APPRECIATION', `New appreciation for <b>${employeeName}</b>: ${awardTitle}`, '#10b981');
  } catch (err) {
    console.error("Add Appreciation Error: ", err);
    res.status(500).json({ error: err.message });
  }
};




exports.getAppreciations = async (req, res) => {
  try {
    const sql = "SELECT * FROM appreciations ORDER BY id DESC";
    const [results] = await db.query(sql);
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};



exports.getAppreciationById = async (req, res) => {
  try {
    const { id } = req.params;
    const sql = "SELECT * FROM appreciations WHERE id = ?";
    const [results] = await db.query(sql, [id]);
    if (results.length === 0) {
      return res.status(404).json({ message: "Appreciation not found" });
    }
    res.json(results[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};



exports.deleteAppreciation = async (req, res) => {
  try {
    const { id } = req.params;
    const sql = "DELETE FROM appreciations WHERE id=?";
    await db.query(sql, [id]);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateAppreciation = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      employeeName,
      employeeId,
      awardTitle,
      awardDate,
      awardType,
      awardPeriod,
      givenBy,
      description
    } = req.body;

    const sql = `
      UPDATE appreciations
      SET employee_name = ?, employee_id = ?, award_title = ?, award_date = ?, award_type = ?, award_period = ?, given_by = ?, description = ?
      WHERE id = ?
    `;

    await db.query(sql, [
      employeeName,
      employeeId,
      awardTitle,
      awardDate,
      awardType,
      awardPeriod,
      givenBy,
      description || null,
      id
    ]);

    res.json({ message: "Appreciation updated successfully" });
  } catch (err) {
    console.error("Update Appreciation Error: ", err);
    res.status(500).json({ error: err.message });
  }
};