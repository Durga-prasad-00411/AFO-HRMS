const db = require("../config/db");
const { addActivity } = require("./activityController");

exports.addAward = async (req, res) => {
  try {
    const { awardTitle, awardType, typeDescription } = req.body;
    const filePath = req.file ? `/uploads/${req.file.filename}` : null;

    const sql = `
      INSERT INTO awards
      (award_title, award_type, description, file_path)
      VALUES (?, ?, ?, ?)
    `;

    await db.query(sql, [awardTitle, awardType, typeDescription, filePath]);

    res.json({ message: "Award added successfully" });
    await addActivity('AWARD', `New award added: <b>${awardTitle}</b>`, '#f59e0b');
  } catch (error) {
    console.error("Add Award Error:", error);
    res.status(500).json({ message: "Database error" });
  }
};

exports.getAwards = async (req, res) => {
  try {
    const sql = "SELECT * FROM awards ORDER BY id DESC";
    const [results] = await db.query(sql);
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
};


exports.deleteAward = async (req, res) => {
  try {
    const { id } = req.params;
    const sql = "DELETE FROM awards WHERE id=?";
    await db.query(sql, [id]);
    res.json({ message: "Award deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Delete failed" });
  }
};

exports.updateAward = async (req, res) => {
  try {
    const { id } = req.params;
    const { awardTitle, awardType, description } = req.body;
    const filePath = req.file ? `/uploads/${req.file.filename}` : null;

    let sql;
    let params;

    if (filePath) {
      sql = `
        UPDATE awards
        SET award_title = ?, award_type = ?, description = ?, file_path = ?
        WHERE id = ?
      `;
      params = [awardTitle, awardType, description, filePath, id];
    } else {
      sql = `
        UPDATE awards
        SET award_title = ?, award_type = ?, description = ?
        WHERE id = ?
      `;
      params = [awardTitle, awardType, description, id];
    }

    await db.query(sql, params);
    res.json({ message: "Award updated successfully" });
  } catch (error) {
    console.error("Update Award Error:", error);
    res.status(500).json({ message: "Database error" });
  }
};