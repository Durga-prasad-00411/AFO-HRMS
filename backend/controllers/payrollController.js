const pool = require("../config/db");

// Get all payrolls
exports.getAllPayrolls = async (req, res) => {
  try {
    const query = `
      SELECT p.*, e.first_name, e.last_name, e.employee_code, u.email 
      FROM payroll p
      JOIN employees e ON p.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      ORDER BY p.year DESC, p.month DESC, p.id DESC
    `;
    const [payrolls] = await pool.query(query);
    res.status(200).json(payrolls);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch payrolls" });
  }
};

// Get payrolls by user ID
exports.getEmployeePayrolls = async (req, res) => {
  try {
    const { userId } = req.params;
    const query = `
      SELECT p.*, e.first_name, e.last_name, e.employee_code, e.joining_date, d.name AS designation, dept.name as department
      FROM payroll p
      JOIN employees e ON p.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      LEFT JOIN designations d ON e.designation_id = d.id
      LEFT JOIN departments dept ON e.department_id = dept.id
      WHERE u.id = ?
      ORDER BY p.year DESC, p.month DESC
    `;
    const [payrolls] = await pool.query(query, [userId]);
    res.status(200).json(payrolls);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch employee payrolls" });
  }
};

// Generate Payroll
exports.generatePayroll = async (req, res) => {
  try {
    const {
      employee_id,
      month,
      year,
      basic_salary,
      hra,
      allowances,
      pf_deduction,
      tax_deduction,
      net_salary,
      payment_date,
    } = req.body;

    if (!employee_id || !month || !year || !net_salary) {
      return res.status(400).json({ error: "Required fields are missing." });
    }

    const query = `
      INSERT INTO payroll 
      (employee_id, month, year, basic_salary, hra, allowances, pf_deduction, tax_deduction, net_salary, payment_date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'GENERATED')
    `;

    const values = [
      employee_id, month, year, 
      basic_salary || 0, hra || 0, allowances || 0, 
      pf_deduction || 0, tax_deduction || 0, net_salary, 
      payment_date || new Date().toISOString().split('T')[0]
    ];

    await pool.query(query, values);
    
    try {
      const [empRes] = await pool.query("SELECT user_id FROM employees WHERE id = ?", [employee_id]);
      if (empRes.length > 0) {
        const { createNotification } = require("./notificationController");
        // For payroll, we can use the newly inserted payroll ID as related_id
        const [lastPayroll] = await pool.query("SELECT id FROM payroll WHERE employee_id = ? AND month = ? AND year = ? ORDER BY id DESC LIMIT 1", [employee_id, month, year]);
        await createNotification(empRes[0].user_id, "Payroll Generated", `Your payslip for ${month} ${year} has been generated.`, 'PAYROLL_GENERATED', lastPayroll[0]?.id || null);
      }
    } catch (notifErr) {
      console.error("Non-fatal notification error:", notifErr);
    }
    
    res.status(201).json({ message: "Payroll Generated Successfully" });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "Payroll for this month and year already exists for this employee." });
    }
    console.error(err);
    res.status(500).json({ error: "Failed to generate payroll" });
  }
};

// Update Payroll Status
exports.updatePayrollStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await pool.query("UPDATE payroll SET status = ? WHERE id = ?", [status, id]);
    res.status(200).json({ message: "Status updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update status" });
  }
};
