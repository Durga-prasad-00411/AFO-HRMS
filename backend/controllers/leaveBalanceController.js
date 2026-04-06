const db = require("../config/db");

// Helper to calculate total months since joining
const getMonthsSinceJoining = (joiningDateStr) => {
  const joining = new Date(joiningDateStr);
  const now = new Date();
  let months = (now.getFullYear() - joining.getFullYear()) * 12 + (now.getMonth() - joining.getMonth());
  return Math.max(0, months);
};

// Get current month start/end for non-carry forward leaves
const getCurrentMonthRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { start, end };
};

exports.getLeaveBalances = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Get Employee Info
    const [empRows] = await db.execute(
      "SELECT joining_date FROM employees WHERE user_id = ?",
      [userId]
    );

    if (empRows.length === 0) return res.status(404).json({ message: "Employee profile not found" });

    const joiningDate = empRows[0].joining_date;
    const monthsPassed = getMonthsSinceJoining(joiningDate);
    const { start: monthStart, end: monthEnd } = getCurrentMonthRange();

    // 2. Get All Active Leave Types
    const [leaveTypes] = await db.execute(
      "SELECT id, leave_name, leave_type, monthly_accrual, carry_forward, status FROM leave_types WHERE status = 'Active' ORDER BY id ASC"
    );

    const balances = [];

    for (const lt of leaveTypes) {
      let totalAccrued = 0;
      let usedDays = 0;
      const totalMonths = monthsPassed + 1;

      if (lt.carry_forward) {
        totalAccrued = totalMonths * lt.monthly_accrual;
        const [usedRows] = await db.execute(
          "SELECT duration FROM leave_requests WHERE user_id = ? AND UPPER(status) = 'APPROVED' AND leave_type = ?",
          [userId, lt.leave_name]
        );
        usedRows.forEach(leave => {
          usedDays += parseFloat(leave.duration || 0);
        });
      } else {
        totalAccrued = lt.monthly_accrual;
        const [usedRows] = await db.execute(
          `SELECT duration FROM leave_requests 
           WHERE user_id = ? AND UPPER(status) = 'APPROVED' AND leave_type = ?
           AND start_date >= ? AND end_date <= ?`,
          [userId, lt.leave_name, monthStart, monthEnd]
        );
        usedRows.forEach(leave => {
          usedDays += parseFloat(leave.duration || 0);
        });
      }

      balances.push({
        id: lt.id,
        leave_name: lt.leave_name,
        type_name: lt.leave_type,
        total_days: totalAccrued,
        used_days: usedDays,
        remaining_days: parseFloat((totalAccrued - usedDays).toFixed(2)),
        carry_forward: lt.carry_forward,
        monthly_accrual: lt.monthly_accrual
      });
    }

    res.status(200).json(balances);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error", devError: error.message });
  }
};

exports.getAllLeaveBalances = async (req, res) => {
  try {
    const [employees] = await db.execute("SELECT id, user_id, first_name, last_name, employee_code, joining_date FROM employees WHERE status = 'Active'");
    const [leaveTypes] = await db.execute("SELECT id, leave_name, leave_type, monthly_accrual, carry_forward FROM leave_types WHERE status = 'Active'");

    const { start: monthStart, end: monthEnd } = getCurrentMonthRange();
    const allStats = [];

    for (const emp of employees) {
      const totalMonths = getMonthsSinceJoining(emp.joining_date) + 1;
      for (const lt of leaveTypes) {
        let totalAccrued = 0, usedDays = 0;
        if (lt.carry_forward) {
            totalAccrued = totalMonths * lt.monthly_accrual;
            const [usedRows] = await db.execute("SELECT duration FROM leave_requests WHERE user_id = ? AND UPPER(status) = 'APPROVED' AND leave_type = ?", [emp.user_id, lt.leave_name]);
            usedRows.forEach(leave => {
                usedDays += parseFloat(leave.duration || 0);
            });
        } else {
            totalAccrued = lt.monthly_accrual;
            const [usedRows] = await db.execute(`SELECT duration FROM leave_requests WHERE user_id = ? AND UPPER(status) = 'APPROVED' AND leave_type = ? AND start_date >= ? AND end_date <= ?`, [emp.user_id, lt.leave_name, monthStart, monthEnd]);
            usedRows.forEach(leave => {
                usedDays += parseFloat(leave.duration || 0);
            });
        }
        allStats.push({
          id: `EMP-${emp.user_id}-LT-${lt.id}`,
          first_name: emp.first_name, last_name: emp.last_name, employee_code: emp.employee_code,
          leave_name: lt.leave_name, type_name: lt.leave_type,
          total_days: totalAccrued, used_days: usedDays,
          remaining_days: parseFloat((totalAccrued - usedDays).toFixed(2)), carry_forward: lt.carry_forward
        });
      }
    }
    res.status(200).json(allStats);
  } catch (error) { console.error(error); res.status(500).json({ message: "Server Error", devError: error.message }); }
};

exports.getEmployeeLeaveBalances = async (req, res) => {
    try {
        // We can reuse the my-balances logic here if we need to show individual balances for a specific user.
        // For now, this is a placeholder if not fully implemented in the spec, or we can just return empty arrays.
        res.status(200).json([]);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};
