import React, { useState, useEffect } from "react";
import { FaSearch } from "react-icons/fa";
import axios from "axios";
import "../../styles/tables.css";

const AttendanceDetails = () => {
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

  const API_URL = "http://localhost:5000/api/attendance/today";

  const fetchAttendance = async () => {
    try {
      const res = await axios.get(`${API_URL}?date=${filterDate}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setEmployees(res.data);
    } catch (error) {
      console.error("Error fetching attendance details:", error);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [filterDate]);

  const filteredEmployees = employees.filter((emp) =>
    (emp.first_name + " " + (emp.last_name || "")).toLowerCase().includes(searchTerm.toLowerCase()) || 
    emp.employee_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="simple-container theme-blue">
      <h2 className="page-title">Attendance Details</h2>

      {/* TOP BAR */}
      <div className="top-bar">
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <label style={{fontWeight: 600, color: '#4b5563'}}>Date:</label>
            <input
                type="date"
                className="search-input"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                style={{ width: 'auto' }}
            />
        </div>

        <div className="search-wrapper">
          <input
            type="text"
            placeholder="Search employee..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <FaSearch className="search-icon" />
        </div>
      </div>

      {/* TABLE */}
      <div className="table-wrapper">
        <table className="leave-table">
          <thead>
            <tr>
              <th>Employee Code</th>
              <th>Employee Name</th>
              <th>Check-In Time</th>
              <th>Check-Out Time</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.length > 0 ? (
              filteredEmployees.map((emp, idx) => (
                <tr key={idx}>
                  <td>{emp.employee_code}</td>
                  <td>{emp.first_name} {emp.last_name}</td>
                  <td>{emp.check_in || 'N/A'}</td>
                  <td>{emp.check_out || 'N/A'}</td>
                  <td>
                    <span style={{ 
                        padding: '4px 8px', borderRadius: '4px', 
                        background: emp.status === 'CHECKED_IN' ? '#ecfdf5' : '#f8fafc', 
                        color: emp.status === 'CHECKED_IN' ? '#10b981' : '#64748b',
                        border: emp.status === 'CHECKED_IN' ? '1px solid #a7f3d0' : '1px solid #e2e8f0',
                        fontWeight: 500
                    }}>
                        {emp.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5">No attendance records found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceDetails;
