import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../../styles/holidays.css";
import Toast from "../../components/Toast";

const AddAppreciation = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [awardTitles, setAwardTitles] = useState([]);
  const [awardTypes, setAwardTypes] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [employeeSearch, setEmployeeSearch] = useState("");

  const [formData, setFormData] = useState({
    employeeName: "",
    employeeId: "",
    awardTitle: "",
    awardType: "",
    awardDate: "",
    awardPeriod: "",
    givenBy: "",
    description: ""
  });

  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });

  // ✅ Fetch Award Titles & Types from DB
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await fetch("http://localhost:5000/api/awards", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const data = await res.json();

        if (res.ok && Array.isArray(data)) {
          const uniqueTitles = [...new Set(data.map(a => a.award_title))].filter(Boolean);
          const uniqueTypes = [...new Set(data.map(a => a.award_type))].filter(Boolean);

          setAwardTitles(uniqueTitles.map((t, i) => ({ id: i, name: t })));
          setAwardTypes(uniqueTypes.map((t, i) => ({ id: i, name: t })));
        }

      } catch (error) {
        console.error("Error fetching dropdown data", error);
      }
    };

    fetchDropdownData();
  }, []);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:5000/api/employees", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const data = await res.json();
        setEmployees(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching employees", error);
        setEmployees([]);
      }
    };

    fetchEmployees();
  }, []);

  useEffect(() => {
    if (isEditMode) {
      const token = localStorage.getItem("token");
      fetch(`http://localhost:5000/api/appreciations/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
            setFormData({
              employeeName: data.employee_name || "",
              employeeId: data.employee_id || "",
              awardTitle: data.award_title || "",
              awardType: data.award_type || "",
              awardDate: data.award_date ? data.award_date.split('T')[0] : "",
              awardPeriod: data.award_period || "",
              givenBy: data.given_by || "",
              description: data.description || ""
            });
            setEmployeeSearch(data.employee_name || "");
        })
        .catch(err => console.error(err));
    }
  }, [id, isEditMode]);

  const getEmployeeName = (employee) =>
    employee?.name?.trim() ||
    `${employee?.first_name || ""} ${employee?.last_name || ""}`.trim();

  const filteredEmployees = employees.filter((employee) => {
    const search = employeeSearch.toLowerCase();
    const employeeName = getEmployeeName(employee).toLowerCase();
    const employeeCode = String(employee.employee_code || employee.id || "").toLowerCase();
    return employeeName.includes(search) || employeeCode.includes(search);
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setErrors({});
    
    // Custom Validation
    const newErrors = {};
    const requiredFields = ['employeeId', 'awardTitle', 'awardType', 'awardDate', 'givenBy'];
    
    requiredFields.forEach(field => {
      if (!formData[field]) {
        newErrors[field] = true;
        // If employeeId is missing, also highlight the search fields
        if (field === 'employeeId') {
          newErrors.employeeSearch = true;
        }
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setToast({
        open: true,
        message: "Please fill all required fields highlighted in red.",
        severity: "error"
      });
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const url = isEditMode
        ? `http://localhost:5000/api/appreciations/update/${id}`
        : "http://localhost:5000/api/appreciations/add";
      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(
        url,
        {
          method: method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
              employeeName: formData.employeeName,
              employeeId: formData.employeeId,
              awardTitle: formData.awardTitle,
              awardType: formData.awardType,
              awardDate: formData.awardDate,
              awardPeriod: formData.awardPeriod,
              givenBy: formData.givenBy,
              description: formData.description
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setToast({ open: true, message: data.message || "Failed to submit", severity: "error" });
        return;
      }

      setToast({ open: true, message: isEditMode ? "Appreciation updated successfully!" : "Appreciation allocated successfully!", severity: "success" });
      
      setTimeout(() => {
        navigate("/superadmin/appreciation");
      }, 1500);

    } catch (error) {
      setToast({ open: true, message: "Server error. Please try again later.", severity: "error" });
    }
  };

  const handleEmployeeSelect = (e) => {
    const selectedId = e.target.value;
    const selectedEmployee = employees.find((employee) => String(employee.id) === selectedId);

    if (!selectedEmployee) {
      setFormData((prev) => ({
        ...prev,
        employeeName: "",
        employeeId: "",
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      employeeName: getEmployeeName(selectedEmployee),
      employeeId: selectedEmployee.employee_code || String(selectedEmployee.id),
    }));
  };

  return (
    <div className={`holiday-card ${Object.keys(errors).length > 0 ? "error-card" : ""}`}>
      <div className="holiday-content">
        <h2>{isEditMode ? "Edit Award Appreciation" : "Allocate Award to Employee"}</h2>

        {message && (
          <div className={isError ? "form-error" : "form-success"}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Row 1 */}
          <div className="row">
            <div className="form-group">
              <label className={errors.employeeId ? "error-label" : ""}>Employee Name <span className="required">*</span></label>
              {!isEditMode && (
                <>
                  <input
                    type="text"
                    placeholder="Search employee..."
                    className={errors.employeeSearch ? "error-field" : ""}
                    value={employeeSearch}
                    onChange={(e) => setEmployeeSearch(e.target.value)}
                  />
                  <select
                    className={errors.employeeSearch ? "error-field" : ""}
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
                </>
              )}
              <input
                type="text"
                name="employeeName"
                value={formData.employeeName}
                onChange={handleChange}
                required
                readOnly={!isEditMode}
              />
            </div>

            <div className="form-group">
              <label className={errors.employeeId ? "error-label" : ""}>
                Employee ID <span className="required">*</span>
              </label>
              <input
                type="text"
                name="employeeId"
                className={errors.employeeId ? "error-field" : ""}
                value={formData.employeeId}
                onChange={handleChange}
                readOnly={!isEditMode}
              />
            </div>
          </div>

          {/* Row 2 */}
          <div className="row">
            <div className="form-group">
              <label className={errors.awardTitle ? "error-label" : ""}>
                Award Title <span className="required">*</span>
              </label>
              <select
                name="awardTitle"
                className={errors.awardTitle ? "error-field" : ""}
                value={formData.awardTitle}
                onChange={handleChange}
              >
                <option value="">Select Award</option>
                {awardTitles.map((title) => (
                  <option key={title.id} value={title.name}>
                    {title.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className={errors.awardType ? "error-label" : ""}>
                Award Type <span className="required">*</span>
              </label>
              <select
                name="awardType"
                className={errors.awardType ? "error-field" : ""}
                value={formData.awardType}
                onChange={handleChange}
              >
                <option value="">Select Type</option>
                {awardTypes.map((type) => (
                  <option key={type.id} value={type.name}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3 */}
          <div className="row">
            <div className="form-group">
              <label className={errors.awardDate ? "error-label" : ""}>
                Award Date <span className="required">*</span>
              </label>
              <input
                type="date"
                name="awardDate"
                className={errors.awardDate ? "error-field" : ""}
                value={formData.awardDate}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Award Period</label>
              <input
                type="text"
                name="awardPeriod"
                placeholder="Ex: Jan 2026"
                value={formData.awardPeriod}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label className={errors.givenBy ? "error-label" : ""}>
              Given By <span className="required">*</span>
            </label>
            <input
              type="text"
              name="givenBy"
              className={errors.givenBy ? "error-field" : ""}
              value={formData.givenBy}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Description (Optional)</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <div className="button-bar">
            <button type="submit" className="btn-add">
              {isEditMode ? "Update" : "Allocate"}
            </button>
            <button
              type="button"
              className="btn-cancel"
              onClick={() => navigate("/superadmin/appreciation")}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      <Toast 
        open={toast.open} 
        message={toast.message} 
        severity={toast.severity} 
        handleClose={() => setToast({ ...toast, open: false })}
      />
    </div>
  );
};

export default AddAppreciation;
