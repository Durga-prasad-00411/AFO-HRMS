exports.getAttendanceSummaryGrid = async (req, res) => {
  try {
    const { month, year, my } = req.query;
    const targetMonth = month || new Date().getMonth() + 1;
    const targetYear = year || new Date().getFullYear();

    const startDate = \`\${targetYear}-\${String(targetMonth).padStart(2, '0')}-01\`;
    const lastDay = new Date(targetYear, targetMonth, 0).getDate();
    const endDate = \`\${targetYear}-\${String(targetMonth).padStart(2, '0')}-\${lastDay}\`;

    let employeeQuery = \`SELECT 
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
      WHERE r.role_name IN ('EMPLOYEE', 'MANAGER', 'TL', 'ADMIN', 'HR', 'SUPER_ADMIN')\`;
      
    let empParams = [];
    if (my === 'true') {
        employeeQuery += \` AND u.id = ?\`;
        empParams.push(req.user.id);
    }

    const [employees] = await db.execute(employeeQuery, empParams);

    const [attendance] = await db.execute(
      \`SELECT user_id, attendance_date, status 
       FROM attendance 
       WHERE attendance_date BETWEEN ? AND ?\`,
      [startDate, endDate]
    );

    const [holidays] = await db.execute(
      \`SELECT holiday_date, title, holiday_type 
       FROM holidays 
       WHERE holiday_date BETWEEN ? AND ?\`,
      [startDate, endDate]
    );

    const [leaves] = await db.execute(
      \`SELECT user_id, start_date, end_date, leave_type 
       FROM leaves 
       WHERE status = 'APPROVED' AND (start_date <= ? AND end_date >= ?)\`,
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
        const dateStr = \`\${targetYear}-\${String(targetMonth).padStart(2, '0')}-\${String(d).padStart(2, '0')}\`;
        
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
        name: \`\${emp.first_name} \${emp.last_name}\`,
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
