const express = require("express");
const router = express.Router();
const upload = require("../middleware/uploadWarning");
const { verifyToken, authorizeRoles } = require("../middleware/authMiddleware");
const db = require("../config/db");
const WARNING_TABLE = "employee_warnings";

const ensureWarningsTable = async () => {
    await db.query(`
        CREATE TABLE IF NOT EXISTS ${WARNING_TABLE} (
            id INT NOT NULL AUTO_INCREMENT,
            employee VARCHAR(255) NOT NULL,
            title VARCHAR(255) NOT NULL,
            category VARCHAR(100) NOT NULL,
            warning_date DATE NOT NULL,
            description TEXT NOT NULL,
            evidence_file VARCHAR(255) NULL,
            issued_by INT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
        )
    `);
};

const normalizeWarning = (row) => ({
    ...row,
    id: row.id ?? row.warning_id ?? null,
    warning_id: row.warning_id ?? row.id ?? null,
    warning_date: row.warning_date ?? row.date ?? null,
});

const getWarningIdColumn = async () => {
    await ensureWarningsTable();
    const [idRows] = await db.query(`SHOW COLUMNS FROM ${WARNING_TABLE} LIKE 'id'`);
    if (idRows.length) return "id";

    const [warningIdRows] = await db.query(`SHOW COLUMNS FROM ${WARNING_TABLE} LIKE 'warning_id'`);
    if (warningIdRows.length) return "warning_id";

    return "id";
};

const getWarningDateColumn = async () => {
    await ensureWarningsTable();
    const [warningDateRows] = await db.query(
        `SHOW COLUMNS FROM ${WARNING_TABLE} LIKE 'warning_date'`
    );
    if (warningDateRows.length) return "warning_date";

    const [dateRows] = await db.query(`SHOW COLUMNS FROM ${WARNING_TABLE} LIKE 'date'`);
    if (dateRows.length) return "date";

    return "warning_date";
};

const getWarnings = async (req, res) => {
    try {
        await ensureWarningsTable();
        const idColumn = await getWarningIdColumn();
        const dateColumn = await getWarningDateColumn();
        const [rows] = await db.query(
            `SELECT *
             FROM ${WARNING_TABLE}
             ORDER BY ${dateColumn} DESC, ${idColumn} DESC`
        );

        res.status(200).json({ data: rows.map(normalizeWarning) });
    } catch (err) {
        console.log("WARNING LIST ERROR:", err);
        res.status(500).json({ message: "Failed to fetch warnings" });
    }
};

const createWarning = async (req, res) => {
    try {
        await ensureWarningsTable();
        const { employee, title, category, description } = req.body;
        const warningDate = req.body.warning_date || req.body.date;
        const dateColumn = await getWarningDateColumn();

        if (!employee || !title || !category || !warningDate || !description) {
            return res.status(400).json({ message: "All required fields must be filled." });
        }

        const evidence = req.file ? req.file.filename : null;
        const issuedBy = req.user?.id ?? req.user?.user_id ?? req.user?.userId ?? null;

        if (!issuedBy) {
            return res.status(401).json({ message: "Invalid user session. Please login again." });
        }

        try {
            await db.query(
                `INSERT INTO ${WARNING_TABLE} 
        (employee, title, category, ${dateColumn}, description, evidence_file, issued_by)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    employee,
                    title,
                    category,
                    warningDate,
                    description,
                    evidence,
                    issuedBy,
                ]
            );
        } catch (err) {
            // Backward compatibility for schemas without issued_by column.
            if (err.code === "ER_BAD_FIELD_ERROR" && String(err.sqlMessage).includes("issued_by")) {
                await db.query(
                    `INSERT INTO ${WARNING_TABLE} 
          (employee, title, category, ${dateColumn}, description, evidence_file)
          VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                        employee,
                        title,
                        category,
                        warningDate,
                        description,
                        evidence,
                    ]
                );
            } else {
                throw err;
            }
        }

        res.status(201).json({ message: "Warning issued successfully" });
    } catch (err) {
        console.log("WARNING ERROR:", err);
        res.status(500).json({ message: "Failed to issue warning" });
    }
};

router.get("/", verifyToken, authorizeRoles("SUPER_ADMIN", "ADMIN", "HR"), getWarnings);
router.get("/warnings", verifyToken, authorizeRoles("SUPER_ADMIN", "ADMIN", "HR"), getWarnings);

router.post("/", verifyToken, upload.single("evidence"), createWarning);
router.post("/add", verifyToken, upload.single("evidence"), createWarning);

router.put(
    "/:id",
    verifyToken,
    upload.single("evidence"),
    async (req, res) => {
        try {
            await ensureWarningsTable();
            const { id } = req.params;
            const { employee, title, category, description } = req.body;
            const warningDate = req.body.warning_date || req.body.date;
            const evidence = req.file ? req.file.filename : null;
            const idColumn = await getWarningIdColumn();
            const dateColumn = await getWarningDateColumn();

            if (!employee || !title || !category || !warningDate || !description) {
                return res.status(400).json({ message: "All required fields must be filled." });
            }

            const [existingRows] = await db.query(
                `SELECT evidence_file FROM ${WARNING_TABLE} WHERE ${idColumn} = ?`,
                [id]
            );

            if (!existingRows.length) {
                return res.status(404).json({ message: "Warning not found" });
            }

            const evidenceFile = evidence || existingRows[0].evidence_file;

            await db.query(
                `UPDATE ${WARNING_TABLE}
                 SET employee = ?, title = ?, category = ?, ${dateColumn} = ?, description = ?, evidence_file = ?
                 WHERE ${idColumn} = ?`,
                [employee, title, category, warningDate, description, evidenceFile, id]
            );

            res.status(200).json({ message: "Warning updated successfully" });
        } catch (err) {
            console.log("WARNING UPDATE ERROR:", err);
            res.status(500).json({ message: "Failed to update warning" });
        }
    }
);

router.delete("/:id", verifyToken, async (req, res) => {
    try {
        await ensureWarningsTable();
        const { id } = req.params;
        const idColumn = await getWarningIdColumn();
        const [result] = await db.query(`DELETE FROM ${WARNING_TABLE} WHERE ${idColumn} = ?`, [id]);

        if (!result.affectedRows) {
            return res.status(404).json({ message: "Warning not found" });
        }

        res.status(200).json({ message: "Warning deleted successfully" });
    } catch (err) {
        console.log("WARNING DELETE ERROR:", err);
        res.status(500).json({ message: "Failed to delete warning" });
    }
});

module.exports = router;
