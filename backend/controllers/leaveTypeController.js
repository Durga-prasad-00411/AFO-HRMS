const db = require("../config/db");

exports.addLeaveType = async (req, res) => {
  try {
    const { leaveName, leaveType, description, maxDays, status, monthlyAccrual, carryForward } = req.body;
    const [existing] = await db.execute("SELECT id FROM leave_types WHERE leave_name = ?", [leaveName.trim()]);
    if (existing.length > 0) return res.status(400).json({ message: "Leave Type already exists" });

    const sql = `INSERT INTO leave_types (leave_name, leave_type, description, max_days, status, monthly_accrual, carry_forward) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    const [result] = await db.execute(sql, [leaveName.trim(), leaveType, description || null, maxDays || 0, status || "Active", monthlyAccrual || 0, carryForward ? 1 : 0]);
    res.status(201).json({ message: "Leave Type Added Successfully", id: result.insertId });
  } catch (error) { res.status(500).json({ message: "Server Error" }); }
};

exports.getLeaveTypes = async (req, res) => {
  try {
    const [rows] = await db.execute(`SELECT id, leave_name AS name, leave_type AS type, description, max_days AS maxDays, status, monthly_accrual AS monthlyAccrual, carry_forward AS carryForward FROM leave_types ORDER BY id ASC`);
    res.status(200).json(rows);
  } catch (error) { res.status(500).json({ message: "Server Error" }); }
};

exports.getLeaveTypeById = async (req, res) => {
    try {
        const [rows] = await db.execute(`SELECT id, leave_name AS name, leave_type AS type, description, max_days AS maxDays, status, monthly_accrual AS monthlyAccrual, carry_forward AS carryForward FROM leave_types WHERE id = ?`, [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ message: "Leave Type not found" });
        res.status(200).json(rows[0]);
    } catch (error) { res.status(500).json({ message: "Server Error" }); }
};

exports.updateLeaveType = async (req, res) => {
  try {
    const { id } = req.params;
    const { leaveName, leaveType, description, maxDays, status, monthlyAccrual, carryForward } = req.body;
    await db.execute(`UPDATE leave_types SET leave_name = ?, leave_type = ?, description = ?, max_days = ?, status = ?, monthly_accrual = ?, carry_forward = ? WHERE id = ?`, 
    [leaveName.trim(), leaveType, description || null, maxDays || 0, status || "Active", monthlyAccrual || 0, carryForward ? 1 : 0, id]);
    res.status(200).json({ message: "Leave Type updated" });
  } catch (error) { res.status(500).json({ message: "Server Error" }); }
};

exports.deleteLeaveType = async (req, res) => {
    try {
        const { id } = req.params;
        await db.execute("DELETE FROM leave_types WHERE id = ?", [id]);
        res.status(200).json({ message: "Leave Type deleted" });
    } catch (error) { res.status(500).json({ message: "Server Error" }); }
};