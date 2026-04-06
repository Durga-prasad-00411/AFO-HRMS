const db = require("../config/db");
const { addActivity } = require("./activityController");
const TERMINATION_TABLE = "employee_terminations";

const ensureTerminationTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS ${TERMINATION_TABLE} (
      id INT NOT NULL AUTO_INCREMENT,
      employee_id INT NOT NULL,
      employee_name VARCHAR(255) NOT NULL,
      department VARCHAR(255) NULL,
      designation VARCHAR(255) NULL,
      notice_date DATE NOT NULL,
      notice_period INT NULL,
      last_working_day DATE NULL,
      termination_type VARCHAR(255) NOT NULL,
      reason TEXT NOT NULL,
      remarks TEXT NULL,
      rehire_eligible VARCHAR(50) NULL,
      status VARCHAR(50) DEFAULT 'Terminated',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    )
  `);
};

const getTerminationColumns = async () => {
  const [rows] = await db.query(`SHOW COLUMNS FROM ${TERMINATION_TABLE}`);
  return new Set(rows.map((row) => row.Field));
};

const pickColumn = (columns, aliases) => aliases.find((name) => columns.has(name));

/* =======================================================
   ADD TERMINATION CONTROLLER
======================================================= */

const addTermination = async (req, res) => {
  try {
    await ensureTerminationTable();

    const {
      employeeId,
      employeeName,
      department,
      designation,
      noticeDate,
      noticePeriod,
      lastWorkingDay,
      terminationType,
      reason,
      remarks,
      rehireEligible,
      status,
    } = req.body;

    // Required validation
    if (!employeeId || !noticeDate || !terminationType || !reason) {
      return res.status(400).json({
        message: "Please fill all required fields",
      });
    }

    const columns = await getTerminationColumns();
    const fieldMap = [
      { aliases: ["employee_id", "employee"], value: employeeId },
      { aliases: ["employee_name", "name"], value: employeeName || "N/A" },
      { aliases: ["department"], value: department || null },
      { aliases: ["designation"], value: designation || null },
      { aliases: ["notice_date", "date"], value: noticeDate },
      {
        aliases: ["notice_period", "notice_days"],
        value: noticePeriod === "" || noticePeriod == null ? null : Number(noticePeriod),
      },
      { aliases: ["last_working_day"], value: lastWorkingDay || null },
      { aliases: ["termination_type", "type", "title"], value: terminationType },
      { aliases: ["reason", "description"], value: reason },
      { aliases: ["remarks", "comment"], value: remarks || null },
      { aliases: ["rehire_eligible", "rehire"], value: rehireEligible || null },
      { aliases: ["status"], value: status || "Terminated" },
    ];

    const insertColumns = [];
    const insertValues = [];

    for (const field of fieldMap) {
      const column = pickColumn(columns, field.aliases);
      if (!column) continue;
      insertColumns.push(column);
      insertValues.push(field.value);
    }

    if (!insertColumns.length) {
      throw new Error("No compatible columns found in employee_terminations table");
    }

    const placeholders = insertColumns.map(() => "?").join(", ");
    const sql = `
      INSERT INTO ${TERMINATION_TABLE} (${insertColumns.join(", ")})
      VALUES (${placeholders})
    `;

    await db.query(sql, insertValues);

    res.status(201).json({
      success: true,
      message: "Employee terminated successfully",
    });

    await addActivity('TERMINATION', `Employee terminated: <b>${employeeName}</b>`, '#ef4444');

  } catch (error) {
    console.log("Termination Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const getTerminations = async (req, res) => {
  try {
    await ensureTerminationTable();
    const columns = await getTerminationColumns();

    const idColumn = pickColumn(columns, ["id", "termination_id"]) || "id";
    const orderColumn =
      pickColumn(columns, ["created_at", "notice_date", "date", idColumn]) || idColumn;

    const [rows] = await db.query(
      `SELECT * FROM ${TERMINATION_TABLE} ORDER BY ${orderColumn} DESC, ${idColumn} DESC`
    );

    const normalizedRows = rows.map((row) => ({
      id: row.id ?? row.termination_id ?? null,
      employeeId: row.employee_id ?? row.employee ?? null,
      employeeName: row.employee_name ?? row.name ?? null,
      department: row.department ?? null,
      designation: row.designation ?? null,
      noticeDate: row.notice_date ?? row.date ?? null,
      noticePeriod: row.notice_period ?? row.notice_days ?? null,
      lastWorkingDay: row.last_working_day ?? null,
      terminationType: row.termination_type ?? row.type ?? row.title ?? null,
      reason: row.reason ?? row.description ?? null,
      remarks: row.remarks ?? row.comment ?? null,
      rehireEligible: row.rehire_eligible ?? row.rehire ?? null,
      status: row.status ?? "Terminated",
    }));

    res.json(normalizedRows);
  } catch (error) {
    console.log("Get Terminations Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const updateTermination = async (req, res) => {
  try {
    await ensureTerminationTable();

    const id = req.params.id;
    const {
      employeeId,
      employeeName,
      department,
      designation,
      noticeDate,
      noticePeriod,
      lastWorkingDay,
      terminationType,
      reason,
      remarks,
      rehireEligible,
      status,
    } = req.body;

    if (!id) {
      return res.status(400).json({ message: "Termination ID is required" });
    }

    const columns = await getTerminationColumns();
    const idColumn = pickColumn(columns, ["id", "termination_id"]) || "id";

    const fieldMap = [
      { aliases: ["employee_id", "employee"], value: employeeId },
      { aliases: ["employee_name", "name"], value: employeeName },
      { aliases: ["department"], value: department },
      { aliases: ["designation"], value: designation },
      { aliases: ["notice_date", "date"], value: noticeDate },
      {
        aliases: ["notice_period", "notice_days"],
        value: noticePeriod === "" || noticePeriod == null ? null : Number(noticePeriod),
      },
      { aliases: ["last_working_day"], value: lastWorkingDay || null },
      { aliases: ["termination_type", "type", "title"], value: terminationType },
      { aliases: ["reason", "description"], value: reason },
      { aliases: ["remarks", "comment"], value: remarks || null },
      { aliases: ["rehire_eligible", "rehire"], value: rehireEligible || null },
      { aliases: ["status"], value: status || "Terminated" },
    ];

    const setParts = [];
    const values = [];

    for (const field of fieldMap) {
      if (field.value === undefined) continue;
      const column = pickColumn(columns, field.aliases);
      if (!column) continue;
      setParts.push(`${column} = ?`);
      values.push(field.value);
    }

    if (!setParts.length) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    values.push(id);

    const sql = `
      UPDATE ${TERMINATION_TABLE}
      SET ${setParts.join(", ")}
      WHERE ${idColumn} = ?
    `;

    const [result] = await db.query(sql, values);

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Termination not found" });
    }

    return res.json({ success: true, message: "Termination updated successfully" });
  } catch (error) {
    console.log("Update Termination Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const deleteTermination = async (req, res) => {
  try {
    await ensureTerminationTable();

    const id = req.params.id;
    const columns = await getTerminationColumns();
    const idColumn = pickColumn(columns, ["id", "termination_id"]) || "id";

    const [result] = await db.query(
      `DELETE FROM ${TERMINATION_TABLE} WHERE ${idColumn} = ?`,
      [id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Termination not found" });
    }

    return res.json({ success: true, message: "Termination deleted successfully" });
  } catch (error) {
    console.log("Delete Termination Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { addTermination, getTerminations, updateTermination, deleteTermination };
