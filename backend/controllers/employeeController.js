const pool = require("../config/db");
const { addActivity } = require("./activityController");
const bcrypt = require("bcrypt");

const normalizeRole = (role) =>
  String(role || "")
    .trim()
    .replace(/\s+/g, "_")
    .toUpperCase();

const resolveRoleId = async (connection, employeeRole) => {
  const role = normalizeRole(employeeRole);

  const roleCandidates = {
    SUPER_ADMIN: ["SUPER_ADMIN"],
    ADMIN: ["ADMIN", "HR"],
    HR: ["HR", "ADMIN"],
    MANAGER: ["MANAGER"],
    TL: ["TL", "TEAM_LEAD", "TEAMLEADER"],
    TEAM_LEAD: ["TEAM_LEAD", "TL", "TEAMLEADER"],
    TEAMLEADER: ["TEAMLEADER", "TEAM_LEAD", "TL"],
    EMPLOYEE: ["EMPLOYEE"],
  };

  const candidates = roleCandidates[role] || ["EMPLOYEE"];

  for (const candidate of candidates) {
    const [rows] = await connection.query(
      `SELECT id
       FROM roles
       WHERE UPPER(REPLACE(role_name, ' ', '_')) = ?
       LIMIT 1`,
      [candidate]
    );

    if (rows.length > 0) {
      return rows[0].id;
    }
  }

  return 5;
};

