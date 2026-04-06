import React, { useEffect, useMemo, useState } from "react";
import "../../styles/holidays.css";
import { useNavigate } from "react-router-dom";

const AddManualAttendance = () => {
    const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [employeeSearch, setEmployeeSearch] = useState("");

  const [form, setForm] = useState({
    employeeCode: "",
    employeeName: "",
    date: "",
    inTime: "",
    outTime: "",
    attendanceType: "Present",
    remarks: "",
  });

  /* ================= HANDLE CHANGE ================= */
const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("http://localhost:5000/api/employees", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        setEmployees(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
        setEmployees([]);
      }
    };

    fetchEmployees();
  }, []);

  const getEmployeeName = (employee) =>
    employee?.name?.trim() ||
    `${employee?.first_name || ""} ${employee?.last_name || ""}`.trim();

  const filteredEmployees = useMemo(() => {
    const search = employeeSearch.toLowerCase();
    return employees.filter((employee) => {
      const employeeName = getEmployeeName(employee).toLowerCase();
      const employeeCode = String(employee.employee_code || employee.id || "").toLowerCase();
      return employeeName.includes(search) || employeeCode.includes(search);
    });
  }, [employees, employeeSearch]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEmployeeSelect = (e) => {
    const selectedId = e.target.value;
    const selectedEmployee = employees.find(
      (employee) => String(employee.id) === selectedId
    );

    if (!selectedEmployee) {
      setForm((prev) => ({
        ...prev,
        employeeCode: "",
        employeeName: "",
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      employeeCode: selectedEmployee.employee_code || String(selectedEmployee.id),
      employeeName: getEmployeeName(selectedEmployee),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:5000/api/attendance/manual",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(form),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      alert(data.message);
      navigate("/superadmin/attendance")

      setForm({
        employeeCode: "",
        employeeName: "",
        date: "",
        inTime: "",
        outTime: "",
        attendanceType: "Present",
        remarks: "",
      });
      setEmployeeSearch("");

    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="holiday-card">
      <div className="holiday-content">

        <h2>Add Manual Attendance (Admin)</h2>

        <form onSubmit={handleSubmit}>

          {/* Employee Info */}
          <div className="row">

            <div className="form-group">
              <label>
                Employee Code <span className="required">*</span>
              </label>
              <input
                type="text"
                value={employeeSearch}
                onChange={(e) => setEmployeeSearch(e.target.value)}
                placeholder="Search employee..."
              />
              <select
                value={
                  employees.find(
                    (employee) =>
                      (employee.employee_code || String(employee.id)) === form.employeeCode
                  )?.id || ""
                }
                onChange={handleEmployeeSelect}
                required
              >
                <option value="">Select Employee</option>
                {filteredEmployees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.employee_code || employee.id} - {getEmployeeName(employee)}
                  </option>
                ))}
              </select>

              <input
                type="text"
                name="employeeCode"
                value={form.employeeCode}
                onChange={handleChange}
                placeholder="Enter Employee Code"
                required
                readOnly
              />
            </div>

            <div className="form-group">
              <label>
                Employee Name <span className="required">*</span>
              </label>

              <input
                type="text"
                name="employeeName"
                value={form.employeeName}
                onChange={handleChange}
                placeholder="Enter Employee Name"
                required
                readOnly
              />
            </div>

          </div>

          {/* Date */}
          <div className="form-group">
            <label>
              Attendance Date <span className="required">*</span>
            </label>

            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              required
            />
          </div>

          {/* In / Out Time */}
          <div className="row">

            <div className="form-group">
              <label>In Time</label>

              <input
                type="time"
                name="inTime"
                value={form.inTime}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Out Time</label>

              <input
                type="time"
                name="outTime"
                value={form.outTime}
                onChange={handleChange}
              />
            </div>

          </div>

          {/* Remarks */}
          <div className="form-group">
            <label>Remarks</label>

            <textarea
              name="remarks"
              value={form.remarks}
              onChange={handleChange}
              placeholder="Optional notes"
            />
          </div>

          {/* Buttons */}
          <div className="button-bar">

            <button type="submit" className="btn-add">
              Save
            </button>

            <button type="button" className="btn-cancel">
              Cancel
            </button>

          </div>

        </form>

      </div>
    </div>
  );
};

export default AddManualAttendance;
