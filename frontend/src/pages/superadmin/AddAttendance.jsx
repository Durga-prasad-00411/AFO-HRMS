import React from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/holidays.css";

const AddAttendance = () => {
  const navigate = useNavigate();

  return (
    <div className="page-container">
      <h2 className="page-title">Attendance</h2>

      <button
        className="primary-btn"
        onClick={() => navigate("/superadmin/add-attendance")}
      >
        + Add Attendance
      </button>
    </div>
  );
};

export default AddAttendance;