exports.addEmployee = async (req, res) => {
  let connection;

  try {
    console.log("Adding employee - Request Body:", req.body);
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const {
      first_name,
      last_name,
      email,
      phone,
      password,
      gender,
      date_of_birth,
      address,
      office_location,
      aadhaar_number,
      pan_number,
      experience_years,
      joining_date,
      hire_date,
      employment_type,
      department_id,
      designation_id,
      reporting_to,
      company_type,
      onboarding_status,
      hierarchy_level,
      role_responsibility,
      employee_role,
      notice_period,
      probation_applicable,
      probation_end_date,
      previous_company,
      salary,
      bank_name,
      branch_name,
      account_number,
      ifsc_code,
      shift_id,
      status,
      work_type,
      home_lat,
      home_long
    } = req.body;

    if (!first_name || !email || !password) {
      return res.status(400).json({ error: "Required fields missing" });
    }

    const username = email;
    const role_id = await resolveRoleId(connection, employee_role);
    const resolved_shift_id = shift_id || 1;

    const hashedPassword = await bcrypt.hash(password, 10);

    const [userResult] = await connection.query(
      `INSERT INTO users (username,email,password,role_id,shift_id)
       VALUES (?,?,?,?,?)`,
      [username, email, hashedPassword, role_id, resolved_shift_id]
    );

    const userId = userResult.insertId;
    console.log("User created with ID:", userId);

    const [rows] = await connection.query(
      "SELECT COUNT(*) AS total FROM employees"
    );

    const next = rows[0].total + 1;
    const employee_code = "EMP" + String(next).padStart(4, "0");

    let joiningDate = hire_date || joining_date || null;
    if (joiningDate && joiningDate.trim() === "") joiningDate = null;

    let dob = date_of_birth || null;
    if (dob && dob.trim() === "") dob = null;

    const user_photo = req.files?.profile_photo?.[0]?.filename || null;
    const aadhar_photo = req.files?.aadhaar_photo?.[0]?.filename || null;
    const pan_photo = req.files?.pan_photo?.[0]?.filename || null;

    const [employeeResult] = await connection.query(
      `INSERT INTO employees (
        user_id, department_id, designation_id, employee_code, first_name, last_name, gender,
        date_of_birth, phone, address, office_location, aadhar_number, pan_number, experience_years,
        user_photo, aadhar_photo, pan_photo, joining_date, employment_type, reporting_to,
        company_type, onboarding_status, hierarchy_level, role_responsibility, notice_period_days,
        previous_company, salary, status, work_type, home_lat, home_long
      )
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,UPPER(?),UPPER(?),?,?)`,
      [
        userId, department_id || null, designation_id || null, employee_code, first_name, last_name || null,
        gender || null, dob, phone || null, address || null, office_location || null, aadhaar_number || null,
        pan_number || null, experience_years || null, user_photo, aadhar_photo, pan_photo, joiningDate,
        employment_type || "FULL_TIME", reporting_to || null, company_type || null, onboarding_status || 'Pending',
        hierarchy_level || null, role_responsibility || null, notice_period || null, previous_company || null,
        salary || null, status || 'ACTIVE', work_type || 'OFFICE',
        home_lat ? parseFloat(home_lat) : null, home_long ? parseFloat(home_long) : null
      ]
    );

    const employeeId = employeeResult.insertId;
    console.log("Employee record created with ID:", employeeId);

    if (probation_applicable === "YES" && probation_end_date) {
      let probStartDate = joiningDate ? new Date(joiningDate) : new Date();
      await connection.query(
        `INSERT INTO employee_probation (employee_id, probation_start_date, probation_end_date, status)
         VALUES (?, ?, ?, 'IN_PROBATION')`,
        [employeeId, probStartDate, probation_end_date]
      );
    }

    if (bank_name || account_number || ifsc_code) {
      await connection.query(
        `INSERT INTO account_details (user_id, bank_name, account_number, ifsc_code, branch_name, pan_number)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, bank_name || "N/A", account_number || "N/A", ifsc_code || "N/A", branch_name || null, pan_number || null]
      );
    }

    await connection.query(`INSERT INTO leave_balance (user_id) VALUES (?)`, [userId]);
    await connection.commit();
    await addActivity('EMPLOYEE', `New employee onboarded: <b>${first_name} ${last_name || ''}</b>`, '#3b82f6');

    res.status(201).json({ message: "Employee Added Successfully", employee_code });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("ADD EMPLOYEE ERROR:", error);
    res.status(500).json({ error: error.sqlMessage || error.message });
  } finally {
    if (connection) connection.release();
  }
};

exports.getAllEmployees = async (req, res) => {
  try {
    const [employees] = await pool.query(`
      SELECT e.*, d.name AS department, ds.name AS designation, s.shift_name AS shift,
      CONCAT(e.first_name, ' ', IFNULL(e.last_name, '')) AS name, u.email
      FROM employees e
      JOIN users u ON e.user_id = u.id
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN designations ds ON e.designation_id = ds.id
      LEFT JOIN add_shifts s ON u.shift_id = s.id
      WHERE r.role_name != 'SUPER_ADMIN'
      ORDER BY e.id ASC
    `);
    res.status(200).json(employees);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    const [employee] = await pool.query(`
      SELECT e.*, u.email, u.username, u.shift_id, ad.bank_name, ad.branch_name, ad.account_number, ad.ifsc_code,
      ep.probation_start_date, ep.probation_end_date, ep.status AS probation_status
      FROM employees e
      JOIN users u ON e.user_id = u.id
      LEFT JOIN account_details ad ON u.id = ad.user_id
      LEFT JOIN employee_probation ep ON e.id = ep.employee_id
      WHERE e.id = ?
    `, [id]);
    if (employee.length === 0) return res.status(404).json({ error: "Employee not found" });
    res.status(200).json(employee[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateEmployee = async (req, res) => {
  console.log("Updating employee - Request Body:", req.body);
  console.log("Updating employee - Request Files:", req.files);
  let connection;
  try {
    const { id } = req.params;
    const {
      first_name, last_name, email, phone, gender, date_of_birth, address, office_location,
      aadhaar_number, pan_number, experience_years, joining_date, hire_date, employment_type,
      department_id, designation_id, reporting_to, company_type, onboarding_status,
      hierarchy_level, role_responsibility, notice_period, probation_end_date,
      previous_company, salary, bank_name, branch_name, account_number, ifsc_code,
      shift_id, status, work_type, home_lat, home_long, password
    } = req.body;

    if (!first_name || !email) return res.status(400).json({ error: "First name and email are required" });

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [rows] = await connection.query("SELECT id, user_id FROM employees WHERE id = ?", [id]);
    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Employee not found" });
    }
    const employee = rows[0];

    // Update User
    let userUpdateSql = "UPDATE users SET email = ?, username = ?, shift_id = ? WHERE id = ?";
    let userUpdateParams = [email, email, shift_id || null, employee.user_id];
    
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      userUpdateSql = "UPDATE users SET email = ?, username = ?, shift_id = ?, password = ? WHERE id = ?";
      userUpdateParams = [email, email, shift_id || null, hashedPassword, employee.user_id];
    }
    await connection.query(userUpdateSql, userUpdateParams);

    // Images Handling for update
    const user_photo   = req.files?.profile_photo?.[0]?.filename || null;
    const aadhar_photo = req.files?.aadhaar_photo?.[0]?.filename || null;
    const pan_photo    = req.files?.pan_photo?.[0]?.filename || null;

    // Update Employee
    let empUpdateSql = `UPDATE employees SET
        department_id = ?, designation_id = ?, first_name = ?, last_name = ?, gender = ?,
        date_of_birth = ?, phone = ?, address = ?, office_location = ?, aadhar_number = ?,
        pan_number = ?, experience_years = ?, joining_date = ?, employment_type = ?,
        reporting_to = ?, company_type = ?, onboarding_status = ?, hierarchy_level = ?,
        role_responsibility = ?, notice_period_days = ?, previous_company = ?, salary = ?,
        status = UPPER(?), work_type = UPPER(?), home_lat = ?, home_long = ?`;
    
    let empUpdateParams = [
        department_id || null, designation_id || null, first_name, last_name || null, gender || null,
        date_of_birth || null, phone || null, address || null, office_location || null, aadhaar_number || null,
        pan_number || null, experience_years || null, hire_date || joining_date || null, employment_type || null,
        reporting_to || null, company_type || null, onboarding_status || 'Pending', hierarchy_level || null,
        role_responsibility || null, notice_period || null, previous_company || null, salary || null,
        status || 'ACTIVE', work_type || 'OFFICE', 
        home_lat ? parseFloat(home_lat) : null, home_long ? parseFloat(home_long) : null
    ];

    // Conditionally add photo updates if new files provided
    if (user_photo) {
      empUpdateSql += `, user_photo = ?`;
      empUpdateParams.push(user_photo);
    }
    if (aadhar_photo) {
      empUpdateSql += `, aadhar_photo = ?`;
      empUpdateParams.push(aadhar_photo);
    }
    if (pan_photo) {
      empUpdateSql += `, pan_photo = ?`;
      empUpdateParams.push(pan_photo);
    }

    empUpdateSql += ` WHERE id = ?`;
    empUpdateParams.push(id);

    await connection.query(empUpdateSql, empUpdateParams);

    // Update Bank Details
    await connection.query(
      `INSERT INTO account_details (user_id, bank_name, account_number, ifsc_code, branch_name)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE bank_name = VALUES(bank_name), account_number = VALUES(account_number), 
       ifsc_code = VALUES(ifsc_code), branch_name = VALUES(branch_name)`,
      [employee.user_id, bank_name || "N/A", account_number || "N/A", ifsc_code || "N/A", branch_name || null]
    );

    await connection.commit();
    await addActivity('EMPLOYEE', `Employee profile updated: <b>${first_name} ${last_name || ''}</b>`, '#f59e0b');
    res.json({ message: "Employee updated successfully" });
  } catch (error) {
    if (connection) await connection.rollback();
    res.status(500).json({ error: error.sqlMessage || error.message });
  } finally {
    if (connection) connection.release();
  }
};

exports.deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query("DELETE FROM employees WHERE id = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Employee not found" });
    res.json({ message: "Employee deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.sqlMessage || error.message });
  }
};

exports.updateEmployeeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    if (!status) return res.status(400).json({ error: "Status is required" });
    const uppercaseStatus = status.toUpperCase();
    const [result] = await pool.query(
      "UPDATE employees SET status = UPPER(?), status_reason = ? WHERE id = ?",
      [uppercaseStatus, reason || null, id]
    );
    await addActivity('EMPLOYEE', `Employee status changed to <b>${uppercaseStatus}</b> for ID: ${id}`, '#ef4444');
    if (result.affectedRows === 0) return res.status(404).json({ error: "Employee not found" });
    res.json({ message: "Employee status updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.sqlMessage || error.message });
  }
};
