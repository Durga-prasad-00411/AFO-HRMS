const db = require("../config/db");
const { addActivity } = require("./activityController");

const COMPLAINTS_TABLE = "complaints";

const ensureComplaintsTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS ${COMPLAINTS_TABLE} (
      id INT NOT NULL AUTO_INCREMENT,
      from_employee VARCHAR(255) NOT NULL,
      against_employee VARCHAR(255) NOT NULL,
      complaint_date DATE NOT NULL,
      category VARCHAR(255) NOT NULL,
      subject VARCHAR(255) NULL,
      description TEXT NOT NULL,
      priority VARCHAR(50) DEFAULT 'Normal',
      status VARCHAR(50) DEFAULT 'Pending',
      admin_remarks TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    )
  `);
};

const getComplaintColumns = async () => {
  await ensureComplaintsTable();
  const [rows] = await db.query(`SHOW COLUMNS FROM ${COMPLAINTS_TABLE}`);
  return new Set(rows.map((row) => row.Field));
};

const pickFirstExistingColumn = (columns, candidates, fallback) => {
  for (const name of candidates) {
    if (columns.has(name)) return name;
  }
  return fallback;
};

/* ================= CREATE ================= */
exports.createComplaint = async (req, res) => {

  try {
    const {
      fromEmployee,
      againstEmployee,
      complaintDate,
      category,
      subject,
      description,
      priority,
      status,
      adminRemarks,
    } = req.body;

    if (
      !fromEmployee ||
      !againstEmployee ||
      !complaintDate ||
      !category ||
      !description
    ) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    const columns = await getComplaintColumns();

    const fromColumn = pickFirstExistingColumn(
      columns,
      ["from_employee", "employee_from", "from_emp", "employee"],
      null
    );
    const againstColumn = pickFirstExistingColumn(
      columns,
      ["against_employee", "employee_against", "against_emp", "against"],
      null
    );
    const dateColumn = pickFirstExistingColumn(columns, ["complaint_date", "date"], null);
    const categoryColumn = pickFirstExistingColumn(columns, ["category", "type"], null);
    const subjectColumn = pickFirstExistingColumn(columns, ["subject", "title"], null);
    const descriptionColumn = pickFirstExistingColumn(
      columns,
      ["description", "details", "reason"],
      null
    );
    const remarksColumn = pickFirstExistingColumn(
      columns,
      ["admin_remarks", "remarks"],
      null
    );

    if (!fromColumn || !againstColumn || !dateColumn || !categoryColumn || !descriptionColumn) {
      return res.status(500).json({
        message: "Complaints table is missing required columns",
      });
    }

    const insertColumns = [fromColumn, againstColumn, dateColumn, categoryColumn, descriptionColumn];
    const insertValues = [fromEmployee, againstEmployee, complaintDate, category, description];

    if (subjectColumn) {
      insertColumns.push(subjectColumn);
      insertValues.push(subject || null);
    }

    if (columns.has("priority")) {
      insertColumns.push("priority");
      insertValues.push(priority || "Normal");
    }

    if (columns.has("status")) {
      insertColumns.push("status");
      insertValues.push(status || "Pending");
    }

    if (remarksColumn) {
      insertColumns.push(remarksColumn);
      insertValues.push(adminRemarks || null);
    }

    const placeholders = insertColumns.map(() => "?").join(", ");
    const sql = `
    INSERT INTO ${COMPLAINTS_TABLE}
    (${insertColumns.join(", ")})
    VALUES (${placeholders})
  `;

    const [result] = await db.execute(sql,
      insertValues);

    res.status(201).json({
      success: true,
      message: "Complaint created successfully",
      id: result.insertId
    });

    await addActivity('COMPLAINT', `New complaint filed by <b>${fromEmployee}</b>`, '#ef4444');
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};
/* ================= GET ALL ================= */
exports.getAllComplaints = async (req, res) => {
  try {
    const columns = await getComplaintColumns();
    const idColumn = pickFirstExistingColumn(columns, ["id", "complaint_id"], "id");
    const dateColumn = pickFirstExistingColumn(columns, ["complaint_date", "date"], null);
    const orderColumn = pickFirstExistingColumn(columns, ["created_at", dateColumn, idColumn], idColumn);

    const [rows] = await db.execute(
      `SELECT * FROM ${COMPLAINTS_TABLE} ORDER BY ${orderColumn} DESC, ${idColumn} DESC`
    );

    const normalizedRows = rows.map((row) => ({
      id: row.id ?? row.complaint_id ?? null,
      from_employee: row.from_employee || row.employee_from || row.from_emp || row.employee || null,
      against_employee:
        row.against_employee || row.employee_against || row.against_emp || row.against || null,
      category: row.category || row.type || null,
      subject: row.subject || row.title || null,
      description: row.description || row.details || row.reason || null,
      priority: row.priority || null,
      status: row.status || null,
      complaint_date: row.complaint_date || row.date || null,
      admin_remarks: row.admin_remarks || row.remarks || null,
    }));

    res.json(normalizedRows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};

/* ================= UPDATE ================= */
exports.updateComplaint = async (req, res) => {
  try {
    const {
      fromEmployee,
      againstEmployee,
      complaintDate,
      category,
      subject,
      description,
      priority,
      status,
      adminRemarks,
    } = req.body;
    const id = req.params.id;
    const columns = await getComplaintColumns();
    const idColumn = pickFirstExistingColumn(columns, ["id", "complaint_id"], "id");
    const fromColumn = pickFirstExistingColumn(
      columns,
      ["from_employee", "employee_from", "from_emp", "employee"],
      null
    );
    const againstColumn = pickFirstExistingColumn(
      columns,
      ["against_employee", "employee_against", "against_emp", "against"],
      null
    );
    const dateColumn = pickFirstExistingColumn(columns, ["complaint_date", "date"], null);
    const categoryColumn = pickFirstExistingColumn(columns, ["category", "type"], null);
    const subjectColumn = pickFirstExistingColumn(columns, ["subject", "title"], null);
    const descriptionColumn = pickFirstExistingColumn(
      columns,
      ["description", "details", "reason"],
      null
    );
    const remarksColumn = pickFirstExistingColumn(
      columns,
      ["admin_remarks", "remarks"],
      "admin_remarks"
    );

    const setParts = [];
    const values = [];

    if (fromColumn && fromEmployee !== undefined) {
      setParts.push(`${fromColumn} = ?`);
      values.push(fromEmployee || "");
    }

    if (againstColumn && againstEmployee !== undefined) {
      setParts.push(`${againstColumn} = ?`);
      values.push(againstEmployee || "");
    }

    if (dateColumn && complaintDate !== undefined) {
      setParts.push(`${dateColumn} = ?`);
      values.push(complaintDate || null);
    }

    if (categoryColumn && category !== undefined) {
      setParts.push(`${categoryColumn} = ?`);
      values.push(category || "");
    }

    if (subjectColumn && subject !== undefined) {
      setParts.push(`${subjectColumn} = ?`);
      values.push(subject || null);
    }

    if (descriptionColumn && description !== undefined) {
      setParts.push(`${descriptionColumn} = ?`);
      values.push(description || "");
    }

    if (columns.has("priority") && priority !== undefined) {
      setParts.push("priority = ?");
      values.push(priority || "Normal");
    }

    if (columns.has("status") && status !== undefined) {
      setParts.push("status = ?");
      values.push(status || "Pending");
    }

    if (columns.has(remarksColumn) && adminRemarks !== undefined) {
      setParts.push(`${remarksColumn} = ?`);
      values.push(adminRemarks || null);
    }

    if (!setParts.length) {
      return res.status(400).json({ message: "No updatable complaint fields found in table" });
    }

    values.push(id);

    await db.query(
      `UPDATE ${COMPLAINTS_TABLE} SET ${setParts.join(", ")} WHERE ${idColumn} = ?`,
      values
    );

    res.json({ message: "Complaint updated successfully" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

/* ================= DELETE ================= */
exports.deleteComplaint = async (req, res) => {
  try {
    const id = req.params.id;
    const columns = await getComplaintColumns();
    const idColumn = pickFirstExistingColumn(columns, ["id", "complaint_id"], "id");

    await db.query(`DELETE FROM ${COMPLAINTS_TABLE} WHERE ${idColumn} = ?`, [id]);
    res.json({ message: "Complaint deleted successfully" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
