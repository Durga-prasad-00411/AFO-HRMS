import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/holidays.css";

const AllocateAsset = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [formData, setFormData] = useState({
    employeeId: "",
    employeeName: "",
    department: "",
    assetType: "",
    allocationDateTime: "",
    condition: "",
    description: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("http://localhost:5000/api/employees", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        setEmployees(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Employee fetch error:", error);
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

  const handleEmployeeSelect = (e) => {
    const selectedId = e.target.value;
    const selectedEmployee = employees.find((employee) => String(employee.id) === selectedId);

    if (!selectedEmployee) {
      setFormData((prev) => ({
        ...prev,
        employeeId: "",
        employeeName: "",
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      employeeId: selectedEmployee.employee_code || String(selectedEmployee.id),
      employeeName: getEmployeeName(selectedEmployee),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (
      !formData.employeeId ||
      !formData.employeeName ||
      !formData.department ||
      !formData.assetType ||
      !formData.allocationDateTime
    ) {
      alert("Please fill all required fields!");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:5000/api/assets/allocate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to allocate asset");
      }

      alert(data.message || "Asset allocated successfully!");
      navigate("/superadmin/asset");

      
      setFormData({
        employeeId: "",
        employeeName: "",
        department: "",
        assetType: "",
        allocationDateTime: "",
        condition: "",
        description: "",
      });
      setEmployeeSearch("");

    } catch (error) {
      console.error("Allocation Error:", error);
      alert(error.message);
    }
  };

  return (
    <div className="allocate-container">
      <div className="allocate-card">
        <h2 className="allocate-title">Allocate Asset to Employee</h2>

        <form className="allocate-content" onSubmit={handleSubmit}>
          
        
          <div className="row">
            <div className="form-group">
              <label>Employee ID</label>
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
                      (employee.employee_code || String(employee.id)) === formData.employeeId
                  )?.id || ""
                }
                onChange={handleEmployeeSelect}
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
                name="employeeId"
                placeholder="Enter Employee ID"
                value={formData.employeeId}
                onChange={handleChange}
                readOnly
              />
            </div>

            <div className="form-group">
              <label>Employee Name</label>
              <input
                type="text"
                name="employeeName"
                placeholder="Enter Employee Name"
                value={formData.employeeName}
                onChange={handleChange}
                readOnly
              />
            </div>
          </div>

          
          <div className="form-group">
            <label>Department</label>
            <input
              type="text"
              name="department"
              placeholder="Enter Department"
              value={formData.department}
              onChange={handleChange}
            />
          </div>

         
          <div className="form-group">
            <label>Asset Type</label>
            <input
              type="text"
              name="assetType"
              list="assetTypes"
              placeholder="Select or Type Asset Type"
              value={formData.assetType}
              onChange={handleChange}
            />

            <datalist id="assetTypes">
              <option value="Laptop" />
              <option value="Mobile" />
              <option value="Monitor" />
              <option value="Tablet" />
              <option value="Vehicle" />
              <option value="Furniture" />
              <option value="Printer" />
              <option value="Projector" />
            </datalist>
          </div>

          
          <div className="form-group">
            <label>Allocation Date & Time</label>
            <input
              type="datetime-local"
              name="allocationDateTime"
              value={formData.allocationDateTime}
              onChange={handleChange}
            />
          </div>

          
          <div className="form-group">
            <label>Asset Condition</label>
            <select
              name="condition"
              value={formData.condition}
              onChange={handleChange}
            >
              <option value="">Select Condition</option>
              <option value="New">New</option>
              <option value="Good">Good</option>
              <option value="Damaged">Damaged</option>
            </select>
          </div>

          
          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              placeholder="Enter description"
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          
          <div className="button-bar">
            <button
              type="button"
              className="bar-btn cancel"
              onClick={() =>
                setFormData({
                  employeeId: "",
                  employeeName: "",
                  department: "",
                  assetType: "",
                  allocationDateTime: "",
                  condition: "",
                  description: "",
                })
              }
            >
              Cancel
            </button>

            <button type="submit" className="bar-btn create">
              Allocate
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AllocateAsset;
