const db = require("../config/db");
const { addActivity } = require("./activityController");

const formatPolicy = (row) => ({
  id: row.id,
  title: row.title,
  description: row.description,
  applicable_to: row.applicable_to,
  start_date: row.start_date,
  end_date: row.end_date,
  created_by_name: row.created_by_name,
  status: row.status,
  file_url: row.file_url,
  uploaded_by: row.uploaded_by,
  created_at: row.created_at
});

/* =====================================================
   ADD POLICY
===================================================== */
exports.addPolicy = async (req, res) => {
  try {
    const {
      title,
      description,
      applicableTo,
      startDate,
      endDate,
      createdBy,
      status
    } = req.body;

    if (!title || !description || !applicableTo || !startDate || !createdBy || !status) {
      return res.status(400).json({
        message: "All required fields must be filled"
      });
    }

    const fileUrl = req.file ? `/uploads/policies/${req.file.filename}` : null;

    const sql = `
      INSERT INTO company_policies
      (title, description, applicable_to, start_date, end_date, created_by_name, status, file_url, uploaded_by)
      VALUES (?,?,?,?,?,?,?,?,?)
    `;

    const [result] = await db.execute(sql, [
      title,
      description,
      applicableTo,
      startDate,
      endDate || null,
      createdBy,
      status,
      fileUrl,
      req.user?.id || createdBy || null
    ]);

    res.status(201).json({
      message: "Policy added successfully",
      policy: {
        id: result.insertId,
        title,
        description,
        applicable_to: applicableTo,
        start_date: startDate,
        end_date: endDate || null,
        created_by_name: createdBy,
        status,
        file_url: fileUrl
      }
    });
    await addActivity('POLICY', `New policy published: <b>${title}</b>`, '#06b6d4');
  } catch (err) {
    console.error("Add Policy Error:", err);
    return res.status(500).json({
      message: "Server error while adding policy"
    });
  }
};

/* =====================================================
   GET ALL POLICIES
===================================================== */
exports.getAllPolicies = async (req, res) => {
  try {
    const sql = "SELECT * FROM company_policies ORDER BY id DESC";
    const [rows] = await db.query(sql);

    res.status(200).json(rows.map(formatPolicy));
  } catch (err) {
    console.error("Fetch Policies Error:", err);
    return res.status(500).json({
      message: "Server error while fetching policies"
    });
  }
};

/* =====================================================
   GET SINGLE POLICY
===================================================== */
exports.getPolicyById = async (req, res) => {
  try {
    const { id } = req.params;
    const sql = "SELECT * FROM company_policies WHERE id = ?";
    const [rows] = await db.query(sql, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Policy not found" });
    }

    res.status(200).json(formatPolicy(rows[0]));
  } catch (err) {
    console.error("Fetch Policy Error:", err);
    return res.status(500).json({
      message: "Server error while fetching policy"
    });
  }
};

/* =====================================================
   UPDATE POLICY
===================================================== */
exports.updatePolicy = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, applicableTo, startDate, endDate, status } = req.body;

    if (!title || !description || !applicableTo || !startDate || !status) {
      return res.status(400).json({ message: "All required fields must be filled" });
    }

    const fileUrl = req.file ? `/uploads/policies/${req.file.filename}` : null;

    let sql = `
      UPDATE company_policies
      SET title = ?, description = ?, applicable_to = ?, start_date = ?, status = ?
    `;

    const params = [title, description, applicableTo, startDate, status];

    if (endDate) {
      sql += ", end_date = ?";
      params.push(endDate);
    } else {
      sql += ", end_date = NULL";
    }

    if (fileUrl) {
      sql += ", file_url = ?";
      params.push(fileUrl);
    }

    sql += " WHERE id = ?";
    params.push(id);

    const [result] = await db.query(sql, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Policy not found" });
    }

    res.status(200).json({
      message: "Policy updated successfully",
      policy: {
        id: Number(id),
        title,
        description,
        applicable_to: applicableTo,
        start_date: startDate,
        end_date: endDate || null,
        status,
        file_url: fileUrl || undefined
      }
    });
    await addActivity('POLICY', `Policy updated: <b>${title}</b>`, '#f59e0b');
  } catch (err) {
    console.error("Update Policy Error:", err);
    return res.status(500).json({ message: "Server error while updating policy" });
  }
};

/* =========================================
   DELETE POLICY
========================================= */
exports.deletePolicy = async (req, res) => {
  try {
    const { id } = req.params;

    await db.execute(
      "DELETE FROM company_policies WHERE id = ?",
      [id]
    );

    res.json({ message: "Policy deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Delete failed" });
  }
};
