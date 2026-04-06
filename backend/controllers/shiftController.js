const db = require("../config/db");

/* ================= ADD SHIFT ================= */

exports.addShift = async (req, res) => {
    try {
        const {
            shiftName,
            clockIn,
            clockOut,
            earlyClockIn,
            allowClockOutTill,
            lateMarkAfter,
            workModeId
        } = req.body;

        const sql = `
            INSERT INTO add_shifts 
            (shift_name, work_mode_id, clock_in, clock_out, early_clock_in, allow_clock_out, late_mark_after)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        await db.query(sql, [
            shiftName,
            workModeId || null,
            clockIn,
            clockOut,
            earlyClockIn,
            allowClockOutTill,
            lateMarkAfter
        ]);

        res.json({ message: "Shift added successfully" });
    } catch (err) {
        console.error("Add Shift Error:", err);
        res.status(500).json({ message: "Database error", error: err.message });
    }
};


/* ================= GET SHIFTS ================= */

exports.getShifts = async (req, res) => {
    try {
        const sql = `
            SELECT 
                s.id,
                s.shift_name,
                s.clock_in,
                s.clock_out,
                s.early_clock_in,
                s.allow_clock_out,
                s.late_mark_after,
                s.work_mode_id,
                wm.mode_name AS work_mode
            FROM add_shifts s
            LEFT JOIN work_modes wm 
            ON s.work_mode_id = wm.id
            ORDER BY s.id ASC;
        `;
        const [results] = await db.query(sql);
        res.json(results);
    } catch (err) {
        console.error("Get Shifts Error:", err);
        res.status(500).json({ message: err.message });
    }
};

/* ================= GET SHIFT BY ID ================= */

exports.getShiftById = async (req, res) => {
    try {
        const { id } = req.params;
        const sql = `
            SELECT 
                s.id,
                s.shift_name,
                s.clock_in,
                s.clock_out,
                s.early_clock_in,
                s.allow_clock_out,
                s.late_mark_after,
                s.work_mode_id,
                wm.mode_name AS work_mode
            FROM add_shifts s
            LEFT JOIN work_modes wm 
            ON s.work_mode_id = wm.id
            WHERE s.id = ?
        `;
        const [results] = await db.query(sql, [id]);
        if (results.length === 0) {
            return res.status(404).json({ message: "Shift not found" });
        }
        res.json(results[0]);
    } catch (err) {
        console.error("Get Shift By ID Error:", err);
        res.status(500).json({ message: err.message });
    }
};


/* ================= UPDATE SHIFT ================= */

exports.updateShift = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            shiftName,
            clockIn,
            clockOut,
            earlyClockIn,
            allowClockOutTill,
            lateMarkAfter,
            workModeId
        } = req.body;

        const sql = `
            UPDATE add_shifts SET
            shift_name = ?,
            work_mode_id = ?,
            clock_in = ?,
            clock_out = ?,
            early_clock_in = ?,
            allow_clock_out = ?,
            late_mark_after = ?
            WHERE id = ?
        `;

        await db.query(sql, [
            shiftName,
            workModeId || null,
            clockIn,
            clockOut,
            earlyClockIn,
            allowClockOutTill,
            lateMarkAfter,
            id
        ]);

        res.json({ message: "Shift updated successfully" });
    } catch (err) {
        console.error("Update Shift Error:", err);
        res.status(500).json({ message: err.message });
    }
};


/* ================= DELETE SHIFT ================= */

exports.deleteShift = async (req, res) => {
    try {
        const { id } = req.params;
        const sql = "DELETE FROM add_shifts WHERE id = ?";
        await db.query(sql, [id]);
        res.json({ message: "Shift deleted successfully" });
    } catch (err) {
        console.error("Delete Shift Error:", err);
        res.status(500).json({ message: err.message });
    }
};