const db = require("../config/db");
const { addActivity } = require("./activityController");

exports.createWarning = (req, res) => {
  const { employee, title, category, date, description } = req.body;

  const evidenceFile = req.file ? req.file.filename : null;

  const sql = `
    INSERT INTO employee_warnings
    (employee, title, category, warning_date, description, evidence_file, issued_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      employee,
      title,
      category,
      date,
      description,
      evidenceFile,
      req.user.id,
    ],
    (err, result) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ message: "Database error" });
      }

      res.status(201).json({
        message: "Warning issued successfully",
      });

      addActivity('WARNING', `New warning issued to <b>${employee}</b>: ${title}`, '#ef4444');
    }
  );
};