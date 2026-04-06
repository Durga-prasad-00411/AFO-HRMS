const db = require("../config/db");
const { addActivity } = require("./activityController");

const OFFICE_LAT          = parseFloat(process.env.OFFICE_LAT)          || 17.4483;
const OFFICE_LONG         = parseFloat(process.env.OFFICE_LONG)         || 78.3915;
const OFFICE_RADIUS_METERS = parseInt(process.env.OFFICE_RADIUS_METERS) || 100;
const WFH_RADIUS_METERS    = 100; // Fixed 100m radius from employee's registered home

// ── Haversine distance (metres) ──────────────────────────────────────────────
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const f1 = lat1 * Math.PI / 180;
  const f2 = lat2 * Math.PI / 180;
  const df = (lat2 - lat1) * Math.PI / 180;
  const dl = (lon2 - lon1) * Math.PI / 180;
  const a  = Math.sin(df/2)**2 + Math.cos(f1) * Math.cos(f2) * Math.sin(dl/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Helper: fetch employee profile (work_type + home coords) ─────────────────
// Gracefully falls back to OFFICE defaults if migration hasn't been run yet
async function getEmployeeProfile(userId) {
  const fallback = { work_type: 'OFFICE', home_lat: null, home_long: null };
  try {
    const [rows] = await db.execute(
      `SELECT
         COALESCE(e.work_type, 'OFFICE') AS work_type,
         e.home_lat,
         e.home_long
       FROM employees e
       WHERE e.user_id = ?
       LIMIT 1`,
      [userId]
    );
    return rows.length > 0 ? rows[0] : fallback;
  } catch (err) {
    // Columns don't exist yet (migration pending) – fall back to OFFICE
    console.warn('[attendance] getEmployeeProfile fallback (run migration):', err.code);
    return fallback;
  }
}

// ── Geo-fence helpers ───────────────────────────────────────────────────────
function isAtOffice(lat, lon) {
  return getDistance(OFFICE_LAT, OFFICE_LONG, lat, lon) <= OFFICE_RADIUS_METERS;
}
function isAtHome(lat, lon, homeLat, homeLong, radiusMeters) {
  return getDistance(homeLat, homeLong, lat, lon) <= radiusMeters;
}

exports.addManualAttendance = async (req, res) => {
  try {
    const { employeeCode, date, inTime, outTime } = req.body;

    const [employees] = await db.execute(
      "SELECT user_id FROM employees WHERE employee_code = ?",
      [employeeCode]
    );

    if (employees.length === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const userId = employees[0].user_id;
    let status = outTime ? "CHECKED_OUT" : "CHECKED_IN";
    const [existing] = await db.execute(
      "SELECT id FROM attendance WHERE user_id = ? AND attendance_date = ?",
      [userId, date]
    );

    if (existing.length > 0) {
      await db.execute(
        "UPDATE attendance SET check_in = ?, check_out = ?, status = ? WHERE id = ?",
        [inTime || null, outTime || null, status, existing[0].id]
      );
      return res.status(200).json({ success: true, message: "Attendance updated successfully" });
    } else {
      const [result] = await db.execute(
        "INSERT INTO attendance (user_id, attendance_date, check_in, check_out, status) VALUES (?, ?, ?, ?, ?)",
        [userId, date, inTime || null, outTime || null, status]
      );
      return res.status(201).json({ success: true, message: "Attendance added successfully", id: result.insertId });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
};

exports.checkIn = async (req, res) => {
  try {
    const userId = req.user.id;
    const today  = new Date().toISOString().split('T')[0];
    const now    = new Date().toTimeString().split(' ')[0];

    // ── Already checked in today? ────────────────────────────────────────────
    const [existing] = await db.execute(
      "SELECT id FROM attendance WHERE user_id = ? AND attendance_date = ?",
      [userId, today]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: "Already checked in today" });
    }

    const profile = await getEmployeeProfile(userId);
    const { work_type: workType, home_lat, home_long } = profile;
    const { location, work_mode: requestedMode } = req.body;

    let resolvedWorkMode = 'OFFICE';
    let lat = null, lon = null;

    // ── Rule engine per work type ────────────────────────────────────────────
    if (workType === 'WFH') {
      // WFH: Only capture location, NO distance check
      if (!location?.latitude || !location?.longitude) {
        return res.status(400).json({
          message: "Location access is required for WFH attendance verification."
        });
      }
      lat = location.latitude;
      lon = location.longitude;
      resolvedWorkMode = 'WFH';

    } else if (workType === 'OFFICE') {
      // OFFICE: Purely capture location, NO distance check per user request
      if (!location?.latitude || !location?.longitude) {
        return res.status(400).json({
          message: "Location access is required for Office employees."
        });
      }
      lat = location.latitude;
      lon = location.longitude;
      resolvedWorkMode = 'OFFICE';

    } else if (workType === 'HYBRID') {
      // HYBRID: employee picks mode each day
      //   OFFICE mode → office geo-fence
      //   WFH mode    → home location geo-fence
      const chosenMode = (requestedMode || 'OFFICE').toUpperCase();

      if (chosenMode === 'OFFICE') {
        if (!location?.latitude || !location?.longitude) {
          return res.status(400).json({
            message: "Location access is required when checking in from Office."
          });
        }
        lat = location.latitude;
        lon = location.longitude;
        resolvedWorkMode = 'OFFICE';

      } else {
        // Hybrid WFH day – Purely capture location, NO distance check
        if (!location?.latitude || !location?.longitude) {
          return res.status(400).json({
            message: "Location access is required for WFH verification."
          });
        }
        lat = location.latitude;
        lon = location.longitude;
        resolvedWorkMode = 'WFH';
      }
    }

    // ── Save attendance record ─────────────────────────────────────────────
    // Try with work_mode column first; fall back to old schema if not migrated
    try {
      await db.execute(
        `INSERT INTO attendance
           (user_id, attendance_date, check_in, latitude, longitude, status, work_mode)
         VALUES (?, ?, ?, ?, ?, 'CHECKED_IN', ?)`,
        [userId, today, now, lat, lon, resolvedWorkMode]
      );
    } catch (insertErr) {
      if (insertErr.code === 'ER_BAD_FIELD_ERROR') {
        // work_mode column doesn't exist yet – use old schema
        await db.execute(
          `INSERT INTO attendance
             (user_id, attendance_date, check_in, latitude, longitude, status)
           VALUES (?, ?, ?, ?, ?, 'CHECKED_IN')`,
          [userId, today, now, lat, lon]
        );
      } else {
        throw insertErr;
      }
    }

    const [empRows] = await db.query(
      "SELECT first_name, last_name FROM employees e JOIN users u ON e.user_id = u.id WHERE u.email = ?",
      [req.user.email]
    );
    const empName = empRows.length > 0
      ? `${empRows[0].first_name} ${empRows[0].last_name}`
      : `User ID ${userId}`;

    const modeLabel = resolvedWorkMode === 'WFH' ? '🏠 WFH' : '🏢 Office';
    await addActivity('ATTENDANCE', `Employee checked in (${modeLabel}): <b>${empName}</b>`, '#10b981');

    res.json({
      success: true,
      message: `Checked in successfully (${modeLabel})`,
      time: now,
      work_mode: resolvedWorkMode,
      work_type: workType
    });
  } catch (err) {
    console.error("Check-in Error:", err);
    res.status(500).json({ message: "Database error" });
  }
};

exports.checkOut = async (req, res) => {
  try {
    const userId = req.user.id;
    const today  = new Date().toISOString().split('T')[0];
    const now    = new Date().toTimeString().split(' ')[0];

    const [existing] = await db.query(
      "SELECT * FROM attendance WHERE user_id = ? AND attendance_date = ? AND status = 'CHECKED_IN'",
      [userId, today]
    );
    if (existing.length === 0) {
      return res.status(400).json({ message: "No active check-in found for today" });
    }

    const record   = existing[0];
    
    // Better fallback logic for work_mode if migration wasn't run
    let workMode = record.work_mode;
    if (!workMode) {
      const profile = await getEmployeeProfile(userId);
      // Give Hybrid the benefit of doubt (WFH rules) so they don't get stuck during check-out
      workMode = ['WFH', 'HYBRID'].includes(profile.work_type) ? 'WFH' : 'OFFICE';
    }

    const { location } = req.body;
    let lat = null, lon = null;

    if (workMode === 'OFFICE') {
      // OFFICE check-out: geo-fence at office
      if (!location?.latitude || !location?.longitude) {
        return res.status(400).json({
          message: "Location access is required to check out from office."
        });
      }
      lat = location.latitude;
      lon = location.longitude;
      if (!isAtOffice(lat, lon)) {
        const dist = Math.round(getDistance(OFFICE_LAT, OFFICE_LONG, lat, lon));
        return res.status(403).json({
          message: `Check-out denied. You are ${dist}m away from the office. Please check out within ${OFFICE_RADIUS_METERS}m of the office.`
        });
      }

    } else if (workMode === 'WFH') {
      // WFH check-out: Capture location only, NO distance check
      if (!location?.latitude || !location?.longitude) {
        return res.status(400).json({
          message: "Location access is required to check out for WFH verification."
        });
      }
      lat = location.latitude;
      lon = location.longitude;
    }

    await db.query(
      `UPDATE attendance
         SET check_out = ?, checkout_latitude = ?, checkout_longitude = ?, status = 'CHECKED_OUT'
       WHERE id = ?`,
      [now, lat, lon, record.id]
    );

    const [empRows] = await db.query(
      "SELECT first_name, last_name FROM employees e JOIN users u ON e.user_id = u.id WHERE u.email = ?",
      [req.user.email]
    );
    const empName = empRows.length > 0
      ? `${empRows[0].first_name} ${empRows[0].last_name}`
      : `User ID ${userId}`;

    const modeLabel = workMode === 'WFH' ? '🏠 WFH' : '🏢 Office';
    await addActivity('ATTENDANCE', `Employee checked out (${modeLabel}): <b>${empName}</b>`, '#3b82f6');

    res.json({
      success: true,
      message: `Checked out successfully (${modeLabel})`,
      time: now,
      work_mode: workMode
    });
  } catch (err) {
    console.error("Check-out Error:", err);
    res.status(500).json({ message: "Database error" });
  }
};

exports.getAttendanceStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const todayDate = new Date();
    const today = todayDate.toISOString().split('T')[0];

    const day  = todayDate.getDay();
    const diff = todayDate.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(new Date().setDate(diff)).toISOString().split('T')[0];

    const [weeklyRecords] = await db.execute(
      `SELECT check_in, check_out FROM attendance
       WHERE user_id = ? AND attendance_date >= ? AND attendance_date <= ?`,
      [userId, startOfWeek, today]
    );

    const currentServerTime = new Date().toTimeString().split(' ')[0];
    let weeklySeconds = 0;
    weeklyRecords.forEach(record => {
      const tIn  = record.check_in;
      const tOut = record.check_out || currentServerTime;
      if (tIn && tOut) {
        weeklySeconds += (new Date(`1970-01-01T${tOut}Z`) - new Date(`1970-01-01T${tIn}Z`)) / 1000;
      }
    });

    const [existing] = await db.execute(
      "SELECT * FROM attendance WHERE user_id = ? AND attendance_date = ?",
      [userId, today]
    );

    // Also fetch work_type for this employee (falls back to OFFICE if migration pending)
    const profile  = await getEmployeeProfile(userId);
    const workType = profile.work_type;

    let responseData = {
      status: 'NOT_CHECKED_IN',
      weekly_hours: (weeklySeconds / 3600).toFixed(2),
      daily_hours: '0.00',
      work_type: workType,
      work_mode: null
    };

    if (existing.length > 0) {
      responseData = { ...responseData, ...existing[0] };
      const tIn  = existing[0].check_in;
      const tOut = existing[0].check_out || currentServerTime;
      if (tIn && tOut) {
        responseData.daily_hours = ((new Date(`1970-01-01T${tOut}Z`) - new Date(`1970-01-01T${tIn}Z`)) / 3600000).toFixed(2);
      }
      responseData.work_type = workType;
    }

    res.json(responseData);
  } catch (err) {
    console.error("Status check error:", err);
    res.status(500).json({ message: "Database error" });
  }
};

