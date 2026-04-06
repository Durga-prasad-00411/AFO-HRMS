const db = require("../config/db");
const { addActivity } = require("./activityController");
const { createNotification } = require("./notificationController");

// Helper duplicates from balance controller for internal use
const getMonthsSinceJoining = (joiningDateStr) => {
  const joining = new Date(joiningDateStr);
  const now = new Date();
  let months = (now.getFullYear() - joining.getFullYear()) * 12 + (now.getMonth() - joining.getMonth());
  return Math.max(0, months);
};

const getCurrentMonthRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { start, end };
};

// Apply Leave
exports.applyLeave = async (req, res) => {
  try {
    const userId = req.user.id;
    const { start_date, end_date, leave_type, reason } = req.body;

    if (!start_date || !end_date || !leave_type) {
      return res.status(400).json({ message: "Start date, end date, and leave type are required." });
    }

    // 1. Get Employee Stats
    const [empRows] = await db.execute("SELECT first_name, last_name, reporting_to, joining_date FROM employees WHERE user_id = ?", [userId]);
    if (empRows.length === 0) return res.status(404).json({ message: "Employee profile not found" });
    const joiningDate = empRows[0].joining_date;

    // 2. Get Leave Type Config
    const [ltRows] = await db.execute(
      "SELECT leave_name, monthly_accrual, carry_forward, status FROM leave_types WHERE leave_name = ?",
      [leave_type]
    );

    if (ltRows.length === 0) return res.status(400).json({ message: "Invalid leave type." });
    const lt = ltRows[0];
    if (lt.status !== "Active") return res.status(400).json({ message: "This leave type is inactive." });

    // 3. Calculate requested days (default to DATEDIFF + 1 if duration not provided)
    let diffDays = 0;
    if (req.body.duration) {
      diffDays = parseFloat(req.body.duration);
    } else {
      const start = new Date(start_date);
      const end = new Date(end_date);
      diffDays = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1;
    }

    // 4. Calculate Current Balance using new Accrual Rules
    const totalMonths = getMonthsSinceJoining(joiningDate) + 1;
    let totalAccrued = 0;
    let usedDays = 0;

    if (lt.carry_forward) {
        totalAccrued = totalMonths * lt.monthly_accrual;
        const [usedRows] = await db.execute("SELECT duration FROM leave_requests WHERE user_id = ? AND UPPER(status) = 'APPROVED' AND leave_type = ?", [userId, leave_type]);
        usedRows.forEach(l => {
            usedDays += parseFloat(l.duration || 0);
        });
    } else {
        totalAccrued = lt.monthly_accrual;
        const { start: monthStart, end: monthEnd } = getCurrentMonthRange();
        const [usedRows] = await db.execute(
            `SELECT duration FROM leave_requests 
             WHERE user_id = ? AND UPPER(status) = 'APPROVED' AND leave_type = ?
             AND start_date >= ? AND end_date <= ?`,
            [userId, leave_type, monthStart, monthEnd]
        );
        usedRows.forEach(l => {
            usedDays += parseFloat(l.duration || 0);
        });
    }

    const remainingDays = parseFloat((totalAccrued - usedDays).toFixed(2));

    if (remainingDays < diffDays) {
      return res.status(400).json({
        message: `Insufficient balance for ${leave_type}. Required: ${diffDays}, Available: ${remainingDays}.`
      });
    }

    // 5. Apply
    const [result] = await db.execute(
      `INSERT INTO leave_requests (user_id, start_date, end_date, leave_type, duration, status, reason)
       VALUES (?, ?, ?, ?, ?, 'PENDING', ?)`,
      [userId, start_date, end_date, leave_type, diffDays, reason || ""]
    );

    // Call addActivity if activityController handles it, otherwise ignore
    try {
        await addActivity("LEAVE", `Leave application #${result.insertId} submitted for ${leave_type}`, "#f59e0b");
    } catch(err) { console.error("Could not add activity", err); }

    // --- SEND NOTIFICATIONS ---
    try {
        const title = "New Leave Request";
        const msg = `${empRows[0].first_name || 'Employee'} ${empRows[0].last_name || ''} applied for ${diffDays} day(s) of ${leave_type}.`;

        // Get Admins & SuperAdmins
        const [adminRows] = await db.execute(`
            SELECT u.id FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE r.role_name IN ('SUPER_ADMIN', 'ADMIN')
        `);

        const notified = new Set();
        for (const ad of adminRows) {
            await createNotification(ad.id, title, msg, 'LEAVE_REQUEST', result.insertId);
            notified.add(ad.id);
        }

        // Get Manager
        if (empRows[0].reporting_to) {
            const [mgrRows] = await db.execute("SELECT user_id FROM employees WHERE id = ?", [empRows[0].reporting_to]);
            if (mgrRows.length > 0) {
                const mgrUserId = mgrRows[0].user_id;
                if (!notified.has(mgrUserId)) {
                    await createNotification(mgrUserId, title, msg, 'LEAVE_REQUEST', result.insertId);
                    notified.add(mgrUserId);
                }
            }
        }
    } catch(err) {
        console.error("Failed to send leave notifications", err);
    }

    res.status(201).json({ success: true, message: "Leave applied successfully.", id: result.insertId });
  } catch (error) {
    console.error("Apply Leave Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Get Leaves
exports.getLeaves = async (req, res) => {
  try {
    const userId = req.user.id;
    const roleId = req.user.role_id;
    const [roleRows] = await db.execute("SELECT role_name FROM roles WHERE id = ?", [roleId]);
    const roleName = roleRows[0]?.role_name?.toUpperCase();

    let query = `
      SELECT 
        l.*, 
        e.first_name, 
        e.last_name, 
        e.employee_code,
        r.role_name AS updated_by_role_name,
        ur.role_name AS applicant_role_name
      FROM leave_requests l 
      JOIN employees e ON l.user_id = e.user_id
      LEFT JOIN roles r ON l.updated_by_role_id = r.id
      JOIN users u ON l.user_id = u.id
      JOIN roles ur ON u.role_id = ur.id
    `;
    let params = [];

    if (req.query.my === 'true') {
        query += " WHERE l.user_id = ? ORDER BY l.id DESC";
        params = [userId];
    } else if (["SUPER_ADMIN", "ADMIN", "HR"].includes(roleName)) {
        query += " ORDER BY l.id DESC";
    } else if (["MANAGER", "TL"].includes(roleName)) {
        const [mgr] = await db.execute("SELECT id FROM employees WHERE user_id = ?", [userId]);
        query += " WHERE l.user_id = ? OR e.reporting_to = ? ORDER BY l.id DESC";
        params = [userId, mgr[0]?.id || 0];
    } else {
        query += " WHERE l.user_id = ? ORDER BY l.id DESC";
        params = [userId];
    }

    const [rows] = await db.execute(query, params);
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// Update Status with Hierarchy
exports.updateLeaveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const adminId = req.user.id;
    const adminRoleId = req.user.role_id;
    
    // Safety check for role name
    let adminRoleName = req.user.role?.toUpperCase();
    if (!adminRoleName && req.user.role_id) {
        const [roleRows] = await db.execute("SELECT role_name FROM roles WHERE id = ?", [adminRoleId]);
        adminRoleName = roleRows[0]?.role_name?.toUpperCase();
    }

    if (!["APPROVED", "REJECTED"].includes(status)) return res.status(400).json({ message: "Invalid status" });

    // 1. Get current leave state
    const [leaveRows] = await db.execute("SELECT * FROM leave_requests WHERE id = ?", [id]);
    if (leaveRows.length === 0) return res.status(404).json({ message: "Leave not found" });
    const leave = leaveRows[0];

    // Hierarchy Logic
    const getRank = (roleName) => {
        if (roleName === "SUPER_ADMIN") return 3;
        if (roleName === "ADMIN" || roleName === "HR") return 2;
        if (roleName === "MANAGER") return 1;
        return 0;
    };

    if (leave.user_id === adminId) {
        return res.status(403).json({ message: "You cannot approve or reject your own leave." });
    }

    // Fetch leave applicant's role to determine hierarchy
    const [applicantRoleRows] = await db.execute(`
        SELECT r.role_name 
        FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE u.id = ?
    `, [leave.user_id]);
    const applicantRoleName = applicantRoleRows[0]?.role_name?.toUpperCase() || "";

    const currentRank = getRank(adminRoleName);
    
    // Fetch previous updater's role rank
    let previousRank = 0;
    if (leave.updated_by_role_id) {
        const [roleRows] = await db.execute("SELECT role_name FROM roles WHERE id = ?", [leave.updated_by_role_id]);
        if (roleRows.length > 0) {
            previousRank = getRank(roleRows[0].role_name.toUpperCase());
        }
    }

    // Permission Checks:
    let allowed = false;

    if (applicantRoleName === "MANAGER") {
        if (adminRoleName === "SUPER_ADMIN" || adminRoleName === "ADMIN" || adminRoleName === "HR") {
            allowed = true;
        }
    } else if (applicantRoleName === "ADMIN" || applicantRoleName === "HR") {
        if (adminRoleName === "SUPER_ADMIN" || adminRoleName === "ADMIN" || adminRoleName === "HR") {
            allowed = true;
        }
    } else if (applicantRoleName === "SUPER_ADMIN") {
        if (adminRoleName === "SUPER_ADMIN") {
            allowed = true;
        }
    } else {
        if (adminRoleName === "SUPER_ADMIN") {
            allowed = true;
        } else if (adminRoleName === "ADMIN" || adminRoleName === "HR") {
            if (leave.status === "PENDING" || previousRank <= 1) {
                allowed = true;
            }
        } else if (adminRoleName === "MANAGER") {
            if (leave.status === "PENDING") {
                allowed = true;
            }
        } else if (adminRoleName === "TL") {
            if (leave.status === "PENDING") {
                allowed = true;
            }
        }
    }

    if (!allowed) {
        return res.status(403).json({ message: "You do not have permission to modify this leave decision." });
    }

    // 2. Update
    await db.execute(
        "UPDATE leave_requests SET status = ?, updated_by = ?, updated_by_role_id = ? WHERE id = ?", 
        [status, adminId, adminRoleId, id]
    );

    try {
        await addActivity("LEAVE", `Leave request #${id} marked as ${status} by ${adminRoleName}`, status === "APPROVED" ? "#10b981" : "#ef4444");
    } catch(err) { console.error("Could not add activity", err); }
    
    res.status(200).json({ success: true, message: `Leave ${status} successfully.` });
  } catch (error) {
    console.error("Update Status Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Toggle Casual Leave Carry Forward
exports.toggleCasualLeaveCarryForward = async (req, res) => {
    try {
        let adminRoleName = req.user.role?.toUpperCase();
        if (!adminRoleName && req.user.role_id) {
            const [roleRows] = await db.execute("SELECT role_name FROM roles WHERE id = ?", [req.user.role_id]);
            adminRoleName = roleRows[0]?.role_name?.toUpperCase();
        }

        if (adminRoleName !== "SUPER_ADMIN") {
            return res.status(403).json({ message: "Only Super Admin can change carry-forward policies." });
        }

        const { carry_forward } = req.body; 
        
        await db.execute(
            "UPDATE leave_types SET carry_forward = ? WHERE leave_name = 'Casual Leave'",
            [carry_forward ? 1 : 0]
        );

        try {
            await addActivity("SYSTEM", `Casual Leave carry-forward set to ${carry_forward ? 'ON' : 'OFF'}`, "#3b82f6");
        } catch(err) { console.error("Could not add activity", err); }
        
        res.status(200).json({ success: true, message: `Casual Leave carry-forward policy updated.` });
    } catch (error) {
        console.error("Toggle Carry Forward Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};