exports.getAttendanceSummary = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const [checkedIn] = await db.execute(
      "SELECT COUNT(*) as count FROM attendance WHERE attendance_date = ? AND status = 'CHECKED_IN'",
      [today]
    );

    const [checkedOut] = await db.execute(
      "SELECT COUNT(*) as count FROM attendance WHERE attendance_date = ? AND status = 'CHECKED_OUT'",
      [today]
    );

    res.json({
      checkedIn: checkedIn[0].count,
      checkedOut: checkedOut[0].count
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
};

exports.getTodayCheckedInEmployees = async (req, res) => {
  try {
    const targetDate = req.query.date || new Date().toISOString().split('T')[0];

    const rolesFilter = "'EMPLOYEE', 'MANAGER', 'TL', 'ADMIN', 'HR'";

    const [rows] = await db.execute(
      `SELECT 
        u.id as user_id,
        r.role_name,
        COALESCE(e.employee_code, CONCAT('ID', u.id)) as employee_code,
        COALESCE(e.first_name, u.username) as first_name,
        COALESCE(e.last_name, '') as last_name,
        a.check_in,
        a.check_out,
        COALESCE(a.status, 'NOT_CHECKED_IN') as status
      FROM users u
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN employees e ON u.id = e.user_id
      LEFT JOIN attendance a ON u.id = a.user_id AND a.attendance_date = ?
      WHERE r.role_name IN (${rolesFilter})
      ORDER BY r.role_name ASC, employee_code ASC`,
      [targetDate]
    );

    res.json(rows);
  } catch (err) {
    console.error("Fetch attendance error:", err);
    res.status(500).json({ message: "Database error" });
  }
};

exports.getMonthlySummary = async (req, res) => {
  try {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const startOfMonth = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endOfMonth = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

    const [stats] = await db.execute(
      `SELECT 
        COUNT(*) as total_records,
        COUNT(DISTINCT attendance_date) as working_days,
        SUM(CASE WHEN status = 'CHECKED_OUT' THEN 1 ELSE 0 END) as completions
       FROM attendance 
       WHERE attendance_date BETWEEN ? AND ?`,
      [startOfMonth, endOfMonth]
    );

    const [empCount] = await db.execute("SELECT COUNT(*) as count FROM employees");

    res.json({
      month: today.toLocaleString('default', { month: 'long' }),
      totalPresent: stats[0].total_records || 0,
      completionRate: stats[0].total_records > 0 ? Math.round((stats[0].completions / stats[0].total_records) * 100) : 0,
      staffCount: empCount[0].count,
      workingDays: stats[0].working_days || 0
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
};

exports.getMonthlyAttendanceLogs = async (req, res) => {
  try {
    const { month, year, day } = req.query;
    const targetMonth = month || new Date().getMonth() + 1;
    const targetYear = year || new Date().getFullYear();
    
    let startDate, endDate;
    if (day && day > 0) {
      startDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      endDate = startDate;
    } else {
      startDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
      const lastDay = new Date(targetYear, targetMonth, 0).getDate();
      endDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${lastDay}`;
    }

    const [rows] = await db.execute(
      `SELECT 
        u.id as user_id,
        r.role_name,
        COALESCE(e.employee_code, CONCAT('ID', u.id)) as employee_code,
        COALESCE(e.first_name, u.username) as first_name,
        COALESCE(e.last_name, '') as last_name,
        a.attendance_date,
        a.check_in,
        a.check_out,
        COALESCE(a.status, 'ABSENT') as status
      FROM users u
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN employees e ON u.id = e.user_id
      LEFT JOIN attendance a ON u.id = a.user_id AND a.attendance_date BETWEEN ? AND ?
      WHERE r.role_name IN ('EMPLOYEE', 'MANAGER', 'TL', 'ADMIN', 'HR')
      ORDER BY a.attendance_date DESC, r.role_name ASC, employee_code ASC`,
      [startDate, endDate]
    );

    res.json(rows);
  } catch (err) {
    console.error("Fetch monthly logs error:", err);
    res.status(500).json({ message: "Database error" });
  }
};

exports.getAttendanceSummaryGrid = async (req, res) => {
  try {
    const { month, year, my } = req.query;
    const targetMonth = month || new Date().getMonth() + 1;
    const targetYear = year || new Date().getFullYear();

    const startDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
    const lastDay = new Date(targetYear, targetMonth, 0).getDate();
    const endDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${lastDay}`;

    const rolesFilter = "'EMPLOYEE', 'MANAGER', 'TL', 'ADMIN', 'HR'";

    let employeeQuery = `SELECT 
        u.id as user_id,
        COALESCE(e.first_name, u.username) as first_name,
        COALESCE(e.last_name, '') as last_name,
        COALESCE(e.employee_code, CONCAT('ID', u.id)) as employee_code,
        d.name as department_name,
        des.name as designation_name,
        COALESCE(e.office_location, 'Head Office') as office_location,
        COALESCE(e.user_photo, '') as photo,
        r.role_name
      FROM users u
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN employees e ON u.id = e.user_id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN designations des ON e.designation_id = des.id
      WHERE r.role_name IN (${rolesFilter})`;
      
    let empParams = [];
    if (my === 'true') {
        employeeQuery += ` AND u.id = ?`;
        empParams.push(req.user.id);
    }

    const [employees] = await db.execute(employeeQuery, empParams);

    const [attendance] = await db.execute(
      `SELECT user_id, attendance_date, status 
       FROM attendance 
       WHERE attendance_date BETWEEN ? AND ?`,
      [startDate, endDate]
    );

    const [holidays] = await db.execute(
      `SELECT holiday_date, title, holiday_type 
       FROM holidays 
       WHERE holiday_date BETWEEN ? AND ?`,
      [startDate, endDate]
    );

    const [leaves] = await db.execute(
      `SELECT user_id, start_date, end_date, leave_type 
       FROM leaves 
       WHERE status = 'APPROVED' AND (start_date <= ? AND end_date >= ?)`,
      [endDate, startDate]
    );

    let totalMonthPresent = 0;
    let totalMonthAbsent = 0;
    let totalMonthLeave = 0;
    let totalMonthHoliday = 0;

    const result = employees.map(emp => {
      const dayData = {};
      let empPresent = 0;
      let empAbsent = 0;
      let empLeave = 0;
      let empHoliday = 0;
      
      for (let d = 1; d <= lastDay; d++) {
        const dateStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        
        const holiday = holidays.find(h => {
             const hDate = new Date(h.holiday_date);
             const hStr = hDate.getFullYear() + '-' + String(hDate.getMonth()+1).padStart(2,'0') + '-' + String(hDate.getDate()).padStart(2,'0');
             return hStr === dateStr;
        });
        if (holiday) {
          dayData[String(d).padStart(2, '0')] = 'HOLIDAY';
          empHoliday++;
          totalMonthHoliday++;
          continue;
        }

        const leave = leaves.find(l => {
          const sDate = new Date(l.start_date);
          const eDate = new Date(l.end_date);
          const s = sDate.getFullYear() + '-' + String(sDate.getMonth()+1).padStart(2,'0') + '-' + String(sDate.getDate()).padStart(2,'0');
          const e = eDate.getFullYear() + '-' + String(eDate.getMonth()+1).padStart(2,'0') + '-' + String(eDate.getDate()).padStart(2,'0');
          return emp.user_id === l.user_id && dateStr >= s && dateStr <= e;
        });
        if (leave) {
          dayData[String(d).padStart(2, '0')] = 'LEAVE';
          empLeave++;
          totalMonthLeave++;
          continue;
        }

        const att = attendance.find(a => {
            const aDate = new Date(a.attendance_date);
            const aStr = aDate.getFullYear() + '-' + String(aDate.getMonth()+1).padStart(2,'0') + '-' + String(aDate.getDate()).padStart(2,'0');
            return a.user_id === emp.user_id && aStr === dateStr;
        });
        
        if (att) {
          dayData[String(d).padStart(2, '0')] = 'PRESENT';
          empPresent++;
          totalMonthPresent++;
        } else {
          const dayOfWeek = new Date(dateStr).getDay();
          if (dayOfWeek === 0 || dayOfWeek === 6) {
            dayData[String(d).padStart(2, '0')] = 'WEEKEND';
          } else {
            const todayObj = new Date();
            const todayStr = todayObj.getFullYear() + '-' + String(todayObj.getMonth()+1).padStart(2,'0') + '-' + String(todayObj.getDate()).padStart(2,'0');
            if (dateStr < todayStr) {
              dayData[String(d).padStart(2, '0')] = 'ABSENT';
              empAbsent++;
              totalMonthAbsent++;
            } else {
              dayData[String(d).padStart(2, '0')] = 'PENDING';
            }
          }
        }
      }

      return {
        id: emp.user_id,
        name: `${emp.first_name} ${emp.last_name}`,
        employee_code: emp.employee_code,
        department: emp.department_name,
        designation: emp.designation_name,
        location: emp.office_location,
        photo: emp.photo,
        stats: {
          present: empPresent,
          absent: empAbsent,
          leave: empLeave,
          holiday: empHoliday
        },
        days: dayData
      };
    });

    res.json({
      daysInMonth: lastDay,
      summary: {
        totalPresent: totalMonthPresent,
        totalAbsent: totalMonthAbsent,
        totalLeave: totalMonthLeave,
        totalHoliday: totalMonthHoliday,
        staffCount: employees.length
      },
      data: result
    });

  } catch (err) {
    console.error("Attendance grid error:", err);
    res.status(500).json({ message: "Database error" });
  }
};
